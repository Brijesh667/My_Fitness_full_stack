import { WorkoutSession } from '../models/WorkoutSession.js';
import {
  DAY_KEYS,
  addDays,
  dayKeyFromDateKey,
  eachDate,
  startOfWeek,
  todayKey
} from '../utils/dates.js';
import { getOrCreatePlan } from './planService.js';

function resolveRange(label, anchor) {
  if (label === 'month') {
    return { from: addDays(anchor, -29), to: anchor, label };
  }
  const from = startOfWeek(anchor);
  return { from, to: addDays(from, 6), label };
}

function buildPlannedMap(plan) {
  return new Map(plan.days.map((day) => [day.day, day.muscles.length > 0]));
}

function isPlanned(plannedMap, dateKey) {
  return plannedMap.get(dayKeyFromDateKey(dateKey)) === true;
}

function scoreOf(session) {
  if (!session || !session.plannedSets) return 0;
  return Math.min(1, session.completedSets / session.plannedSets);
}

function averageScore(sessionsByDate, dates) {
  if (!dates.length) return 0;
  const total = dates.reduce((sum, date) => sum + scoreOf(sessionsByDate.get(date)), 0);
  return total / dates.length;
}

function sumSets(sessions) {
  let planned = 0;
  let completed = 0;
  let failures = 0;

  for (const session of sessions) {
    planned += session.plannedSets ?? 0;
    completed += session.completedSets ?? 0;
    for (const group of session.muscles) {
      for (const exercise of group.exercises) {
        for (const set of exercise.sets) {
          if (set.completed && set.tag === 'failure') failures += 1;
        }
      }
    }
  }

  return { planned, completed, failures };
}

function muscleBreakdown(sessions) {
  const map = new Map();

  for (const session of sessions) {
    for (const group of session.muscles) {
      const entry = map.get(group.muscle) ?? { muscle: group.muscle, completedSets: 0, plannedSets: 0, skipped: 0 };
      for (const exercise of group.exercises) {
        entry.plannedSets += exercise.sets.length;
        entry.completedSets += exercise.sets.filter((set) => set.completed).length;
        if (exercise.status === 'skipped') entry.skipped += 1;
      }
      map.set(group.muscle, entry);
    }
  }

  return [...map.values()]
    .map((entry) => ({
      ...entry,
      pct: entry.plannedSets === 0 ? 0 : Math.round((entry.completedSets / entry.plannedSets) * 100)
    }))
    .sort((a, b) => b.pct - a.pct);
}

function weekdayBreakdown(plannedDates, sessionsByDate) {
  return DAY_KEYS.map((day) => {
    const dates = plannedDates.filter((date) => dayKeyFromDateKey(date) === day);
    return {
      day,
      pct: dates.length ? Math.round(averageScore(sessionsByDate, dates) * 100) : 0,
      plannedDays: dates.length
    };
  });
}

function buildTrend(anchor, plannedMap, sessionsByDate, today) {
  const currentWeekStart = startOfWeek(anchor);
  const start = addDays(currentWeekStart, -49);
  const trend = [];

  for (let index = 0; index < 8; index += 1) {
    const weekStart = addDays(start, index * 7);
    const weekEnd = addDays(weekStart, 6);
    const end = weekEnd < today ? weekEnd : today;
    const dates =
      weekStart <= today
        ? eachDate(weekStart, end).filter((date) => isPlanned(plannedMap, date))
        : [];
    trend.push({
      weekStart,
      pct: dates.length ? Math.round(averageScore(sessionsByDate, dates) * 100) : 0
    });
  }

  return trend;
}

function buildStreak(plannedMap, sessionsByDate, today) {
  const dates = eachDate(addDays(today, -119), today).filter((date) => isPlanned(plannedMap, date));
  let current = 0;
  let best = 0;

  for (const date of dates) {
    if (scoreOf(sessionsByDate.get(date)) >= 0.8) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }

  return { current, best };
}

function buildInsights({ plannedCount, sessionsByDate, plannedDates, sessions, avgSessionMin }) {
  if (plannedCount < 3) return [];

  const insights = [];
  const muscles = muscleBreakdown(sessions);
  const weekdays = weekdayBreakdown(plannedDates, sessionsByDate).filter((day) => day.plannedDays > 0);

  if (muscles.length >= 2) {
    const strongest = muscles[0];
    const weakest = muscles[muscles.length - 1];
    insights.push({
      key: 'strongest_muscle',
      text: `${strongest.muscle} is your strongest group at ${strongest.pct}% of sets completed.`
    });
    if (weakest.muscle !== strongest.muscle) {
      insights.push({
        key: 'weakest_muscle',
        text: `${weakest.muscle} needs attention: ${weakest.pct}% of planned sets completed.`
      });
    }
  }

  if (weekdays.length >= 2) {
    const weakestDay = [...weekdays].sort((a, b) => a.pct - b.pct)[0];
    insights.push({
      key: 'weakest_weekday',
      text: `${weakestDay.day} is your least consistent day at ${weakestDay.pct}%.`
    });
  }

  const skippedCounts = new Map();
  for (const session of sessions) {
    for (const group of session.muscles) {
      for (const exercise of group.exercises) {
        if (exercise.status === 'skipped') {
          skippedCounts.set(exercise.name, (skippedCounts.get(exercise.name) ?? 0) + 1);
        }
      }
    }
  }
  const mostSkipped = [...skippedCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (mostSkipped) {
    insights.push({
      key: 'most_skipped',
      text: `${mostSkipped[0]} was skipped ${mostSkipped[1]} time${mostSkipped[1] === 1 ? '' : 's'}.`
    });
  }

  if (avgSessionMin > 0) {
    insights.push({
      key: 'gym_time',
      text: `You average ${avgSessionMin} minutes per session.`
    });
  }

  return insights;
}

function volumeBreakdown(sessions) {
  const volumes = new Map();

  for (const session of sessions) {
    for (const group of session.muscles) {
      for (const exercise of group.exercises) {
        for (const set of exercise.sets) {
          if (!set.completed || !set.weightKg) continue;
          const reps = set.actualReps ?? set.plannedReps;
          volumes.set(exercise.name, (volumes.get(exercise.name) ?? 0) + reps * set.weightKg);
        }
      }
    }
  }

  return [...volumes.entries()]
    .map(([exercise, volume]) => ({ exercise, volume: Math.round(volume) }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 10);
}

export async function getSummary(user, { range = 'week', date } = {}) {
  const anchor = date ?? todayKey();
  const rangeDates = resolveRange(range, anchor);
  const today = todayKey();
  const elapsedTo = rangeDates.to < today ? rangeDates.to : today;

  const [plan, sessions] = await Promise.all([
    getOrCreatePlan(user),
    WorkoutSession.find({ user: user._id })
  ]);

  const plannedMap = buildPlannedMap(plan);
  const sessionsByDate = new Map(sessions.map((session) => [session.date, session]));

  const plannedDates = eachDate(rangeDates.from, elapsedTo).filter((d) => isPlanned(plannedMap, d));
  const rangeSessions = sessions.filter(
    (session) => session.date >= rangeDates.from && session.date <= rangeDates.to
  );

  const consistencyPct = Math.round(averageScore(sessionsByDate, plannedDates) * 100);
  const sets = sumSets(rangeSessions);
  const gymTimeSec = rangeSessions.reduce((sum, session) => sum + (session.durationSec ?? 0), 0);
  const timedSessions = rangeSessions.filter((session) => (session.durationSec ?? 0) > 0);
  const avgSessionMin = timedSessions.length
    ? Math.round(timedSessions.reduce((sum, s) => sum + s.durationSec, 0) / timedSessions.length / 60)
    : 0;

  const streak = buildStreak(plannedMap, sessionsByDate, today);
  const muscles = muscleBreakdown(rangeSessions);
  const weekdays = weekdayBreakdown(plannedDates, sessionsByDate);
  const trend = buildTrend(anchor, plannedMap, sessionsByDate, today);

  const insights = buildInsights({
    plannedCount: plannedDates.length,
    sessionsByDate,
    plannedDates,
    sessions: rangeSessions,
    avgSessionMin
  });

  // Week-over-week change compares the anchor's week with the week before it.
  const currentStart = startOfWeek(anchor);
  const previousStart = addDays(currentStart, -7);
  const weekDates = (start) => eachDate(start, addDays(start, 6)).filter((d) => isPlanned(plannedMap, d));
  const currentDates = weekDates(currentStart);
  const previousDates = weekDates(previousStart);
  if (plannedDates.length >= 3 && previousDates.length > 0 && currentDates.length > 0) {
    const currentPct = Math.round(averageScore(sessionsByDate, currentDates) * 100);
    const previousPct = Math.round(averageScore(sessionsByDate, previousDates) * 100);
    const diff = currentPct - previousPct;
    if (diff !== 0) {
      insights.push({
        key: 'week_change',
        text: `Consistency is ${diff > 0 ? 'up' : 'down'} ${Math.abs(diff)} points from the previous week.`
      });
    }
  }

  return {
    range: { ...rangeDates },
    consistencyPct,
    streak,
    gymTimeMin: Math.round(gymTimeSec / 60),
    avgSessionMin,
    setsCompleted: sets.completed,
    setsPlanned: sets.planned,
    failureSets: sets.failures,
    muscles,
    weekdays,
    trend,
    insights,
    volume: volumeBreakdown(rangeSessions)
  };
}

export async function getHeatmap(user, days) {
  const today = todayKey();
  const from = addDays(today, -(days - 1));
  const [plan, sessions] = await Promise.all([
    getOrCreatePlan(user),
    WorkoutSession.find({ user: user._id, date: { $gte: from, $lte: today } })
  ]);

  const plannedMap = buildPlannedMap(plan);
  const sessionsByDate = new Map(sessions.map((session) => [session.date, session]));

  const heatmap = eachDate(from, today).map((date) => {
    if (!isPlanned(plannedMap, date)) return { date, pct: null };
    const session = sessionsByDate.get(date);
    return { date, pct: Math.round(scoreOf(session) * 100) };
  });

  return { days, from, to: today, heatmap };
}

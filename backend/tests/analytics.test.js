import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { api, signupUser } from './helpers.js';
import { WeeklyPlan } from '../src/models/WeeklyPlan.js';
import { WorkoutSession } from '../src/models/WorkoutSession.js';
import { DAY_KEYS, addDays, dayKeyFromDateKey, startOfWeek, todayKey } from '../src/utils/dates.js';

async function setup(plannedDays = DAY_KEYS) {
  const auth = await signupUser();
  await WeeklyPlan.create({
    user: auth.user.id,
    days: DAY_KEYS.map((day) => ({
      day,
      muscles: plannedDays.includes(day) ? [{ muscle: 'chest', exercises: [] }] : []
    }))
  });
  return auth;
}

function sessionFor(userId, date, options = {}) {
  const {
    score = 1,
    muscle = 'chest',
    name = 'Press',
    weight = 0,
    durationSec = 600
  } = options;
  const completed = Math.round(score * 4);
  const sets = Array.from({ length: 4 }, (_, index) => ({
    name: `Set ${index + 1}`,
    tag: index === 0 ? 'failure' : 'normal',
    plannedReps: 10,
    completed: index < completed,
    ...(index < completed ? { actualReps: 10 } : {}),
    ...(weight ? { weightKg: weight } : {})
  }));

  return {
    user: userId,
    date,
    dayKey: dayKeyFromDateKey(date),
    status: 'completed',
    muscles: [
      {
        muscle,
        exercises: [
          {
            planExerciseId: new mongoose.Types.ObjectId(),
            name,
            status: completed === 4 ? 'completed' : completed === 0 ? 'skipped' : 'partial',
            sets
          }
        ]
      }
    ],
    plannedSets: 4,
    completedSets: completed,
    completionPct: (completed / 4) * 100,
    durationSec,
    timerRunning: false
  };
}

const today = () => todayKey();
const lastWeekMonday = () => addDays(startOfWeek(today()), -7);

describe('analytics', () => {
  it('scores missed planned days as zero and returns the summary blocks', async () => {
    const { cookie, user } = await setup();
    const anchor = lastWeekMonday();
    await WorkoutSession.create(sessionFor(user.id, anchor, { weight: 50 }));
    await WorkoutSession.create(sessionFor(user.id, addDays(anchor, 2)));

    const res = await api()
      .get(`/api/analytics/summary?range=week&date=${anchor}`)
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    const summary = res.body.data;
    expect(summary.consistencyPct).toBe(29);
    expect(summary.gymTimeMin).toBe(20);
    expect(summary.avgSessionMin).toBe(10);
    expect(summary.setsCompleted).toBe(8);
    expect(summary.setsPlanned).toBe(8);
    expect(summary.failureSets).toBe(2);
    expect(summary.range.from).toBe(anchor);
    expect(summary.range.to).toBe(addDays(anchor, 6));

    const mon = summary.weekdays.find((d) => d.day === 'mon');
    const wed = summary.weekdays.find((d) => d.day === 'wed');
    const tue = summary.weekdays.find((d) => d.day === 'tue');
    expect(mon).toMatchObject({ pct: 100, plannedDays: 1 });
    expect(wed).toMatchObject({ pct: 100, plannedDays: 1 });
    expect(tue).toMatchObject({ pct: 0, plannedDays: 1 });

    expect(summary.muscles[0]).toMatchObject({ muscle: 'chest', pct: 100, plannedSets: 8 });
    expect(summary.trend).toHaveLength(8);
    expect(summary.trend[7]).toMatchObject({ weekStart: anchor, pct: 29 });
    expect(summary.volume).toEqual([{ exercise: 'Press', volume: 2000 }]);
    expect(summary.insights.length).toBeGreaterThan(0);
    expect(summary.insights.map((i) => i.key)).toContain('week_change');
  });

  it('excludes rest days from planned-day metrics', async () => {
    const { cookie, user } = await setup(['mon', 'wed']);
    const anchor = lastWeekMonday();
    await WorkoutSession.create(sessionFor(user.id, anchor));
    await WorkoutSession.create(sessionFor(user.id, addDays(anchor, 1))); // Tuesday rest day.
    await WorkoutSession.create(sessionFor(user.id, addDays(anchor, 2)));

    const res = await api()
      .get(`/api/analytics/summary?range=week&date=${anchor}`)
      .set('Cookie', cookie);
    const summary = res.body.data;

    expect(summary.consistencyPct).toBe(100);
    expect(summary.gymTimeMin).toBe(30);
    expect(summary.weekdays.find((d) => d.day === 'tue')).toMatchObject({ pct: 0, plannedDays: 0 });
    expect(summary.muscles[0].plannedSets).toBe(12);
  });

  it('computes current and best streaks over consecutive planned days', async () => {
    const { cookie, user } = await setup();
    const current = today();
    for (let offset = 0; offset < 3; offset += 1) {
      await WorkoutSession.create(sessionFor(user.id, addDays(current, -offset)));
    }

    const res = await api()
      .get(`/api/analytics/summary?range=week&date=${current}`)
      .set('Cookie', cookie);
    expect(res.body.data.streak).toEqual({ current: 3, best: 3 });
  });

  it('returns a heatmap with neutral rest days', async () => {
    const { cookie, user } = await setup();
    await WorkoutSession.create(sessionFor(user.id, today(), { score: 0.5 }));

    const active = await api().get('/api/analytics/heatmap?days=14').set('Cookie', cookie);
    expect(active.status).toBe(200);
    expect(active.body.data.heatmap).toHaveLength(14);
    expect(active.body.data.heatmap.at(-1)).toMatchObject({ date: today(), pct: 50 });
    expect(active.body.data.heatmap.slice(0, -1).every((day) => day.pct === 0)).toBe(true);

    const restAuth = await setup(['mon']);
    const rest = await api().get('/api/analytics/heatmap?days=14').set('Cookie', restAuth.cookie);
    const mondays = rest.body.data.heatmap.filter((day) => dayKeyFromDateKey(day.date) === 'mon');
    expect(mondays.length).toBe(2);
    expect(mondays.every((day) => day.pct === 0)).toBe(true);
    expect(
      rest.body.data.heatmap
        .filter((day) => dayKeyFromDateKey(day.date) !== 'mon')
        .every((day) => day.pct === null)
    ).toBe(true);

    const invalid = await api().get('/api/analytics/heatmap?days=3').set('Cookie', cookie);
    expect(invalid.status).toBe(400);
  });

  it('hides insights until there are at least three planned days', async () => {
    const auth = await setup([dayKeyFromDateKey(today())]);
    await WorkoutSession.create(sessionFor(auth.user.id, today()));

    const res = await api()
      .get(`/api/analytics/summary?range=week&date=${today()}`)
      .set('Cookie', auth.cookie);
    expect(res.body.data.insights).toEqual([]);
  });

  it('returns empty analytics for a user with no plan or sessions', async () => {
    const { cookie } = await signupUser();
    const res = await api().get('/api/analytics/summary').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.consistencyPct).toBe(0);
    expect(res.body.data.streak).toEqual({ current: 0, best: 0 });
    expect(res.body.data.muscles).toEqual([]);
    expect(res.body.data.insights).toEqual([]);
    expect(res.body.data.trend).toHaveLength(8);
  });

  it('does not leak another user observations', async () => {
    const first = await setup();
    await WorkoutSession.create(sessionFor(first.user.id, today()));
    const second = await signupUser();

    const res = await api().get('/api/analytics/summary').set('Cookie', second.cookie);
    expect(res.body.data.setsCompleted).toBe(0);
    expect(res.body.data.gymTimeMin).toBe(0);
  });

  it('rejects bad ranges and anonymous access', async () => {
    const { cookie } = await signupUser();
    const bad = await api()
      .get(`/api/analytics/summary?range=year`)
      .set('Cookie', cookie);
    expect(bad.status).toBe(400);

    const anonymous = await api().get('/api/analytics/summary');
    expect(anonymous.status).toBe(401);
  });
});

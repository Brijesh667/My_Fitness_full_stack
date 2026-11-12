import mongoose from 'mongoose';
import { WorkoutSession } from '../models/WorkoutSession.js';
import { addDays, dayKeyFromDateKey, isDateKeyWithin, todayKey } from '../utils/dates.js';
import { badRequest, conflict, notFound } from '../utils/appError.js';
import { getOrCreatePlan } from './planService.js';
import { elapsedMs, isStale } from './timer.js';

export function serialiseSession(session, now = Date.now()) {
  if (!session) return null;
  const data = session.toObject();
  delete data.__v;

  const exercises = data.muscles.flatMap((group) => group.exercises);
  const allExercisesCompleted =
    exercises.length > 0 &&
    exercises.every((exercise) => exercise.status === 'completed' || exercise.status === 'skipped');

  return {
    ...data,
    elapsedMs: elapsedMs(session, now),
    allExercisesCompleted
  };
}

export function recalcSession(session) {
  let planned = 0;
  let completed = 0;

  for (const group of session.muscles) {
    for (const exercise of group.exercises) {
      for (const set of exercise.sets) {
        planned += 1;
        if (set.completed) completed += 1;
      }
    }
  }

  session.plannedSets = planned;
  session.completedSets = completed;
  session.completionPct = planned === 0 ? 0 : Math.round((completed / planned) * 100);
}

function resolveExerciseStatuses(session, at = new Date()) {
  for (const group of session.muscles) {
    for (const exercise of group.exercises) {
      const total = exercise.sets.length;
      const done = exercise.sets.filter((set) => set.completed).length;

      if (done === 0) {
        exercise.status = 'skipped';
        exercise.completedAt = undefined;
      } else if (done === total) {
        exercise.status = 'completed';
        exercise.completedAt = exercise.completedAt ?? at;
      } else {
        exercise.status = 'partial';
        exercise.completedAt = undefined;
      }
    }
  }
}

function finishInternal(session, endedAt, now = endedAt) {
  if (session.timerRunning && session.lastResumeAt) {
    session.accumulatedMs += Math.max(0, endedAt.getTime() - new Date(session.lastResumeAt).getTime());
  }

  session.timerRunning = false;
  session.lastResumeAt = undefined;
  session.status = 'completed';
  session.endedAt = endedAt;
  session.durationSec = session.firstStartedAt
    ? Math.max(0, Math.round(session.accumulatedMs / 1000))
    : 0;
  session.lastActivityAt = now;

  resolveExerciseStatuses(session, endedAt);
  recalcSession(session);
}

async function applyStaleGuard(session, now = Date.now()) {
  if (!session) return session;
  if (!isStale(session, now)) return session;

  const endedAt = new Date(session.lastActivityAt);
  finishInternal(session, endedAt, endedAt);
  await session.save();
  return session;
}

async function requireOwnedSession(user, id) {
  if (!mongoose.isValidObjectId(id)) throw notFound('Workout session not found');
  const session = await WorkoutSession.findOne({ _id: id, user: user._id });
  if (!session) throw notFound('Workout session not found');
  return applyStaleGuard(session);
}

function findSessionExercise(session, planExerciseId) {
  if (!mongoose.isValidObjectId(planExerciseId)) throw notFound('Exercise not found in session');
  for (const group of session.muscles) {
    for (const exercise of group.exercises) {
      if (exercise.planExerciseId.toString() === planExerciseId) return { group, exercise };
    }
  }
  throw notFound('Exercise not found in session');
}

function buildPreview(plan, date) {
  const dayKey = dayKeyFromDateKey(date);
  const day = plan.days.find((entry) => entry.day === dayKey);
  const muscles = (day?.muscles ?? []).map((group) => ({
    muscle: group.muscle,
    exercises: group.exercises.map((exercise) => ({
      planExerciseId: exercise._id,
      name: exercise.name,
      sets: exercise.sets.map((set) => ({
        name: set.name,
        tag: set.tag,
        plannedReps: set.repetitions
      }))
    }))
  }));
  const plannedSets = muscles.reduce(
    (sum, group) => sum + group.exercises.reduce((inner, exercise) => inner + exercise.sets.length, 0),
    0
  );

  return {
    date,
    day: dayKey,
    isRestDay: muscles.length === 0,
    muscles,
    plannedSets
  };
}

function snapshotDay(plan, dayKey) {
  const day = plan.days.find((entry) => entry.day === dayKey);
  return (day?.muscles ?? []).map((group) => ({
    muscle: group.muscle,
    exercises: group.exercises.map((exercise) => ({
      planExerciseId: exercise._id,
      name: exercise.name,
      status: 'pending',
      sets: exercise.sets.map((set) => ({
        name: set.name,
        tag: set.tag,
        plannedReps: set.repetitions,
        completed: false
      }))
    }))
  }));
}

export async function getToday(user, date) {
  const dateKey = date ?? todayKey();
  const existing = await WorkoutSession.findOne({ user: user._id, date: dateKey });
  const session = await applyStaleGuard(existing);

  if (session) {
    return { session: serialiseSession(session), preview: null };
  }

  const plan = await getOrCreatePlan(user);
  return { session: null, preview: buildPreview(plan, dateKey) };
}

export async function startSession(user, date) {
  const today = todayKey();
  if (!isDateKeyWithin(date, today, 1)) {
    throw badRequest('You can only start a workout for today, yesterday or tomorrow', {
      date: 'Pick a date within one day of today'
    });
  }

  const existing = await WorkoutSession.findOne({ user: user._id, date });
  if (existing) {
    return { session: await applyStaleGuard(existing), created: false };
  }

  const dayKey = dayKeyFromDateKey(date);
  const plan = await getOrCreatePlan(user);
  const snapshots = snapshotDay(plan, dayKey);

  if (snapshots.length === 0) {
    throw conflict('REST_DAY', 'This is a rest day. Add muscles to the plan first.');
  }

  let session;
  try {
    session = await WorkoutSession.create({
      user: user._id,
      date,
      dayKey,
      muscles: snapshots,
      lastActivityAt: new Date()
    });
  } catch (error) {
    if (error.code === 11000) {
      session = await WorkoutSession.findOne({ user: user._id, date });
      return { session, created: false };
    }
    throw error;
  }

  recalcSession(session);
  await session.save();
  return { session, created: true };
}

export async function getSession(user, id) {
  return requireOwnedSession(user, id);
}

export async function setTimer(user, id, action) {
  const session = await requireOwnedSession(user, id);
  if (session.status !== 'in_progress') throw conflict('SESSION_FINISHED', 'This workout is already finished');

  const now = new Date();
  if (action === 'pause') {
    if (session.timerRunning && session.lastResumeAt) {
      session.accumulatedMs += Math.max(0, now.getTime() - new Date(session.lastResumeAt).getTime());
      session.timerRunning = false;
      session.lastResumeAt = undefined;
    }
  } else if (!session.timerRunning) {
    session.timerRunning = true;
    session.lastResumeAt = now;
    session.firstStartedAt = session.firstStartedAt ?? now;
  }

  session.lastActivityAt = now;
  await session.save();
  return session;
}

function startTimerIfIdle(session, now) {
  if (session.timerRunning) return;
  session.timerRunning = true;
  session.lastResumeAt = now;
  session.firstStartedAt = session.firstStartedAt ?? now;
}

export async function startExercise(user, id, planExerciseId) {
  const session = await requireOwnedSession(user, id);
  if (session.status !== 'in_progress') throw conflict('SESSION_FINISHED', 'This workout is already finished');

  const { exercise } = findSessionExercise(session, planExerciseId);
  const now = new Date();

  if (exercise.status !== 'completed') {
    exercise.status = 'in_progress';
    exercise.startedAt = exercise.startedAt ?? now;
    exercise.completedAt = undefined;
  }

  startTimerIfIdle(session, now);
  session.lastActivityAt = now;
  await session.save();
  return session;
}

export async function updateSet(user, id, planExerciseId, setIndex, input) {
  const session = await requireOwnedSession(user, id);
  if (session.status !== 'in_progress') throw conflict('SESSION_FINISHED', 'This workout is already finished');

  const { exercise } = findSessionExercise(session, planExerciseId);
  if (!Number.isInteger(setIndex) || setIndex < 0 || setIndex >= exercise.sets.length) {
    throw notFound('Set not found');
  }

  const now = new Date();
  const set = exercise.sets[setIndex];

  if (input.completed) {
    set.completed = true;
    set.completedAt = set.completedAt ?? now;
    if (input.actualReps !== undefined) set.actualReps = input.actualReps;
    if (input.weightKg !== undefined) set.weightKg = input.weightKg;

    exercise.startedAt = exercise.startedAt ?? now;
    startTimerIfIdle(session, now);
    if (exercise.status === 'pending' || exercise.status === 'skipped') {
      exercise.status = 'in_progress';
    }
  } else {
    set.completed = false;
    set.completedAt = undefined;
  }

  const done = exercise.sets.filter((item) => item.completed).length;
  if (done === 0) {
    exercise.status = 'in_progress';
    exercise.completedAt = undefined;
  } else if (done === exercise.sets.length) {
    exercise.status = 'completed';
    exercise.completedAt = exercise.completedAt ?? now;
  } else {
    exercise.status = 'in_progress';
    exercise.completedAt = undefined;
  }

  session.lastActivityAt = now;
  recalcSession(session);
  await session.save();
  return session;
}

export async function skipExercise(user, id, planExerciseId) {
  const session = await requireOwnedSession(user, id);
  if (session.status !== 'in_progress') throw conflict('SESSION_FINISHED', 'This workout is already finished');

  const { exercise } = findSessionExercise(session, planExerciseId);
  for (const set of exercise.sets) {
    set.completed = false;
    set.completedAt = undefined;
  }
  exercise.status = 'skipped';
  exercise.completedAt = undefined;

  session.lastActivityAt = new Date();
  recalcSession(session);
  await session.save();
  return session;
}

export async function finishSession(user, id) {
  const session = await requireOwnedSession(user, id);
  if (session.status !== 'in_progress') return session;

  const now = new Date();
  finishInternal(session, now, now);
  await session.save();
  return session;
}

export async function listSessions(user, { from, to }) {
  const end = to ?? todayKey();
  const start = from ?? addDays(end, -30);
  if (start > end) throw badRequest('The start date must be before the end date', { from: 'Invalid range' });

  const sessions = await WorkoutSession.find({
    user: user._id,
    date: { $gte: start, $lte: end }
  })
    .sort({ date: -1 })
    .limit(100);

  for (const session of sessions) {
    const before = session.status;
    await applyStaleGuard(session);
    if (before === 'in_progress' && session.status === 'completed') await session.save();
  }

  return sessions;
}

export async function deleteSession(user, id) {
  const session = await requireOwnedSession(user, id);
  await session.deleteOne();
}

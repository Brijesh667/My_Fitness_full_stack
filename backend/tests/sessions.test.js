import { describe, it, expect } from 'vitest';
import { api, signupUser } from './helpers.js';
import { addDays, dayKeyFromDateKey, todayKey } from '../src/utils/dates.js';
import { WorkoutSession } from '../src/models/WorkoutSession.js';

const today = () => todayKey();

async function setupPlan(exerciseCount = 1, setsPerExercise = 2) {
  const auth = await signupUser();
  const day = dayKeyFromDateKey(auth.date ?? today());
  await api()
    .put(`/api/plan/days/${day}/muscles`)
    .set('Cookie', auth.cookie)
    .send({ muscles: ['chest'] });

  const ids = [];
  for (let index = 0; index < exerciseCount; index += 1) {
    const sets = Array.from({ length: setsPerExercise }, (_, setIndex) => ({
      repetitions: 10 - setIndex,
      ...(setIndex === setsPerExercise - 1 ? { tag: 'failure' } : {})
    }));
    const res = await api()
      .post(`/api/plan/days/${day}/exercises`)
      .set('Cookie', auth.cookie)
      .send({
        custom: { name: `Press ${String.fromCharCode(65 + index)}`, sets },
        targetMuscle: 'chest'
      });
    ids.push(res.body.data.day.muscles[0].exercises[index]._id);
  }

  return { ...auth, day, ids };
}

async function start(cookie, date = today()) {
  return api().post('/api/sessions/start').set('Cookie', cookie).send({ date });
}

describe('workout sessions', () => {

  it('previews today from the plan and flags rest days', async () => {
    const { cookie } = await setupPlan(1, 2);
    const preview = await api().get(`/api/sessions/today?date=${today()}`).set('Cookie', cookie);
    expect(preview.status).toBe(200);
    expect(preview.body.data.session).toBeNull();
    expect(preview.body.data.preview.isRestDay).toBe(false);
    expect(preview.body.data.preview.plannedSets).toBe(2);
    expect(preview.body.data.preview.muscles[0].exercises[0].sets).toHaveLength(2);

    const empty = await signupUser();
    const rest = await api().get(`/api/sessions/today?date=${today()}`).set('Cookie', empty.cookie);
    expect(rest.body.data.preview.isRestDay).toBe(true);

    const blocked = await start(empty.cookie);
    expect(blocked.status).toBe(409);
    expect(blocked.body.error.code).toBe('REST_DAY');
  });

  it('starts a session once, snapshots the plan, and leaves the timer stopped', async () => {
    const { cookie, ids } = await setupPlan(1, 2);
    const first = await start(cookie);
    expect(first.status).toBe(201);
    const session = first.body.data.session;
    expect(session.status).toBe('in_progress');
    expect(session.timerRunning).toBe(false);
    expect(session.plannedSets).toBe(2);
    expect(session.muscles[0].exercises[0].planExerciseId).toBe(ids[0]);
    expect(session.muscles[0].exercises[0].status).toBe('pending');
    expect(session.muscles[0].exercises[0].sets[0]).toMatchObject({
      plannedReps: 10,
      completed: false
    });

    const second = await start(cookie);
    expect(second.status).toBe(200);
    expect(second.body.data.session._id).toBe(session._id);

    await api()
      .patch(`/api/plan/days/${session.dayKey}/exercises/${ids[0]}`)
      .set('Cookie', cookie)
      .send({ sets: [{ repetitions: 5 }] });

    const after = await api().get(`/api/sessions/${session._id}`).set('Cookie', cookie);
    expect(after.body.data.session.muscles[0].exercises[0].sets).toHaveLength(2);
  });

  it('rejects dates further than one day away', async () => {
    const { cookie } = await setupPlan();
    const res = await start(cookie, addDays(today(), 3));
    expect(res.status).toBe(400);
    expect(res.body.error.fields.date).toBeTruthy();
  });

  it('tracks elapsed time on the server across pause and resume', async () => {
    const { cookie } = await setupPlan();
    const created = await start(cookie);
    const id = created.body.data.session._id;

    await api().post(`/api/sessions/${id}/timer`).set('Cookie', cookie).send({ action: 'start' });
    const running = await api().get(`/api/sessions/${id}`).set('Cookie', cookie);
    expect(running.body.data.session.timerRunning).toBe(true);

    await WorkoutSession.updateOne(
      { _id: id },
      {
        $set: {
          accumulatedMs: 5000,
          lastResumeAt: new Date(Date.now() - 10_000),
          firstStartedAt: new Date(Date.now() - 20_000)
        }
      }
    );

    const measured = await api().get(`/api/sessions/${id}`).set('Cookie', cookie);
    expect(measured.body.data.session.elapsedMs).toBeGreaterThanOrEqual(14_000);
    expect(measured.body.data.session.elapsedMs).toBeLessThan(16_000);

    const paused = await api()
      .post(`/api/sessions/${id}/timer`)
      .set('Cookie', cookie)
      .send({ action: 'pause' });
    expect(paused.body.data.session.timerRunning).toBe(false);
    expect(paused.body.data.session.elapsedMs).toBeGreaterThanOrEqual(14_000);

    await api().post(`/api/sessions/${id}/timer`).set('Cookie', cookie).send({ action: 'resume' });
    await WorkoutSession.updateOne(
      { _id: id },
      { $set: { lastResumeAt: new Date(Date.now() - 2000) } }
    );

    const finished = await api().post(`/api/sessions/${id}/finish`).set('Cookie', cookie);
    expect(finished.body.data.session.status).toBe('completed');
    expect(finished.body.data.session.timerRunning).toBe(false);
    expect(finished.body.data.session.durationSec).toBeGreaterThanOrEqual(16);
    expect(finished.body.data.session.durationSec).toBeLessThan(20);
    expect(finished.body.data.session.endedAt).toBeTruthy();
  });

  it('saves zero duration when the timer never ran', async () => {
    const { cookie } = await setupPlan();
    const created = await start(cookie);
    const finished = await api()
      .post(`/api/sessions/${created.body.data.session._id}/finish`)
      .set('Cookie', cookie);
    expect(finished.body.data.session.durationSec).toBe(0);
    expect(finished.body.data.session.muscles[0].exercises[0].status).toBe('skipped');
  });

  it('auto-starts the timer when an exercise starts and tracks set completion', async () => {
    const { cookie, ids } = await setupPlan(1, 2);
    const created = await start(cookie);
    const id = created.body.data.session._id;
    expect(created.body.data.session.timerRunning).toBe(false);

    const started = await api()
      .post(`/api/sessions/${id}/exercises/${ids[0]}/start`)
      .set('Cookie', cookie);
    expect(started.body.data.session.timerRunning).toBe(true);
    expect(started.body.data.session.muscles[0].exercises[0].status).toBe('in_progress');

    const setOne = await api()
      .patch(`/api/sessions/${id}/exercises/${ids[0]}/sets/0`)
      .set('Cookie', cookie)
      .send({ completed: true, actualReps: 9, weightKg: 60.5 });
    const exercise = setOne.body.data.session.muscles[0].exercises[0];
    expect(exercise.sets[0]).toMatchObject({ completed: true, actualReps: 9, weightKg: 60.5 });
    expect(exercise.status).toBe('in_progress');
    expect(setOne.body.data.session.completedSets).toBe(1);

    const setTwo = await api()
      .patch(`/api/sessions/${id}/exercises/${ids[0]}/sets/1`)
      .set('Cookie', cookie)
      .send({ completed: true });
    expect(setTwo.body.data.session.muscles[0].exercises[0].status).toBe('completed');
    expect(setTwo.body.data.session.completionPct).toBe(100);
    expect(setTwo.body.data.session.allExercisesCompleted).toBe(true);
    expect(setTwo.body.data.session.status).toBe('in_progress');

    const undone = await api()
      .patch(`/api/sessions/${id}/exercises/${ids[0]}/sets/0`)
      .set('Cookie', cookie)
      .send({ completed: false });
    expect(undone.body.data.session.muscles[0].exercises[0].status).toBe('in_progress');
    expect(undone.body.data.session.completionPct).toBe(50);
  });

  it('validates weight steps and set indexes', async () => {
    const { cookie, ids } = await setupPlan(1, 2);
    const created = await start(cookie);
    const id = created.body.data.session._id;

    const badWeight = await api()
      .patch(`/api/sessions/${id}/exercises/${ids[0]}/sets/0`)
      .set('Cookie', cookie)
      .send({ completed: true, weightKg: 60.3 });
    expect(badWeight.status).toBe(400);

    const badIndex = await api()
      .patch(`/api/sessions/${id}/exercises/${ids[0]}/sets/9`)
      .set('Cookie', cookie)
      .send({ completed: true });
    expect(badIndex.status).toBe(404);
  });

  it('skips an exercise and clears its completed sets', async () => {
    const { cookie, ids } = await setupPlan(1, 2);
    const created = await start(cookie);
    const id = created.body.data.session._id;
    await api()
      .patch(`/api/sessions/${id}/exercises/${ids[0]}/sets/0`)
      .set('Cookie', cookie)
      .send({ completed: true });

    const skipped = await api()
      .post(`/api/sessions/${id}/exercises/${ids[0]}/skip`)
      .set('Cookie', cookie);
    const exercise = skipped.body.data.session.muscles[0].exercises[0];
    expect(exercise.status).toBe('skipped');
    expect(exercise.sets.every((set) => set.completed === false)).toBe(true);
    expect(skipped.body.data.session.completedSets).toBe(0);
  });

  it('resolves completed, partial and skipped exercises on finish', async () => {
    const { cookie, ids } = await setupPlan(3, 2);
    const created = await start(cookie);
    const id = created.body.data.session._id;

    await api()
      .patch(`/api/sessions/${id}/exercises/${ids[0]}/sets/0`)
      .set('Cookie', cookie)
      .send({ completed: true });
    await api()
      .patch(`/api/sessions/${id}/exercises/${ids[0]}/sets/1`)
      .set('Cookie', cookie)
      .send({ completed: true });
    await api()
      .patch(`/api/sessions/${id}/exercises/${ids[1]}/sets/0`)
      .set('Cookie', cookie)
      .send({ completed: true });

    const finished = await api().post(`/api/sessions/${id}/finish`).set('Cookie', cookie);
    const session = finished.body.data.session;
    const [first, second, third] = session.muscles[0].exercises;
    expect(first.status).toBe('completed');
    expect(second.status).toBe('partial');
    expect(third.status).toBe('skipped');
    expect(session.status).toBe('completed');
    expect(session.plannedSets).toBe(6);
    expect(session.completedSets).toBe(3);
    expect(session.completionPct).toBe(50);

    const after = await api()
      .post(`/api/sessions/${id}/timer`)
      .set('Cookie', cookie)
      .send({ action: 'start' });
    expect(after.status).toBe(409);
    expect(after.body.error.code).toBe('SESSION_FINISHED');
  });

  it('auto-finishes a session idle for more than four hours', async () => {
    const { cookie } = await setupPlan();
    const created = await start(cookie);
    const id = created.body.data.session._id;

    const past = new Date(Date.now() - 5 * 60 * 60 * 1000);
    await WorkoutSession.updateOne(
      { _id: id },
      {
        $set: {
          timerRunning: true,
          accumulatedMs: 1000,
          firstStartedAt: new Date(past.getTime() - 60 * 60 * 1000),
          lastResumeAt: past,
          lastActivityAt: past
        }
      }
    );

    const read = await api().get(`/api/sessions/${id}`).set('Cookie', cookie);
    const session = read.body.data.session;
    expect(session.status).toBe('completed');
    expect(new Date(session.endedAt).getTime()).toBe(past.getTime());
    expect(session.durationSec).toBe(1);
    expect(session.timerRunning).toBe(false);
  });

  it('lists, deletes and isolates sessions per user', async () => {
    const { cookie } = await setupPlan();
    const created = await start(cookie);
    const id = created.body.data.session._id;

    const list = await api().get('/api/sessions').set('Cookie', cookie);
    expect(list.status).toBe(200);
    expect(list.body.data.sessions).toHaveLength(1);

    const badRange = await api()
      .get(`/api/sessions?from=${today()}&to=${addDays(today(), -5)}`)
      .set('Cookie', cookie);
    expect(badRange.status).toBe(400);

    const other = await signupUser();
    const otherRead = await api().get(`/api/sessions/${id}`).set('Cookie', other.cookie);
    expect(otherRead.status).toBe(404);
    const otherList = await api().get('/api/sessions').set('Cookie', other.cookie);
    expect(otherList.body.data.sessions).toHaveLength(0);

    const removed = await api().delete(`/api/sessions/${id}`).set('Cookie', cookie);
    expect(removed.status).toBe(204);
    const gone = await api().get(`/api/sessions/${id}`).set('Cookie', cookie);
    expect(gone.status).toBe(404);
  });
});

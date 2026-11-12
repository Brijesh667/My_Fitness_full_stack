import { describe, it, expect, beforeEach } from 'vitest';
import { api, signupUser } from './helpers.js';
import { seedExerciseLibrary } from '../src/seed/exercises.js';

async function setup() {
  const auth = await signupUser();
  return auth;
}

async function setMuscles(cookie, day, muscles, extra = {}) {
  return api().put(`/api/plan/days/${day}/muscles`).set('Cookie', cookie).send({ muscles, ...extra });
}

async function libraryExercise(cookie, search, muscle) {
  const res = await api()
    .get(`/api/exercises?search=${encodeURIComponent(search)}&muscle=${muscle}`)
    .set('Cookie', cookie);
  return res.body.data.items[0];
}

describe('weekly plan', () => {
  beforeEach(async () => {
    await seedExerciseLibrary();
  });

  it('creates exactly seven ordered empty days on first read', async () => {
    const { cookie } = await setup();
    const res = await api().get('/api/plan').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.plan.days.map((d) => d.day)).toEqual([
      'mon',
      'tue',
      'wed',
      'thu',
      'fri',
      'sat',
      'sun'
    ]);
    expect(res.body.data.plan.days.every((d) => d.muscles.length === 0)).toBe(true);
  });

  it('sets and preserves muscle order, enforcing unique muscles and a cap of four', async () => {
    const { cookie } = await setup();

    const first = await setMuscles(cookie, 'mon', ['chest', 'back']);
    expect(first.status).toBe(200);
    expect(first.body.data.day.muscles.map((m) => m.muscle)).toEqual(['chest', 'back']);

    const duplicate = await setMuscles(cookie, 'mon', ['chest', 'chest']);
    expect(duplicate.status).toBe(400);

    const tooMany = await setMuscles(cookie, 'mon', ['chest', 'back', 'quads', 'calves', 'abs']);
    expect(tooMany.status).toBe(400);

    const invalidMuscle = await setMuscles(cookie, 'mon', ['neck']);
    expect(invalidMuscle.status).toBe(400);

    const invalidDay = await setMuscles(cookie, 'funday', ['chest']);
    expect(invalidDay.status).toBe(400);

    const unknownKey = await setMuscles(cookie, 'mon', ['chest'], { secret: true });
    expect(unknownKey.status).toBe(400);
  });

  it('requires confirmation before dropping a muscle that has exercises', async () => {
    const { cookie } = await setup();
    await setMuscles(cookie, 'mon', ['chest', 'back']);
    const bench = await libraryExercise(cookie, 'Bench Press', 'chest');
    await api()
      .post('/api/plan/days/mon/exercises')
      .set('Cookie', cookie)
      .send({ exerciseId: bench._id });

    const blocked = await setMuscles(cookie, 'mon', ['back']);
    expect(blocked.status).toBe(409);
    expect(blocked.body.error.code).toBe('CONFIRM_REQUIRED');

    const confirmed = await setMuscles(cookie, 'mon', ['back'], { confirm: true });
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.data.day.muscles.map((m) => m.muscle)).toEqual(['back']);

    const removeEmpty = await setMuscles(cookie, 'mon', ['back', 'abs']);
    const dropEmpty = await setMuscles(cookie, 'mon', ['back']);
    expect(removeEmpty.status).toBe(200);
    expect(dropEmpty.status).toBe(200);
  });

  it('adds a library exercise to its own muscle with overrides and an independent copy', async () => {
    const { cookie } = await setup();
    await setMuscles(cookie, 'mon', ['chest']);
    const bench = await libraryExercise(cookie, 'Bench Press', 'chest');

    const res = await api()
      .post('/api/plan/days/mon/exercises')
      .set('Cookie', cookie)
      .send({
        exerciseId: bench._id,
        overrides: { sets: [{ repetitions: 8 }, { tag: 'failure', repetitions: 6 }], description: 'Heavy day' }
      });

    expect(res.status).toBe(201);
    const copy = res.body.data.day.muscles[0].exercises[0];
    expect(copy.name).toBe('Barbell Bench Press');
    expect(copy.sourceExerciseId).toBe(bench._id);
    expect(copy.description).toBe('Heavy day');
    expect(copy.sets).toHaveLength(2);
    expect(copy.sets.map((s) => s.name)).toEqual(['Set 1', 'Set 2']);
    expect(copy.isCustom).toBe(false);

    await api()
      .patch(`/api/plan/days/mon/exercises/${copy._id}`)
      .set('Cookie', cookie)
      .send({ name: 'Bench - heavy', sets: [{ repetitions: 5 }] });

    const libraryNow = await api().get(`/api/exercises/${bench._id}`).set('Cookie', cookie);
    expect(libraryNow.body.data.exercise.name).toBe('Barbell Bench Press');
    expect(libraryNow.body.data.exercise.description).not.toBe('Heavy day');
    expect(libraryNow.body.data.exercise.sets).toHaveLength(3);
  });

  it('returns MUSCLE_NOT_IN_DAY unless autoAddMuscle is allowed', async () => {
    const { cookie } = await setup();
    await setMuscles(cookie, 'tue', ['back']);
    const bench = await libraryExercise(cookie, 'Bench Press', 'chest');

    const missing = await api()
      .post('/api/plan/days/tue/exercises')
      .set('Cookie', cookie)
      .send({ exerciseId: bench._id });
    expect(missing.status).toBe(409);
    expect(missing.body.error.code).toBe('MUSCLE_NOT_IN_DAY');

    const added = await api()
      .post('/api/plan/days/tue/exercises')
      .set('Cookie', cookie)
      .send({ exerciseId: bench._id, autoAddMuscle: true });
    expect(added.status).toBe(201);
    expect(added.body.data.day.muscles.map((m) => m.muscle)).toEqual(['back', 'chest']);

    await setMuscles(cookie, 'wed', ['back', 'quads', 'calves', 'abs']);
    const full = await api()
      .post('/api/plan/days/wed/exercises')
      .set('Cookie', cookie)
      .send({ exerciseId: bench._id, autoAddMuscle: true });
    expect(full.status).toBe(409);
    expect(full.body.error.code).toBe('MUSCLE_CAP_REACHED');
  });

  it('caps a muscle at 12 exercises', async () => {
    const { cookie } = await setup();
    await setMuscles(cookie, 'mon', ['chest']);
    const bench = await libraryExercise(cookie, 'Bench Press', 'chest');

    for (let i = 0; i < 12; i += 1) {
      const res = await api()
        .post('/api/plan/days/mon/exercises')
        .set('Cookie', cookie)
        .send({ exerciseId: bench._id });
      expect(res.status).toBe(201);
    }

    const extra = await api()
      .post('/api/plan/days/mon/exercises')
      .set('Cookie', cookie)
      .send({ exerciseId: bench._id });
    expect(extra.status).toBe(409);
    expect(extra.body.error.code).toBe('EXERCISE_CAP_REACHED');
  });

  it('adds a custom exercise without touching the library unless asked', async () => {
    const { cookie } = await setup();
    await setMuscles(cookie, 'mon', ['chest']);

    const add = (saveToLibrary) =>
      api()
        .post('/api/plan/days/mon/exercises')
        .set('Cookie', cookie)
        .send({
          custom: {
            name: 'Band Chest Press',
            description: 'Banded press at home',
            sets: [{ repetitions: 15 }]
          },
          targetMuscle: 'chest',
          saveToLibrary
        });

    const first = await add(false);
    expect(first.status).toBe(201);
    const copy = first.body.data.day.muscles[0].exercises[0];
    expect(copy.isCustom).toBe(true);
    expect(copy.sourceExerciseId).toBeNull();

    let mine = await api().get('/api/exercises?source=mine').set('Cookie', cookie);
    expect(mine.body.data.total).toBe(0);

    await add(true);
    mine = await api().get('/api/exercises?source=mine').set('Cookie', cookie);
    expect(mine.body.data.total).toBe(1);
    expect(mine.body.data.items[0].name).toBe('Band Chest Press');

    const wrongMuscle = await api()
      .post('/api/plan/days/mon/exercises')
      .set('Cookie', cookie)
      .send({ custom: { name: 'Leg Thing' }, targetMuscle: 'quads' });
    expect(wrongMuscle.status).toBe(409);
  });

  it('edits and removes a plan exercise by id', async () => {
    const { cookie } = await setup();
    await setMuscles(cookie, 'mon', ['chest']);
    const bench = await libraryExercise(cookie, 'Bench Press', 'chest');
    const added = await api()
      .post('/api/plan/days/mon/exercises')
      .set('Cookie', cookie)
      .send({ exerciseId: bench._id });
    const id = added.body.data.day.muscles[0].exercises[0]._id;

    const patched = await api()
      .patch(`/api/plan/days/mon/exercises/${id}`)
      .set('Cookie', cookie)
      .send({ name: 'Bench Press 2', sets: [{ repetitions: 10 }, { repetitions: 8 }] });
    expect(patched.status).toBe(200);
    expect(patched.body.data.day.muscles[0].exercises[0].sets).toHaveLength(2);

    const deleted = await api()
      .delete(`/api/plan/days/mon/exercises/${id}`)
      .set('Cookie', cookie);
    expect(deleted.status).toBe(200);
    expect(deleted.body.data.day.muscles[0].exercises).toHaveLength(0);
  });

  it('keeps each user plan private', async () => {
    const first = await setup();
    const second = await setup();
    await setMuscles(first.cookie, 'mon', ['chest']);

    const other = await api().get('/api/plan').set('Cookie', second.cookie);
    expect(other.body.data.plan.days.every((d) => d.muscles.length === 0)).toBe(true);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { api, signupUser } from './helpers.js';
import { LIBRARY_EXERCISES, seedExerciseLibrary } from '../src/seed/exercises.js';
import { MUSCLES } from '../src/models/User.js';

const customPayload = (overrides = {}) => ({
  name: 'My Cable Press',
  targetMuscle: 'chest',
  description: 'A custom pressing variation.',
  sets: [
    { tag: 'normal', repetitions: 10 },
    { tag: 'failure', repetitions: 8, description: 'Last one to failure' }
  ],
  links: [{ label: 'Form video', url: 'https://example.com/press' }],
  ...overrides
});

describe('exercise library', () => {
  beforeEach(async () => {
    await seedExerciseLibrary();
  });

  it('seeds at least 60 exercises covering every muscle with tidy defaults', async () => {
    expect(LIBRARY_EXERCISES.length).toBeGreaterThanOrEqual(60);
    expect(new Set(LIBRARY_EXERCISES.map((e) => e.targetMuscle))).toEqual(new Set(MUSCLES));
    for (const exercise of LIBRARY_EXERCISES) {
      expect(exercise.description.length).toBeLessThanOrEqual(100);
    }
  });

  it('is idempotent when seeded again', async () => {
    const first = await seedExerciseLibrary();
    const second = await seedExerciseLibrary();
    expect(second).toBe(first);
  });

  it('lists library exercises with pagination metadata', async () => {
    const { cookie } = await signupUser();
    const res = await api().get('/api/exercises?limit=10&page=1').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(10);
    expect(res.body.data.total).toBeGreaterThanOrEqual(60);
    expect(res.body.data.hasMore).toBe(true);
    expect(res.body.data.items[0]).not.toHaveProperty('nameLower');

    const last = await api().get('/api/exercises?limit=50&page=2').set('Cookie', cookie);
    expect(last.body.data.hasMore).toBe(false);
  });

  it('searches case-insensitively and escapes regex characters', async () => {
    const { cookie } = await signupUser();
    const lower = await api().get('/api/exercises?search=bench').set('Cookie', cookie);
    expect(lower.body.data.total).toBeGreaterThan(0);
    expect(lower.body.data.items.every((e) => e.name.toLowerCase().includes('bench'))).toBe(true);

    await api()
      .post('/api/exercises')
      .set('Cookie', cookie)
      .send(customPayload({ name: 'Press (Cable)', targetMuscle: 'chest' }));

    const literal = await api().get('/api/exercises?search=%28Cable%29').set('Cookie', cookie);
    expect(literal.body.data.total).toBe(1);

    const wildcard = await api().get('/api/exercises?search=.*').set('Cookie', cookie);
    expect(wildcard.body.data.total).toBe(0);
  });

  it('filters by muscle and source', async () => {
    const { cookie } = await signupUser();
    await api().post('/api/exercises').set('Cookie', cookie).send(customPayload());

    const chest = await api().get('/api/exercises?muscle=chest&limit=50').set('Cookie', cookie);
    expect(chest.body.data.items.every((e) => e.targetMuscle === 'chest')).toBe(true);

    const mine = await api().get('/api/exercises?source=mine').set('Cookie', cookie);
    expect(mine.body.data.total).toBe(1);
    expect(mine.body.data.items[0].isCustom).toBe(true);

    const library = await api().get('/api/exercises?source=library&limit=50').set('Cookie', cookie);
    expect(library.body.data.total).toBeGreaterThanOrEqual(60);
    expect(library.body.data.items.every((e) => e.owner === null)).toBe(true);
  });

  it('creates a custom exercise with defaults and auto set names', async () => {
    const { cookie } = await signupUser();
    const res = await api()
      .post('/api/exercises')
      .set('Cookie', cookie)
      .send({ name: 'My Squat', targetMuscle: 'quads' });

    expect(res.status).toBe(201);
    const exercise = res.body.data.exercise;
    expect(exercise.isCustom).toBe(true);
    expect(exercise.sets).toHaveLength(3);
    expect(exercise.sets.map((s) => s.name)).toEqual(['Set 1', 'Set 2', 'Set 3']);
    expect(exercise.sets.every((s) => s.repetitions === 12 && s.tag === 'normal')).toBe(true);
    expect(exercise.links).toEqual([]);
  });

  it('rejects invalid sets, links, descriptions and unknown fields', async () => {
    const { cookie } = await signupUser();
    const elevenSets = Array.from({ length: 11 }, () => ({ repetitions: 10 }));
    const tooManyLinks = Array.from({ length: 6 }, (_, i) => ({ url: `https://example.com/${i}` }));

    const cases = [
      customPayload({ sets: elevenSets }),
      customPayload({ sets: [{ repetitions: 1001 }] }),
      customPayload({ sets: [{ repetitions: 0 }] }),
      customPayload({ links: tooManyLinks }),
      customPayload({ links: [{ url: 'ftp://example.com' }] }),
      customPayload({ description: 'x'.repeat(101) }),
      { ...customPayload(), surprise: true }
    ];

    for (const payload of cases) {
      const res = await api().post('/api/exercises').set('Cookie', cookie).send(payload);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('lets owners edit and delete, but not other users or library items', async () => {
    const owner = await signupUser();
    const other = await signupUser();
    const created = await api()
      .post('/api/exercises')
      .set('Cookie', owner.cookie)
      .send(customPayload());

    const id = created.body.data.exercise._id;
    const patched = await api()
      .patch(`/api/exercises/${id}`)
      .set('Cookie', owner.cookie)
      .send({ name: 'Renamed Press', sets: [{ repetitions: 6 }] });
    expect(patched.status).toBe(200);
    expect(patched.body.data.exercise.name).toBe('Renamed Press');
    expect(patched.body.data.exercise.sets).toHaveLength(1);

    const forbiddenPatch = await api()
      .patch(`/api/exercises/${id}`)
      .set('Cookie', other.cookie)
      .send({ name: 'Hijacked Press' });
    expect(forbiddenPatch.status).toBe(403);

    const library = await api()
      .get('/api/exercises?source=library&limit=1')
      .set('Cookie', owner.cookie);
    const forbiddenLibrary = await api()
      .patch(`/api/exercises/${library.body.data.items[0]._id}`)
      .set('Cookie', owner.cookie)
      .send({ name: 'Changed Library' });
    expect(forbiddenLibrary.status).toBe(403);

    const deleted = await api().delete(`/api/exercises/${id}`).set('Cookie', owner.cookie);
    expect(deleted.status).toBe(204);

    const missing = await api().get(`/api/exercises/${id}`).set('Cookie', owner.cookie);
    expect(missing.status).toBe(404);
  });

  it('blocks anonymous access', async () => {
    const res = await api().get('/api/exercises');
    expect(res.status).toBe(401);
  });
});

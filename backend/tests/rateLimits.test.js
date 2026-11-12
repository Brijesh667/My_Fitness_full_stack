process.env.LOGIN_PAIR_LIMIT = '5';
process.env.LOGIN_IP_LIMIT = '20';
process.env.LOGIN_WINDOW_MINUTES = '15';
process.env.SIGNUP_IP_LIMIT = '5';
process.env.SIGNUP_WINDOW_MINUTES = '60';
process.env.ASSISTANT_DAILY_LIMIT = '5';
process.env.APP_TIMEZONE = 'Asia/Kolkata';
process.env.GLOBAL_IP_LIMIT = '10000';

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';

const { app } = await import('../src/app.js');
const { RateLimit } = await import('../src/models/RateLimit.js');
const { consumeLimit, consumeDaily, getDailyUsage, peekLimit } = await import(
  '../src/services/rateLimitService.js'
);
const { loginLimitKeys } = await import('../src/services/loginRateLimitService.js');
const { nextResetAt } = await import('../src/utils/timezone.js');

const api = () => request(app);
let ipSeed = 1;
const uniqueIp = () => `198.51.100.${ipSeed++}`;

async function createUser(email, password = 'password123') {
  const response = await api()
    .post('/api/auth/signup')
    .set('X-Forwarded-For', uniqueIp())
    .send({ name: 'Rate User', email, password });
  expect(response.status).toBe(201);
  return {
    cookie: response.headers['set-cookie'][0],
    userId: response.body.data.user.id,
    email
  };
}

async function failLogin(email, ip, password = 'wrong-password') {
  return api()
    .post('/api/auth/login')
    .set('X-Forwarded-For', ip)
    .send({ email, password });
}

const assistantInput = {
  mode: 'plan',
  goal: 'maintain',
  mealsPerDay: 3,
  dietPreference: 'veg',
  allergies: []
};

describe('H01 persistent rate limits', () => {
  it('is atomic under parallel consumption', async () => {
    const key = `test:parallel:${new mongoose.Types.ObjectId()}`;
    const expireAt = new Date(Date.now() + 60_000);

    for (let index = 0; index < 4; index += 1) {
      const seeded = await consumeLimit(key, { limit: 5, expireAt });
      expect(seeded.allowed).toBe(true);
    }

    const results = await Promise.all(
      Array.from({ length: 10 }, () => consumeLimit(key, { limit: 5, expireAt }))
    );

    expect(results.filter((result) => result.allowed)).toHaveLength(1);
    const doc = await RateLimit.findById(key).lean();
    expect(doc.count).toBe(5);
  });

  it('resets the calendar-day bucket using the app timezone', async () => {
    const beforeMidnight = new Date('2026-11-13T18:29:00.000Z'); // 23:59 IST
    const afterMidnight = new Date('2026-11-13T18:31:00.000Z'); // 00:01 IST next day
    const keyBase = `test:daily:${new mongoose.Types.ObjectId()}`;

    const first = await consumeDaily(keyBase, {
      limit: 1,
      now: beforeMidnight,
      timeZone: 'Asia/Kolkata'
    });
    expect(first.allowed).toBe(true);
    expect(first.dayKey).toBe('2026-11-13');

    const blocked = await consumeDaily(keyBase, {
      limit: 1,
      now: beforeMidnight,
      timeZone: 'Asia/Kolkata'
    });
    expect(blocked.allowed).toBe(false);

    const nextDay = await consumeDaily(keyBase, {
      limit: 1,
      now: afterMidnight,
      timeZone: 'Asia/Kolkata'
    });
    expect(nextDay.allowed).toBe(true);
    expect(nextDay.dayKey).toBe('2026-11-14');

    expect(nextResetAt(beforeMidnight, 'Asia/Kolkata').toISOString()).toBe(
      '2026-11-13T18:30:00.000Z'
    );
  });

  it('returns the assistant usage shape and does not consume invalid requests', async () => {
    const user = await createUser(`usage-${Date.now()}@example.com`);

    const initial = await api().get('/api/diet/assistant/usage').set('Cookie', user.cookie);
    expect(initial.status).toBe(200);
    expect(initial.body.data).toEqual({
      limit: 5,
      used: 0,
      remaining: 5,
      resetsAt: expect.any(String)
    });

    const invalid = await api()
      .post('/api/diet/assistant/generate')
      .set('Cookie', user.cookie)
      .send({ mode: 'plan' });
    expect(invalid.status).toBe(400);

    const after = await api().get('/api/diet/assistant/usage').set('Cookie', user.cookie);
    expect(after.body.data.used).toBe(0);
    expect(after.body.data.remaining).toBe(5);
  });

  it('allows exactly one of ten parallel generations at four used', async () => {
    const user = await createUser(`parallel-assistant-${Date.now()}@example.com`);

    for (let index = 0; index < 4; index += 1) {
      const quota = await api()
        .post('/api/diet/assistant/generate')
        .set('Cookie', user.cookie)
        .send(assistantInput);
      expect(quota.status).toBe(200);
    }

    const responses = await Promise.all(
      Array.from({ length: 10 }, () =>
        api().post('/api/diet/assistant/generate').set('Cookie', user.cookie).send(assistantInput)
      )
    );

    expect(responses.filter((response) => response.status === 200)).toHaveLength(1);
    expect(responses.filter((response) => response.status === 429)).toHaveLength(9);

    const rateLimited = responses.find((response) => response.status === 429);
    expect(rateLimited.headers['retry-after']).toBeDefined();
    expect(Number(rateLimited.headers['retry-after'])).toBeGreaterThan(0);
    expect(rateLimited.body.error).toMatchObject({
      code: 'RATE_LIMITED',
      retryAfterSec: expect.any(Number)
    });

    const usage = await api().get('/api/diet/assistant/usage').set('Cookie', user.cookie);
    expect(usage.body.data).toMatchObject({ limit: 5, used: 5, remaining: 0 });
  });

  it('locks login after five failed attempts and keeps the generic message', async () => {
    const user = await createUser(`lockout-${Date.now()}@example.com`);
    const ip = '203.0.113.10';

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await failLogin(user.email, ip);
      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    }

    const locked = await failLogin(user.email, ip);
    expect(locked.status).toBe(429);
    expect(locked.headers['retry-after']).toBeDefined();
    expect(Number(locked.headers['retry-after'])).toBeGreaterThan(0);
    expect(locked.body.error).toMatchObject({
      code: 'RATE_LIMITED',
      retryAfterSec: expect.any(Number)
    });

    const unknown = await failLogin(`unknown-${Date.now()}@example.com`, '203.0.113.11');
    const wrong = await failLogin(user.email, '203.0.113.12', 'still-wrong');
    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(unknown.body.error.message).toBe(wrong.body.error.message);

    const keys = loginLimitKeys(ip, user.email);
    const pair = await peekLimit(keys.pairKey);
    expect(pair.used).toBe(5);
  });

  it('does not count a successful login and resets the pair counter', async () => {
    const user = await createUser(`reset-pair-${Date.now()}@example.com`);
    const ip = '203.0.113.13';

    for (let attempt = 0; attempt < 3; attempt += 1) {
      expect((await failLogin(user.email, ip)).status).toBe(401);
    }

    const success = await api()
      .post('/api/auth/login')
      .set('X-Forwarded-For', ip)
      .send({ email: user.email, password: 'password123' });
    expect(success.status).toBe(200);

    const keys = loginLimitKeys(ip, user.email);
    expect((await peekLimit(keys.pairKey)).used).toBe(0);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect((await failLogin(user.email, ip)).status).toBe(401);
    }
    expect((await failLogin(user.email, ip)).status).toBe(429);
  });

  it('limits signups to five per IP per hour', async () => {
    const ip = '203.0.113.20';
    const statuses = [];

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const response = await api()
        .post('/api/auth/signup')
        .set('X-Forwarded-For', ip)
        .send({
          name: 'Signup Limit',
          email: `signup-limit-${Date.now()}-${attempt}@example.com`,
          password: 'password123'
        });
      statuses.push(response.status);
      if (attempt === 5) {
        expect(response.body.error).toMatchObject({
          code: 'RATE_LIMITED',
          retryAfterSec: expect.any(Number)
        });
        expect(response.headers['retry-after']).toBeDefined();
      }
    }

    expect(statuses.slice(0, 5)).toEqual([201, 201, 201, 201, 201]);
    expect(statuses[5]).toBe(429);
  });

  it('keeps usage reset time in the future', async () => {
    const user = await createUser(`reset-time-${Date.now()}@example.com`);
    const usage = await api().get('/api/diet/assistant/usage').set('Cookie', user.cookie);
    expect(new Date(usage.body.data.resetsAt).getTime()).toBeGreaterThan(Date.now());

    const now = new Date('2026-11-13T18:29:00.000Z');
    const daily = await getDailyUsage(`test:reset:${new mongoose.Types.ObjectId()}`, {
      limit: 5,
      now,
      timeZone: 'Asia/Kolkata'
    });
    expect(daily.used).toBe(0);
    expect(daily.remaining).toBe(5);
  });
});

process.env.RAG_MOCK = 'false';
process.env.LLM_API_KEY = 'dummy_llm_api_key';
process.env.LLM_MODEL = 'set_me_later';
process.env.EMBEDDING_MODEL = 'set_me_later';
process.env.SIGNUP_IP_LIMIT = '1000';
process.env.LOGIN_PAIR_LIMIT = '1000';
process.env.LOGIN_IP_LIMIT = '1000';
process.env.GLOBAL_IP_LIMIT = '10000';
process.env.ASSISTANT_DAILY_LIMIT = '5';

import { describe, it, expect } from 'vitest';
import request from 'supertest';

const { app } = await import('../src/app.js');

const input = {
  mode: 'plan',
  goal: 'maintain',
  mealsPerDay: 3,
  dietPreference: 'veg',
  allergies: []
};

describe('H01 assistant quota refund', () => {
  it('refunds the daily quota when the provider is not configured', async () => {
    const signup = await request(app)
      .post('/api/auth/signup')
      .set('X-Forwarded-For', '198.51.100.200')
      .send({
        name: 'Refund User',
        email: `refund-${Date.now()}@example.com`,
        password: 'password123'
      });
    expect(signup.status).toBe(201);
    const cookie = signup.headers['set-cookie'][0];

    const before = await request(app).get('/api/diet/assistant/usage').set('Cookie', cookie);
    expect(before.body.data).toMatchObject({ limit: 5, used: 0, remaining: 5 });

    const failed = await request(app)
      .post('/api/diet/assistant/generate')
      .set('Cookie', cookie)
      .send(input);
    expect(failed.status).toBe(500);
    expect(failed.body.error.code).toBe('LLM_NOT_CONFIGURED');

    const after = await request(app).get('/api/diet/assistant/usage').set('Cookie', cookie);
    expect(after.body.data).toMatchObject({ limit: 5, used: 0, remaining: 5 });
  });
});

import { describe, it, expect } from 'vitest';
import { api } from './helpers.js';

describe('hardening', () => {
  it('rejects oversized JSON bodies with the standard error', async () => {
    const res = await api()
      .post('/api/auth/signup')
      .send({
        name: 'Big Body',
        email: 'big@example.com',
        password: 'password123',
        pad: 'x'.repeat(1_100_000)
      });

    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('only allows the configured client origin through CORS', async () => {
    const allowed = await api().get('/api/health').set('Origin', 'http://localhost:5173');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');

    const blocked = await api().get('/api/health').set('Origin', 'https://evil.example.com');
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('rejects unknown query parameters on list endpoints', async () => {
    const res = await api().get('/api/health');
    expect(res.status).toBe(200);

    const signup = await api()
      .post('/api/auth/signup')
      .send({ name: 'Query User', email: 'query@example.com', password: 'password123' });
    const cookie = signup.headers['set-cookie'][0];

    const bad = await api().get('/api/exercises?unexpected=1').set('Cookie', cookie);
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('VALIDATION_ERROR');
  });
});

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { api, signupUser } from './helpers.js';

describe('auth', () => {
  it('signs up a user, sets an httpOnly cookie and hides the password hash', async () => {
    const { response } = await signupUser({ name: 'Asha Rao', email: 'ASHA@example.com' });
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe('asha@example.com');
    expect(response.body.data.user).not.toHaveProperty('passwordHash');
    const cookie = response.headers['set-cookie'][0];
    expect(cookie).toContain('token=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
  });

  it('rejects a duplicate email regardless of case', async () => {
    await signupUser({ email: 'dupe@example.com' });
    const res = await api()
      .post('/api/auth/signup')
      .send({ name: 'Other User', email: 'DUPE@example.com', password: 'password123' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('rejects weak passwords with a field message', async () => {
    const res = await api()
      .post('/api/auth/signup')
      .send({ name: 'Weak Pass', email: 'weak@example.com', password: 'abcdefgh' });
    expect(res.status).toBe(400);
    expect(res.body.error.fields.password).toMatch(/number/i);
  });

  it('rejects unknown fields and short names', async () => {
    const res = await api()
      .post('/api/auth/signup')
      .send({ name: 'A', email: 'x@example.com', password: 'password123', admin: true });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.name).toBeTruthy();
  });

  it('logs in with a case-insensitive email and rejects a wrong password', async () => {
    await signupUser({ email: 'login@example.com', password: 'password123' });

    const ok = await api()
      .post('/api/auth/login')
      .send({ email: 'LOGIN@example.com', password: 'password123' });
    expect(ok.status).toBe(200);
    expect(ok.headers['set-cookie'][0]).toContain('token=');

    const bad = await api()
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'password124' });
    expect(bad.status).toBe(401);
    expect(bad.body.error.code).toBe('INVALID_CREDENTIALS');

    const missing = await api()
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });
    expect(missing.status).toBe(401);
  });

  it('returns the current user with a cookie or bearer token, and blocks anonymous access', async () => {
    const { response } = await signupUser({ name: 'Me User' });
    const token = response.body.data.token;
    const cookie = response.headers['set-cookie'][0];
    expect(token).toBeUndefined();

    const withCookie = await api().get('/api/auth/me').set('Cookie', cookie);
    expect(withCookie.status).toBe(200);
    expect(withCookie.body.data.user.name).toBe('Me User');

    const withBearer = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${cookie.split(';')[0].slice('token='.length)}`);
    expect(withBearer.status).toBe(200);

    const anonymous = await api().get('/api/auth/me');
    expect(anonymous.status).toBe(401);
    expect(anonymous.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('clears the cookie on logout', async () => {
    const agent = request.agent(app);
    const email = `logout${Date.now()}@example.com`;
    await agent.post('/api/auth/signup').send({ name: 'Logout User', email, password: 'password123' });
    expect((await agent.get('/api/auth/me')).status).toBe(200);

    const out = await agent.post('/api/auth/logout');
    expect(out.status).toBe(200);
    expect(out.headers['set-cookie'][0]).toContain('token=');
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });
});

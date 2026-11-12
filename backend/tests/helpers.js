import request from 'supertest';
import { app } from '../src/app.js';

export function api() {
  return request(app);
}

export async function signupUser(overrides = {}) {
  const email = overrides.email ?? `user${Date.now()}${Math.random().toString(16).slice(2, 8)}@example.com`;
  const response = await api().post('/api/auth/signup').send({
    name: 'Test User',
    email,
    password: 'password123',
    ...overrides
  });
  const cookie = response.headers['set-cookie']?.[0] ?? '';
  return { response, cookie, email, user: response.body?.data?.user };
}

export function auth(req, cookie) {
  return req.set('Cookie', cookie);
}

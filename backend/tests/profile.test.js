import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { api, signupUser } from './helpers.js';
import { uploadsDir } from '../src/config/cloudinary.js';

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

async function authUser() {
  const { cookie, response } = await signupUser();
  return { cookie, user: response.body.data.user };
}

describe('profile', () => {
  it('reads and patches optional profile fields, trimming strings', async () => {
    const { cookie } = await authUser();

    const res = await api()
      .patch('/api/profile')
      .set('Cookie', cookie)
      .send({ name: '  New Name  ', profile: { age: 30, goal: 'fat_loss', weightKg: 72.5 } });

    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toBe('New Name');
    expect(res.body.data.user.profile).toMatchObject({ age: 30, goal: 'fat_loss', weightKg: 72.5 });
  });

  it('clears a field sent as null and rejects invalid values', async () => {
    const { cookie } = await authUser();
    await api().patch('/api/profile').set('Cookie', cookie).send({ profile: { age: 30 } });

    const cleared = await api()
      .patch('/api/profile')
      .set('Cookie', cookie)
      .send({ profile: { age: null } });
    expect(cleared.status).toBe(200);
    expect(cleared.body.data.user.profile.age).toBeUndefined();

    const invalid = await api()
      .patch('/api/profile')
      .set('Cookie', cookie)
      .send({ profile: { age: 12 } });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.fields['profile.age']).toMatch(/13/);

    const unknown = await api()
      .patch('/api/profile')
      .set('Cookie', cookie)
      .send({ profile: { age: 20 }, admin: true });
    expect(unknown.status).toBe(400);
  });

  it('requires authentication', async () => {
    const res = await api().get('/api/profile');
    expect(res.status).toBe(401);
  });

  it('stores a mock avatar and serves it from /uploads', async () => {
    const { cookie } = await authUser();

    const res = await api()
      .post('/api/profile/avatar')
      .set('Cookie', cookie)
      .attach('avatar', png, { filename: 'avatar.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    const url = res.body.data.avatarUrl;
    expect(url).toMatch(/^\/uploads\/.+\.png$/);

    const filename = url.split('/').pop();
    await expect(fs.access(path.join(uploadsDir, filename))).resolves.toBeUndefined();

    const fetched = await api().get(url);
    expect(fetched.status).toBe(200);
  });

  it('rejects a non-image and an oversized file', async () => {
    const { cookie } = await authUser();

    const wrongType = await api()
      .post('/api/profile/avatar')
      .set('Cookie', cookie)
      .attach('avatar', Buffer.from('hello'), { filename: 'notes.txt', contentType: 'text/plain' });
    expect(wrongType.status).toBe(400);
    expect(wrongType.body.error.code).toBe('INVALID_FILE');

    const tooBig = await api()
      .post('/api/profile/avatar')
      .set('Cookie', cookie)
      .attach('avatar', Buffer.alloc(2 * 1024 * 1024 + 10), {
        filename: 'big.png',
        contentType: 'image/png'
      });
    expect(tooBig.status).toBe(400);
    expect(tooBig.body.error.code).toBe('INVALID_FILE');
  });

  it('deletes the avatar file and clears the user fields', async () => {
    const { cookie } = await authUser();
    const uploaded = await api()
      .post('/api/profile/avatar')
      .set('Cookie', cookie)
      .attach('avatar', png, { filename: 'avatar.png', contentType: 'image/png' });
    const filename = uploaded.body.data.avatarUrl.split('/').pop();

    const res = await api().delete('/api/profile/avatar').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.user.avatarUrl).toBeNull();
    await expect(fs.access(path.join(uploadsDir, filename))).rejects.toThrow();
  });
});

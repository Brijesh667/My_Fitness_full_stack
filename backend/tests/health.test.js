import { describe, it, expect } from 'vitest';
import { api } from './helpers.js';

describe('health', () => {
  it('responds with the standard success envelope', async () => {
    const res = await api().get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data).toHaveProperty('database');
  });

  it('returns the standard error shape for unknown routes', async () => {
    const res = await api().get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: expect.stringContaining('No route matches') }
    });
  });

  it('keeps the IP debug route hidden by default', async () => {
    const res = await api().get('/api/debug/ip');
    expect(res.status).toBe(404);
  });
});

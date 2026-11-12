process.env.ENABLE_IP_DEBUG = 'true';
process.env.TRUST_PROXY_HOPS = '1';

import { describe, it, expect } from 'vitest';
import request from 'supertest';

const { app } = await import('../src/app.js');

describe('IP debug route', () => {
  it('returns the resolved IP and forwarded header when explicitly enabled', async () => {
    const response = await request(app)
      .get('/api/debug/ip')
      .set('X-Forwarded-For', '203.0.113.55');

    expect(response.status).toBe(200);
    expect(response.body.data.ip).toBe('203.0.113.55');
    expect(response.body.data.xForwardedFor).toContain('203.0.113.55');
  });
});

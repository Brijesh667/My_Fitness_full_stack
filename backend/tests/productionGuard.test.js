import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function runEnv(overrides) {
  return spawnSync(process.execPath, ['src/config/env.js'], {
    cwd: backendRoot,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      CLOUDINARY_MOCK: 'true',
      RAG_MOCK: 'true',
      ALLOW_MOCK_IN_PROD: 'false',
      ...overrides
    },
    encoding: 'utf8'
  });
}

describe('production environment guard', () => {
  it('rejects mock providers in production unless explicitly allowed', () => {
    const rejected = runEnv();
    expect(rejected.status).toBe(1);
    expect(rejected.stderr).toContain('mock providers');

    const allowed = runEnv({ ALLOW_MOCK_IN_PROD: 'true' });
    expect(allowed.status).toBe(0);
  });

  it('accepts production with real providers configured', () => {
    const result = runEnv({
      CLOUDINARY_MOCK: 'false',
      RAG_MOCK: 'false',
      CLOUDINARY_CLOUD_NAME: 'real-cloud',
      CLOUDINARY_API_KEY: 'real-key',
      CLOUDINARY_API_SECRET: 'real-secret',
      LLM_API_KEY: 'real-llm-key',
      LLM_MODEL: 'gemini-3.5-flash-lite',
      EMBEDDING_MODEL: 'gemini-embedding-001'
    });
    expect(result.status).toBe(0);
  });
});

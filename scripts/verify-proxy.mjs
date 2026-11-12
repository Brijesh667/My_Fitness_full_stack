#!/usr/bin/env node
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import waitOn from 'wait-on';

const ROOT = path.resolve(import.meta.dirname, '..');
const BACKEND = path.join(ROOT, 'backend');
const FRONTEND = path.join(ROOT, 'frontend');
const BACKEND_PORT = process.env.VERIFY_BACKEND_PORT ?? '5000';
const PROXY_PORT = process.env.VERIFY_PROXY_PORT ?? '4173';
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;
const PROXY_URL = `http://localhost:${PROXY_PORT}`;

const results = [];
const children = [];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function run(command, args, cwd, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: 'inherit'
    });
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`))));
  });
}

async function step(name, fn) {
  const started = Date.now();
  console.log(`\n=== ${name} ===`);
  try {
    await fn();
    results.push({ step: name, status: 'PASS', duration: `${((Date.now() - started) / 1000).toFixed(1)}s` });
    return true;
  } catch (error) {
    results.push({ step: name, status: 'FAIL', detail: error.message });
    console.error(`FAIL: ${error.message}`);
    return false;
  }
}

function start(name, command, args, cwd, env) {
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: 'inherit',
    detached: true
  });
  children.push({ name, child });
  return child;
}

function stopAll() {
  for (const { name, child } of children) {
    try {
      process.kill(-child.pid, 'SIGTERM');
      console.log(`stopped ${name}`);
    } catch {
      // already stopped
    }
  }
}

async function waitForDatabase() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/health`);
      if (response.ok) {
        const body = await response.json();
        if (body.data?.database === 'connected') return;
      }
    } catch {
      // starting
    }
    await sleep(500);
  }
  throw new Error('backend did not report a connected database');
}

async function main() {
  const backendEnv = {
    PORT: BACKEND_PORT,
    CLIENT_URL: PROXY_URL,
    NODE_ENV: 'development',
    RAG_MOCK: 'true',
    CLOUDINARY_MOCK: 'true',
    ASSISTANT_DAILY_LIMIT: '5',
    APP_TIMEZONE: 'Asia/Kolkata',
    LOGIN_PAIR_LIMIT: '5',
    LOGIN_IP_LIMIT: '20',
    LOGIN_WINDOW_MINUTES: '15',
    SIGNUP_IP_LIMIT: '1000',
    SIGNUP_WINDOW_MINUTES: '60',
    GLOBAL_IP_LIMIT: '10000',
    GLOBAL_WINDOW_MINUTES: '15',
    TRUST_PROXY_HOPS: '2'
  };

  await step('build frontend for same-origin', () =>
    run('npm', ['run', 'build'], FRONTEND, { VITE_API_URL: '/api' })
  );
  await step('seed exercises', () => run('npm', ['run', 'seed:exercises'], BACKEND));
  await step('ingest rag documents', () => run('npm', ['run', 'rag:ingest'], BACKEND));

  try {
    await step('start backend and proxy', async () => {
      start('backend', 'node', ['src/server.js'], BACKEND, backendEnv);
      start('proxy', 'node', ['scripts/proxy-server.mjs'], ROOT, {
        PROXY_PORT,
        PROXY_TARGET_PORT: BACKEND_PORT
      });
      await waitOn({
        resources: [`http-get://localhost:${BACKEND_PORT}/api/health`, `http-get://localhost:${PROXY_PORT}`],
        timeout: 90_000,
        interval: 500,
        validateStatus: (status) => status === 200
      });
      await waitForDatabase();
    });

    await step('api smoke through proxy', () =>
      run('node', ['scripts/smoke-api.mjs', `--base-url=${PROXY_URL}`], BACKEND)
    );
    await step('playwright e2e through proxy', () =>
      run('npm', ['run', 'test:e2e'], FRONTEND, { E2E_BASE_URL: PROXY_URL })
    );
  } finally {
    stopAll();
    await step('cleanup smoke data', () => run('node', ['scripts/cleanup-smoke.mjs'], BACKEND));
  }

  console.log('\nSame-origin proxy verification');
  console.table(results);
  const failed = results.filter((item) => item.status === 'FAIL');
  if (failed.length) {
    console.error(`${failed.length} proxy verification step(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log('Same-origin proxy verification passed.');
  }
}

main().catch((error) => {
  console.error(error);
  stopAll();
  process.exitCode = 1;
});

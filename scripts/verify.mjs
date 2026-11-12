#!/usr/bin/env node
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname, '..');
const BACKEND = path.join(ROOT, 'backend');
const FRONTEND = path.join(ROOT, 'frontend');
const results = [];

function run(command, args, cwd, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: 'inherit'
    });
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited with ${code}`))));
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
    results.push({ step: name, status: 'FAIL', duration: `${((Date.now() - started) / 1000).toFixed(1)}s`, detail: error.message });
    console.error(`FAIL: ${error.message}`);
    return false;
  }
}

async function main() {
  await step('backend lint', () => run('npm', ['run', 'lint'], BACKEND));
  await step('backend tests', () => run('npm', ['test'], BACKEND));
  await step('frontend typecheck', () => run('npm', ['run', 'typecheck'], FRONTEND));
  await step('frontend lint', () => run('npm', ['run', 'lint'], FRONTEND));
  await step('frontend build', () => run('npm', ['run', 'build'], FRONTEND));
  await step('seed exercises', () => run('npm', ['run', 'seed:exercises'], BACKEND));
  await step('ingest rag documents', () => run('npm', ['run', 'rag:ingest'], BACKEND));
  await step('same-origin proxy verification', () =>
    run('node', ['scripts/verify-proxy.mjs'], ROOT, {
      VERIFY_BACKEND_PORT: '5100',
      VERIFY_PROXY_PORT: '4173'
    })
  );

  console.log('\nVerification summary');
  console.table(results);
  const failed = results.filter((item) => item.status === 'FAIL');
  if (failed.length) {
    console.error(`${failed.length} verification step(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log('All verification steps passed.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

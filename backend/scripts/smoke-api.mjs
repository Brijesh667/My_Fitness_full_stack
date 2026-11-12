#!/usr/bin/env node
const arg = process.argv.find((value) => value.startsWith('--base-url='));
const baseArg = arg ? arg.split('=').slice(1).join('=') : 'http://localhost:5000';
const root = baseArg.replace(/\/+$/, '').replace(/\/api$/, '');

const results = [];
let cookie = '';

function localToday() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function dayKeyOf(dateKey) {
  const date = new Date(`${dateKey}T12:00:00`);
  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
}

function record(step, status, expected, ok) {
  results.push({ step, status, expected, result: ok ? 'PASS' : 'FAIL' });
}

async function request(step, path, options = {}) {
  const { method = 'GET', body, expected = [200], useCookie = true, headers = {} } = options;
  const response = await fetch(`${root}/api${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(useCookie && cookie ? { Cookie: cookie } : {}),
      ...headers
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(60_000)
  });

  const setCookie = response.headers.getSetCookie?.()?.[0] ?? response.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  const ok = expected.includes(response.status);
  record(step, response.status, expected.join('/'), ok);
  if (!ok) {
    throw new Error(`${step}: expected ${expected.join('/')}, got ${response.status} ${text.slice(0, 400)}`);
  }
  return { response, data };
}

function assert(step, condition, message) {
  if (!condition) {
    record(step, '-', 'assertion', false);
    throw new Error(`${step}: ${message}`);
  }
  record(step, 'ok', 'assertion', true);
}

async function main() {
  const email = `smoke+${Date.now()}@example.test`;
  const password = 'SmokePass123';
  const today = localToday();
  const day = dayKeyOf(today);

  await request('health', '/health');
  await request('signup', '/auth/signup', {
    method: 'POST',
    body: { name: 'Smoke User', email, password },
    expected: [201]
  });
  await request('login', '/auth/login', {
    method: 'POST',
    body: { email, password },
    expected: [200],
    useCookie: false
  });
  await request('me', '/auth/me');
  await request('profile patch', '/profile', {
    method: 'PATCH',
    body: { profile: { goal: 'maintain', weightKg: 72.5 } }
  });

  const exerciseSearch = await request(
    'exercise search',
    '/exercises?search=bench&muscle=chest&limit=10'
  );
  assert('exercise search results', exerciseSearch.data.data.items.length > 0, 'no chest exercises found');
  const libraryExercise = exerciseSearch.data.data.items.find((item) => item.name === 'Barbell Bench Press') ??
    exerciseSearch.data.data.items[0];

  await request('plan muscles', `/plan/days/${day}/muscles`, {
    method: 'PUT',
    body: { muscles: ['chest'] }
  });
  await request('plan library exercise', `/plan/days/${day}/exercises`, {
    method: 'POST',
    body: { exerciseId: libraryExercise._id },
    expected: [201]
  });
  const planAfterCustom = await request('plan custom exercise', `/plan/days/${day}/exercises`, {
    method: 'POST',
    body: {
      custom: {
        name: 'Smoke Press',
        description: 'Smoke test movement',
        sets: [{ tag: 'normal', repetitions: 10 }, { tag: 'failure', repetitions: 8 }]
      },
      targetMuscle: 'chest'
    },
    expected: [201]
  });
  const planExerciseId = planAfterCustom.data.data.day.muscles[0].exercises[0]._id;

  const sessionStart = await request('session start', '/sessions/start', {
    method: 'POST',
    body: { date: today },
    expected: [201]
  });
  const sessionId = sessionStart.data.data.session._id;

  await request('timer start', `/sessions/${sessionId}/timer`, {
    method: 'POST',
    body: { action: 'start' }
  });
  await request('exercise start', `/sessions/${sessionId}/exercises/${planExerciseId}/start`, {
    method: 'POST'
  });
  await request('set complete', `/sessions/${sessionId}/exercises/${planExerciseId}/sets/0`, {
    method: 'PATCH',
    body: { completed: true, actualReps: 8, weightKg: 60.5 }
  });
  await request('session finish', `/sessions/${sessionId}/finish`, { method: 'POST' });

  await request('analytics summary', '/analytics/summary?range=week');
  await request('analytics heatmap', '/analytics/heatmap?days=120');

  const dietPlan = await request('diet plan put', '/diet/plan', {
    method: 'PUT',
    body: {
      name: 'Smoke diet',
      goal: 'maintain',
      dailyTargets: { calories: 2000, proteinG: 120, carbsG: 220, fatG: 60 },
      days: [
        {
          day,
          meals: [
            {
              type: 'breakfast',
              time: '08:00',
              notes: 'Smoke breakfast',
              items: [
                { name: 'Oats', quantity: 50, unit: 'g', calories: 190, proteinG: 7, carbsG: 33, fatG: 4 }
              ]
            }
          ]
        }
      ]
    }
  });
  const dietDay = dietPlan.data.data.plan.days.find((entry) => entry.day === day);
  const mealId = dietDay.meals[0]._id;
  const dietLog = await request('diet log put', `/diet/log?date=${today}`, {
    method: 'PUT',
    body: {
      meals: [
        {
          planMealId: mealId,
          type: 'breakfast',
          status: 'eaten',
          items: [
            { name: 'Oats', quantity: 50, unit: 'g', calories: 190, proteinG: 7, carbsG: 33, fatG: 4 }
          ]
        }
      ]
    }
  });
  assert('diet totals', dietLog.data.data.log.totals.calories === 190, 'diet totals differ');

  const assistantInput = {
    mode: 'plan',
    goal: 'maintain',
    mealsPerDay: 3,
    dietPreference: 'veg',
    allergies: [],
    notes: 'smoke test'
  };
  const firstGeneration = await request('assistant generate 1', '/diet/assistant/generate', {
    method: 'POST',
    body: assistantInput
  });
  assert('assistant shape', firstGeneration.data.data.plan?.days?.length === 7, 'assistant plan is invalid');

  const usage = await request('assistant usage', '/diet/assistant/usage');
  assert(
    'assistant usage shape',
    usage.data.data.limit >= 1 && usage.data.data.used === 1,
    'unexpected usage counters'
  );

  for (let index = 2; index <= 5; index += 1) {
    await request(`assistant generate ${index}`, '/diet/assistant/generate', {
      method: 'POST',
      body: assistantInput
    });
  }
  const sixth = await request('assistant generate 6 (limit)', '/diet/assistant/generate', {
    method: 'POST',
    body: assistantInput,
    expected: [429]
  });
  assert(
    'assistant 429 shape',
    sixth.data.error.code === 'RATE_LIMITED' &&
      Number(sixth.response.headers.get('retry-after')) > 0 &&
      Number(sixth.data.error.retryAfterSec) > 0,
    'missing retry information'
  );

  for (let attempt = 0; attempt < 5; attempt += 1) {
    await request(`failed login ${attempt + 1}`, '/auth/login', {
      method: 'POST',
      body: { email, password: 'wrong-password' },
      expected: [401],
      useCookie: false
    });
  }
  const locked = await request('login lockout', '/auth/login', {
    method: 'POST',
    body: { email, password: 'wrong-password' },
    expected: [429],
    useCookie: false
  });
  assert(
    'login 429 shape',
    locked.data.error.code === 'RATE_LIMITED' &&
      Number(locked.response.headers.get('retry-after')) > 0 &&
      Number(locked.data.error.retryAfterSec) > 0,
    'missing login retry information'
  );

  await request('logout', '/auth/logout', { method: 'POST' });
  console.log('\nSmoke API');
  console.table(results);
  console.log(`Base URL: ${root}`);
  console.log(`Test user: ${email}`);
}

main().catch((error) => {
  record('unexpected failure', '-', '-', false);
  console.error(`\nSmoke API failed: ${error.message}`);
  console.table(results);
  process.exitCode = 1;
});

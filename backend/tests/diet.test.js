import { describe, it, expect } from 'vitest';
import { api, signupUser } from './helpers.js';
import { DietLog } from '../src/models/DietLog.js';
import { addDays, todayKey } from '../src/utils/dates.js';

const item = (overrides = {}) => ({
  name: 'Oats',
  quantity: 50,
  unit: 'g',
  calories: 190,
  proteinG: 6.5,
  carbsG: 33,
  fatG: 3.5,
  ...overrides
});

function basePlan(overrides = {}) {
  return {
    name: 'Lean plan',
    goal: 'fat_loss',
    dailyTargets: { calories: 2000, proteinG: 150, carbsG: 200, fatG: 60 },
    days: [
      {
        day: 'mon',
        meals: [
          { type: 'breakfast', time: '08:00', notes: 'Quick bowl', items: [item()] },
          {
            type: 'lunch',
            time: '13:00',
            items: [item({ name: 'Rice', quantity: 150, calories: 250, proteinG: 5, carbsG: 55, fatG: 1 })]
          },
          {
            type: 'dinner',
            time: '20:00',
            items: [item({ name: 'Dal', quantity: 200, calories: 220, proteinG: 12, carbsG: 30, fatG: 4 })]
          }
        ]
      },
      { day: 'tue', meals: [] }
    ],
    ...overrides
  };
}

describe('diet plan', () => {
  it('creates one plan, fills seven ordered days, and replaces it with PUT', async () => {
    const { cookie } = await signupUser();
    const res = await api().post('/api/diet/plan').set('Cookie', cookie).send(basePlan());
    expect(res.status).toBe(201);
    const plan = res.body.data.plan;
    expect(plan.days.map((d) => d.day)).toEqual(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
    expect(plan.days[0].meals).toHaveLength(3);
    expect(plan.days[0].meals[0]._id).toBeTruthy();
    expect(plan.source).toBe('manual');
    expect(plan.days[0].meals[1].items[0].calories).toBe(250);

    const duplicate = await api().post('/api/diet/plan').set('Cookie', cookie).send(basePlan());
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('PLAN_EXISTS');

    const replaced = await api()
      .put('/api/diet/plan')
      .set('Cookie', cookie)
      .send(basePlan({ name: 'High protein plan', goal: 'muscle_gain' }));
    expect(replaced.status).toBe(200);
    expect(replaced.body.data.plan.name).toBe('High protein plan');
    expect(replaced.body.data.plan.goal).toBe('muscle_gain');

    const fetched = await api().get('/api/diet/plan').set('Cookie', cookie);
    expect(fetched.body.data.plan.name).toBe('High protein plan');
  });

  it('keeps citations for generated plans', async () => {
    const { cookie } = await signupUser();
    const res = await api()
      .post('/api/diet/plan')
      .set('Cookie', cookie)
      .send(
        basePlan({
          source: 'ai',
          citations: [{ source: 'Sample note', chunkId: 'chunk-1' }]
        })
      );
    expect(res.status).toBe(201);
    expect(res.body.data.plan.source).toBe('ai');
    expect(res.body.data.plan.citations).toHaveLength(1);
  });

  it('enforces plan field rules', async () => {
    const { cookie } = await signupUser();
    const nineMeals = Array.from({ length: 9 }, () => ({ type: 'snack', items: [] }));
    const sixteenItems = Array.from({ length: 16 }, () => item());

    const cases = [
      basePlan({ name: 'A' }),
      basePlan({ goal: 'bulk' }),
      basePlan({ dailyTargets: { calories: 700, proteinG: 150, carbsG: 200, fatG: 60 } }),
      basePlan({ dailyTargets: { calories: 2000, proteinG: 5, carbsG: 200, fatG: 60 } }),
      basePlan({ days: [{ day: 'mon', meals: nineMeals }] }),
      basePlan({ days: [{ day: 'mon', meals: [{ type: 'lunch', time: '08:00', items: sixteenItems }] }] }),
      basePlan({ days: [{ day: 'mon', meals: [{ type: 'lunch', time: '25:00', items: [] }] }] }),
      basePlan({ days: [{ day: 'mon', meals: [{ type: 'lunch', items: [item({ quantity: 0.05 })] }] }] }),
      basePlan({ days: [{ day: 'mon', meals: [] }, { day: 'mon', meals: [] }] }),
      basePlan({ days: [] }),
      { ...basePlan(), extra: true }
    ];

    for (const payload of cases) {
      const res = await api().post('/api/diet/plan').set('Cookie', cookie).send(payload);
      expect(res.status).toBe(400);
    }
  });
});

describe('diet log', () => {
  async function planWithIds(cookie) {
    const res = await api().post('/api/diet/plan').set('Cookie', cookie).send(basePlan());
    const plan = res.body.data.plan;
    return { plan, meals: plan.days[0].meals };
  }

  it('computes totals and adherence server-side, ignoring skipped meals', async () => {
    const { cookie } = await signupUser();
    const { meals } = await planWithIds(cookie);
    const date = '2026-01-05'; // Monday

    const empty = await api().get(`/api/diet/log?date=${date}`).set('Cookie', cookie);
    expect(empty.body.data.exists).toBe(false);
    expect(empty.body.data.log.totals.calories).toBe(0);

    const res = await api()
      .put(`/api/diet/log?date=${date}`)
      .set('Cookie', cookie)
      .send({
        meals: [
          {
            planMealId: meals[0]._id,
            type: 'breakfast',
            status: 'eaten',
            items: [item({ calories: 300, proteinG: 20 })]
          },
          {
            planMealId: meals[1]._id,
            type: 'lunch',
            status: 'modified',
            items: [item({ name: 'Rice bowl', calories: 400, proteinG: 10 })]
          },
          {
            planMealId: meals[2]._id,
            type: 'dinner',
            status: 'skipped',
            items: [item({ name: 'Dal', calories: 900, proteinG: 50 })]
          },
          {
            type: 'snack',
            status: 'eaten',
            items: [item({ name: 'Apple', calories: 100, proteinG: 1 })]
          }
        ]
      });

    expect(res.status).toBe(200);
    const log = res.body.data.log;
    expect(log.totals).toEqual({ calories: 800, proteinG: 31, carbsG: 99, fatG: 10.5 });
    expect(log.meals[2].totals.calories).toBe(0);
    expect(log.adherencePct).toBe(67);

    const fetched = await api().get(`/api/diet/log?date=${date}`).set('Cookie', cookie);
    expect(fetched.body.data.exists).toBe(true);
    expect(fetched.body.data.log.totals.calories).toBe(800);
  });

  it('upserts a single log per date and revalidates input', async () => {
    const { cookie } = await signupUser();
    const date = todayKey();
    const first = await api()
      .put(`/api/diet/log?date=${date}`)
      .set('Cookie', cookie)
      .send({
        meals: [{ type: 'lunch', status: 'eaten', items: [item({ name: 'Pasta', calories: 500 })] }]
      });
    expect(first.status).toBe(200);

    const second = await api()
      .put(`/api/diet/log?date=${date}`)
      .set('Cookie', cookie)
      .send({ meals: [] });
    expect(second.body.data.log.totals.calories).toBe(0);

    expect(await DietLog.countDocuments({})).toBe(1);

    const badDate = await api().put('/api/diet/log?date=2026-13-01').set('Cookie', cookie).send({ meals: [] });
    expect(badDate.status).toBe(400);

    const unknown = await api()
      .put(`/api/diet/log?date=${date}`)
      .set('Cookie', cookie)
      .send({ meals: [], totals: { calories: 9999 } });
    expect(unknown.status).toBe(400);
  });

  it('averages logged macros against the plan targets', async () => {
    const { cookie } = await signupUser();
    await api().post('/api/diet/plan').set('Cookie', cookie).send(basePlan());
    const today = todayKey();

    await api()
      .put(`/api/diet/log?date=${addDays(today, -1)}`)
      .set('Cookie', cookie)
      .send({ meals: [{ type: 'lunch', status: 'eaten', items: [item({ calories: 1200, proteinG: 80 })] }] });
    await api()
      .put(`/api/diet/log?date=${today}`)
      .set('Cookie', cookie)
      .send({ meals: [{ type: 'lunch', status: 'eaten', items: [item({ calories: 800, proteinG: 40 })] }] });

    const res = await api().get('/api/diet/analytics?range=week').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.daysLogged).toBe(2);
    expect(res.body.data.avgCalories).toBe(1000);
    expect(res.body.data.avgProteinG).toBe(60);
    expect(res.body.data.dailyTargets.calories).toBe(2000);
    expect(res.body.data.range.from).toBe(addDays(today, -6));
  });

  it('keeps plans and logs private', async () => {
    const first = await signupUser();
    await api().post('/api/diet/plan').set('Cookie', first.cookie).send(basePlan());
    await api()
      .put(`/api/diet/log?date=${todayKey()}`)
      .set('Cookie', first.cookie)
      .send({ meals: [{ type: 'lunch', status: 'eaten', items: [item()] }] });

    const second = await signupUser();
    const plan = await api().get('/api/diet/plan').set('Cookie', second.cookie);
    expect(plan.body.data.plan).toBeNull();

    const log = await api().get(`/api/diet/log?date=${todayKey()}`).set('Cookie', second.cookie);
    expect(log.body.data.log.totals.calories).toBe(0);

    const analytics = await api().get('/api/diet/analytics').set('Cookie', second.cookie);
    expect(analytics.body.data.daysLogged).toBe(0);
  });
});

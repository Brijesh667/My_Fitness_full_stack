import { DietLog } from '../models/DietLog.js';
import { DietPlan } from '../models/DietPlan.js';
import {
  normaliseItem,
  roundTotals,
  sumItems,
  zeroTotals
} from '../models/dietSubSchemas.js';
import { DAY_KEYS, addDays, dayKeyFromDateKey, todayKey } from '../utils/dates.js';
import { conflict } from '../utils/appError.js';

export function serialiseDiet(document) {
  if (!document) return null;
  const data = document.toObject ? document.toObject() : { ...document };
  delete data.__v;
  delete data.user;
  return data;
}

function normalisePlan(input) {
  const byDay = new Map(input.days.map((day) => [day.day, day]));

  const days = DAY_KEYS.map((day) => {
    const source = byDay.get(day);
    return {
      day,
      meals: (source?.meals ?? []).map((meal) => ({
        ...(meal._id ? { _id: meal._id } : {}),
        type: meal.type,
        ...(meal.time ? { time: meal.time } : {}),
        ...(meal.notes ? { notes: meal.notes } : {}),
        items: (meal.items ?? []).map(normaliseItem)
      }))
    };
  });

  return {
    name: input.name,
    goal: input.goal,
    dailyTargets: input.dailyTargets,
    days,
    source: input.source ?? 'manual',
    citations: input.citations ?? []
  };
}

export async function getDietPlan(user) {
  return DietPlan.findOne({ user: user._id });
}

export async function createDietPlan(user, input) {
  const existing = await DietPlan.findOne({ user: user._id });
  if (existing) throw conflict('PLAN_EXISTS', 'You already have a diet plan. Replace it instead.');
  return DietPlan.create({ user: user._id, ...normalisePlan(input) });
}

export async function upsertDietPlan(user, input) {
  return DietPlan.findOneAndUpdate(
    { user: user._id },
    { $set: normalisePlan(input) },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
}

export async function getDietLog(user, date) {
  const log = await DietLog.findOne({ user: user._id, date });
  if (log) return { log: serialiseDiet(log), exists: true };
  return {
    log: { date, meals: [], totals: zeroTotals(), adherencePct: 0 },
    exists: false
  };
}

function normaliseLogMeals(meals) {
  return meals.map((meal) => {
    const items = (meal.items ?? []).map(normaliseItem);
    return {
      ...(meal._id ? { _id: meal._id } : {}),
      planMealId: meal.planMealId ?? null,
      type: meal.type,
      status: meal.status ?? 'eaten',
      items,
      totals: roundTotals(meal.status === 'skipped' ? zeroTotals() : sumItems(items))
    };
  });
}

function totalOfMeals(meals) {
  const totals = meals.reduce(
    (sum, meal) => ({
      calories: sum.calories + meal.totals.calories,
      proteinG: sum.proteinG + meal.totals.proteinG,
      carbsG: sum.carbsG + meal.totals.carbsG,
      fatG: sum.fatG + meal.totals.fatG
    }),
    zeroTotals()
  );
  return roundTotals(totals);
}

async function adherenceFor(user, date, meals, plan) {
  const dayKey = dayKeyFromDateKey(date);
  const planDay = plan?.days.find((day) => day.day === dayKey);
  const plannedIds = new Set((planDay?.meals ?? []).map((meal) => meal._id.toString()));

  if (plannedIds.size === 0) return 0;

  const eaten = meals.filter(
    (meal) => meal.planMealId && plannedIds.has(meal.planMealId.toString()) && meal.status !== 'skipped'
  ).length;

  return Math.min(100, Math.round((eaten / plannedIds.size) * 100));
}

export async function saveDietLog(user, date, input) {
  const meals = normaliseLogMeals(input.meals ?? []);
  const totals = totalOfMeals(meals);
  const plan = await DietPlan.findOne({ user: user._id });
  const adherencePct = await adherenceFor(user, date, meals, plan);

  const log = await DietLog.findOneAndUpdate(
    { user: user._id, date },
    { $set: { meals, totals, adherencePct } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );

  return serialiseDiet(log);
}

export async function getDietAnalytics(user, range) {
  const to = todayKey();
  const from = range === 'month' ? addDays(to, -29) : addDays(to, -6);

  const [plan, logs] = await Promise.all([
    DietPlan.findOne({ user: user._id }),
    DietLog.find({ user: user._id, date: { $gte: from, $lte: to } })
  ]);

  const count = logs.length;
  const average = (pick) =>
    count === 0 ? 0 : Math.round(logs.reduce((sum, log) => sum + pick(log), 0) / count);

  return {
    range: { from, to, label: range },
    daysLogged: count,
    avgCalories: average((log) => log.totals.calories),
    avgProteinG: average((log) => log.totals.proteinG),
    avgCarbsG: average((log) => log.totals.carbsG),
    avgFatG: average((log) => log.totals.fatG),
    adherencePct:
      count === 0 ? 0 : Math.round(logs.reduce((sum, log) => sum + log.adherencePct, 0) / count),
    dailyTargets: plan ? plan.dailyTargets : null
  };
}

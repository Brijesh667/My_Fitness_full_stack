import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createDietPlan,
  getDietAnalytics,
  getDietLog,
  getDietPlan,
  saveDietLog,
  serialiseDiet,
  upsertDietPlan
} from '../services/dietService.js';
import { todayKey } from '../utils/dates.js';

export const getPlanHandler = asyncHandler(async (req, res) => {
  const plan = await getDietPlan(req.user);
  res.json({ success: true, data: { plan: serialiseDiet(plan) } });
});

export const createPlanHandler = asyncHandler(async (req, res) => {
  const plan = await createDietPlan(req.user, req.body);
  res.status(201).json({ success: true, data: { plan: serialiseDiet(plan) } });
});

export const upsertPlanHandler = asyncHandler(async (req, res) => {
  const plan = await upsertDietPlan(req.user, req.body);
  res.json({ success: true, data: { plan: serialiseDiet(plan) } });
});

export const getLogHandler = asyncHandler(async (req, res) => {
  const date = req.query.date ?? todayKey();
  const data = await getDietLog(req.user, date);
  res.json({ success: true, data });
});

export const saveLogHandler = asyncHandler(async (req, res) => {
  const date = req.query.date ?? todayKey();
  const log = await saveDietLog(req.user, date, req.body);
  res.json({ success: true, data: { log } });
});

export const analyticsHandler = asyncHandler(async (req, res) => {
  const data = await getDietAnalytics(req.user, req.query.range);
  res.json({ success: true, data });
});

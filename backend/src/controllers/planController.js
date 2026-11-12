import { asyncHandler } from '../utils/asyncHandler.js';
import {
  addCustomPlanExercise,
  addLibraryExercise,
  getPlan,
  removePlanExercise,
  serialisePlan,
  setDayMuscles,
  updatePlanExercise
} from '../services/planService.js';

const dayOf = (plan, day) => serialisePlan(plan).days.find((entry) => entry.day === day);

export const getPlanHandler = asyncHandler(async (req, res) => {
  const plan = await getPlan(req.user);
  res.json({ success: true, data: { plan: serialisePlan(plan) } });
});

export const setMusclesHandler = asyncHandler(async (req, res) => {
  const plan = await setDayMuscles(req.user, req.params.day, req.body.muscles, req.body.confirm);
  res.json({ success: true, data: { plan: serialisePlan(plan), day: dayOf(plan, req.params.day) } });
});

export const addExerciseHandler = asyncHandler(async (req, res) => {
  const plan = req.body.exerciseId
    ? await addLibraryExercise(req.user, req.params.day, req.body)
    : await addCustomPlanExercise(req.user, req.params.day, req.body);
  res.status(201).json({ success: true, data: { plan: serialisePlan(plan), day: dayOf(plan, req.params.day) } });
});

export const updateExerciseHandler = asyncHandler(async (req, res) => {
  const plan = await updatePlanExercise(
    req.user,
    req.params.day,
    req.params.planExerciseId,
    req.body
  );
  res.json({ success: true, data: { plan: serialisePlan(plan), day: dayOf(plan, req.params.day) } });
});

export const removeExerciseHandler = asyncHandler(async (req, res) => {
  const plan = await removePlanExercise(req.user, req.params.day, req.params.planExerciseId);
  res.json({ success: true, data: { plan: serialisePlan(plan), day: dayOf(plan, req.params.day) } });
});

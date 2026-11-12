import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createCustomExercise,
  deleteCustomExercise,
  getExercise,
  listExercises,
  updateCustomExercise
} from '../services/exerciseService.js';

export const listHandler = asyncHandler(async (req, res) => {
  const data = await listExercises(req.user, req.query);
  res.json({ success: true, data });
});

export const getHandler = asyncHandler(async (req, res) => {
  const exercise = await getExercise(req.user, req.params.id);
  res.json({ success: true, data: { exercise } });
});

export const createHandler = asyncHandler(async (req, res) => {
  const exercise = await createCustomExercise(req.user, req.body);
  res.status(201).json({ success: true, data: { exercise } });
});

export const updateHandler = asyncHandler(async (req, res) => {
  const exercise = await updateCustomExercise(req.user, req.params.id, req.body);
  res.json({ success: true, data: { exercise } });
});

export const deleteHandler = asyncHandler(async (req, res) => {
  await deleteCustomExercise(req.user, req.params.id);
  res.status(204).end();
});

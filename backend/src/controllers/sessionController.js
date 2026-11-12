import { asyncHandler } from '../utils/asyncHandler.js';
import {
  deleteSession,
  finishSession,
  getSession,
  getToday,
  listSessions,
  serialiseSession,
  setTimer,
  skipExercise,
  startExercise,
  startSession,
  updateSet
} from '../services/sessionService.js';

export const todayHandler = asyncHandler(async (req, res) => {
  const data = await getToday(req.user, req.query.date);
  res.json({ success: true, data });
});

export const startHandler = asyncHandler(async (req, res) => {
  const { session, created } = await startSession(req.user, req.body.date);
  res.status(created ? 201 : 200).json({
    success: true,
    data: { session: serialiseSession(session) }
  });
});

export const listHandler = asyncHandler(async (req, res) => {
  const sessions = await listSessions(req.user, req.query);
  res.json({ success: true, data: { sessions: sessions.map((session) => serialiseSession(session)) } });
});

export const getHandler = asyncHandler(async (req, res) => {
  const session = await getSession(req.user, req.params.id);
  res.json({ success: true, data: { session: serialiseSession(session) } });
});

export const timerHandler = asyncHandler(async (req, res) => {
  const session = await setTimer(req.user, req.params.id, req.body.action);
  res.json({ success: true, data: { session: serialiseSession(session) } });
});

export const startExerciseHandler = asyncHandler(async (req, res) => {
  const session = await startExercise(req.user, req.params.id, req.params.planExerciseId);
  res.json({ success: true, data: { session: serialiseSession(session) } });
});

export const updateSetHandler = asyncHandler(async (req, res) => {
  const session = await updateSet(
    req.user,
    req.params.id,
    req.params.planExerciseId,
    Number(req.params.setIndex),
    req.body
  );
  res.json({ success: true, data: { session: serialiseSession(session) } });
});

export const skipHandler = asyncHandler(async (req, res) => {
  const session = await skipExercise(req.user, req.params.id, req.params.planExerciseId);
  res.json({ success: true, data: { session: serialiseSession(session) } });
});

export const finishHandler = asyncHandler(async (req, res) => {
  const session = await finishSession(req.user, req.params.id);
  res.json({ success: true, data: { session: serialiseSession(session) } });
});

export const deleteHandler = asyncHandler(async (req, res) => {
  await deleteSession(req.user, req.params.id);
  res.status(204).end();
});

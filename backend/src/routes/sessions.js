import { Router } from 'express';
import {
  deleteHandler,
  finishHandler,
  getHandler,
  listHandler,
  skipHandler,
  startExerciseHandler,
  startHandler,
  timerHandler,
  todayHandler,
  updateSetHandler
} from '../controllers/sessionController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  dateQuerySchema,
  sessionRangeSchema,
  startSessionSchema,
  timerActionSchema,
  updateSetSchema
} from '../validators/session.js';

const router = Router();

router.use(requireAuth);
router.get('/today', validate(dateQuerySchema, 'query'), todayHandler);
router.post('/start', validate(startSessionSchema), startHandler);
router.get('/', validate(sessionRangeSchema, 'query'), listHandler);
router.get('/:id', getHandler);
router.delete('/:id', deleteHandler);
router.post('/:id/timer', validate(timerActionSchema), timerHandler);
router.post('/:id/exercises/:planExerciseId/start', startExerciseHandler);
router.patch(
  '/:id/exercises/:planExerciseId/sets/:setIndex',
  validate(updateSetSchema),
  updateSetHandler
);
router.post('/:id/exercises/:planExerciseId/skip', skipHandler);
router.post('/:id/finish', finishHandler);

export default router;

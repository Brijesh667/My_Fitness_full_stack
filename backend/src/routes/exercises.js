import { Router } from 'express';
import {
  createHandler,
  deleteHandler,
  getHandler,
  listHandler,
  updateHandler
} from '../controllers/exerciseController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createExerciseSchema,
  listExercisesQuerySchema,
  updateExerciseSchema
} from '../validators/exercise.js';

const router = Router();

router.use(requireAuth);
router.get('/', validate(listExercisesQuerySchema, 'query'), listHandler);
router.get('/:id', getHandler);
router.post('/', validate(createExerciseSchema), createHandler);
router.patch('/:id', validate(updateExerciseSchema), updateHandler);
router.delete('/:id', deleteHandler);

export default router;

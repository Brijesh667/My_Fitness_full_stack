import { Router } from 'express';
import {
  addExerciseHandler,
  getPlanHandler,
  removeExerciseHandler,
  setMusclesHandler,
  updateExerciseHandler
} from '../controllers/planController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  addPlanExerciseSchema,
  setMusclesSchema,
  updatePlanExerciseSchema
} from '../validators/plan.js';

const router = Router();

router.use(requireAuth);
router.get('/', getPlanHandler);
router.put('/days/:day/muscles', validate(setMusclesSchema), setMusclesHandler);
router.post('/days/:day/exercises', validate(addPlanExerciseSchema), addExerciseHandler);
router.patch(
  '/days/:day/exercises/:planExerciseId',
  validate(updatePlanExerciseSchema),
  updateExerciseHandler
);
router.delete('/days/:day/exercises/:planExerciseId', removeExerciseHandler);

export default router;

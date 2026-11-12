import { Router } from 'express';
import {
  analyticsHandler,
  createPlanHandler,
  getLogHandler,
  getPlanHandler,
  saveLogHandler,
  upsertPlanHandler
} from '../controllers/dietController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  dietAnalyticsQuerySchema,
  dietDateQuerySchema,
  dietLogSchema,
  dietPlanSchema
} from '../validators/diet.js';

const router = Router();

router.use(requireAuth);
router.get('/plan', getPlanHandler);
router.post('/plan', validate(dietPlanSchema), createPlanHandler);
router.put('/plan', validate(dietPlanSchema), upsertPlanHandler);
router.get('/log', validate(dietDateQuerySchema, 'query'), getLogHandler);
router.put('/log', validate(dietDateQuerySchema, 'query'), validate(dietLogSchema), saveLogHandler);
router.get('/analytics', validate(dietAnalyticsQuerySchema, 'query'), analyticsHandler);

export default router;

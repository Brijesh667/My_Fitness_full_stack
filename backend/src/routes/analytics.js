import { Router } from 'express';
import { heatmapHandler, summaryHandler } from '../controllers/analyticsController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { heatmapQuerySchema, summaryQuerySchema } from '../validators/analytics.js';

const router = Router();

router.use(requireAuth);
router.get('/summary', validate(summaryQuerySchema, 'query'), summaryHandler);
router.get('/heatmap', validate(heatmapQuerySchema, 'query'), heatmapHandler);

export default router;

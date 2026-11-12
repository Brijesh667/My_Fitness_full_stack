import { Router } from 'express';
import { generateHandler, usageHandler } from '../controllers/assistantController.js';
import { requireAuth } from '../middleware/auth.js';
import { assistantDailyLimiter } from '../middleware/persistentRateLimit.js';
import { validate } from '../middleware/validate.js';
import { assistantRequestSchema } from '../validators/assistant.js';

const router = Router();

router.use(requireAuth);
router.get('/usage', usageHandler);
router.post('/generate', validate(assistantRequestSchema), assistantDailyLimiter, generateHandler);

export default router;

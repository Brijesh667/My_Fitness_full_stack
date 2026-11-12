import { Router } from 'express';
import { loginHandler, logoutHandler, meHandler, signupHandler } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { loginAttemptLimiter, signupIpLimiter } from '../middleware/persistentRateLimit.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, signupSchema } from '../validators/auth.js';

const router = Router();

router.post('/signup', validate(signupSchema), signupIpLimiter, signupHandler);
router.post('/login', validate(loginSchema), loginAttemptLimiter, loginHandler);
router.post('/logout', logoutHandler);
router.get('/me', requireAuth, meHandler);

export default router;

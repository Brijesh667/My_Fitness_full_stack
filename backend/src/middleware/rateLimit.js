import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

// Per-instance best effort only. Serverless instances do not share memory, so
// durable limits (login, signup, assistant) use the MongoDB store instead.
const handler = (req, res) => {
  res.status(429).json({
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' }
  });
};

export const globalLimiter = rateLimit({
  windowMs: env.GLOBAL_WINDOW_MINUTES * 60 * 1000,
  limit: env.GLOBAL_IP_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  handler
});

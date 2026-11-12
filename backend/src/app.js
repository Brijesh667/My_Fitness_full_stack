import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import profileRouter from './routes/profile.js';
import exercisesRouter from './routes/exercises.js';
import planRouter from './routes/plan.js';
import sessionsRouter from './routes/sessions.js';
import analyticsRouter from './routes/analytics.js';
import dietRouter from './routes/diet.js';
import assistantRouter from './routes/assistant.js';
import debugRouter from './routes/debug.js';
import { uploadsDir } from './config/cloudinary.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', env.TRUST_PROXY_HOPS);
  app.disable('x-powered-by');

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || origin === env.CLIENT_URL) return callback(null, true);
        return callback(null, false);
      },
      credentials: true
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(globalLimiter);

  if (env.NODE_ENV !== 'test') {
    app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/health' } }));
  }

  app.use('/api/health', healthRouter);
  if (env.ENABLE_IP_DEBUG) app.use('/api/debug', debugRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/profile', profileRouter);
  app.use('/api/exercises', exercisesRouter);
  app.use('/api/plan', planRouter);
  app.use('/api/sessions', sessionsRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/diet/assistant', assistantRouter);
  app.use('/api/diet', dietRouter);

  if (env.NODE_ENV !== 'production') {
    app.use('/uploads', express.static(uploadsDir, { fallthrough: true, maxAge: '1h' }));
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();

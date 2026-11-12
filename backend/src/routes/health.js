import { Router } from 'express';
import mongoose from 'mongoose';
import { getDatabaseState } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const state = getDatabaseState();
    let databaseOk = false;
    let latencyMs = null;

    if (state === 'connected') {
      const started = Date.now();
      try {
        await mongoose.connection.db.admin().ping();
        databaseOk = true;
        latencyMs = Date.now() - started;
      } catch {
        databaseOk = false;
      }
    }

    res.status(databaseOk ? 200 : 503).json({
      success: databaseOk,
      data: {
        status: databaseOk ? 'ok' : 'degraded',
        uptime: Math.round(process.uptime()),
        env: process.env.NODE_ENV ?? 'development',
        database: databaseOk ? 'connected' : state,
        dbPingMs: latencyMs
      }
    });
  })
);

export default router;

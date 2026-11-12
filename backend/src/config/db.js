import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

mongoose.set('strictQuery', true);

export async function connectDatabase(uri = env.MONGODB_URI) {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000
  });
  logger.info({ database: mongoose.connection.name }, 'database connected');
  return mongoose.connection;
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  logger.info('database disconnected');
}

export function getDatabaseState() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] ?? 'unknown';
}

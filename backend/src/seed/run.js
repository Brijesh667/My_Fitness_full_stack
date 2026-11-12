import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { seedExerciseLibrary } from './exercises.js';
import { logger } from '../utils/logger.js';

async function run() {
  try {
    await connectDatabase();
    const total = await seedExerciseLibrary();
    logger.info({ total }, 'exercise library seeded');
  } catch (error) {
    logger.error({ err: error }, 'failed to seed exercises');
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
}

run();

import { z } from 'zod';
import { isValidDateKey } from '../utils/dates.js';

const dateKey = z
  .string()
  .refine(isValidDateKey, 'Use a valid date in YYYY-MM-DD format');

export const dateQuerySchema = z
  .object({
    date: dateKey.optional()
  })
  .strict();

export const startSessionSchema = z.object({ date: dateKey }).strict();

export const timerActionSchema = z
  .object({
    action: z.enum(['start', 'pause', 'resume'])
  })
  .strict();

export const updateSetSchema = z
  .object({
    completed: z.boolean({ required_error: 'Say whether the set is complete' }),
    actualReps: z.coerce
      .number()
      .int('Actual reps must be a whole number')
      .min(0, 'Actual reps cannot be negative')
      .max(1000, 'Actual reps must be at most 1000')
      .optional(),
    weightKg: z.coerce
      .number()
      .min(0, 'Weight cannot be negative')
      .max(1000, 'Weight must be at most 1000 kg')
      .refine((value) => Number.isInteger(value * 2), 'Weight must be in 0.5 kg steps')
      .optional()
  })
  .strict();

export const sessionRangeSchema = z
  .object({
    from: dateKey.optional(),
    to: dateKey.optional()
  })
  .strict();

import { z } from 'zod';
import { isValidDateKey } from '../utils/dates.js';

const dateKey = z.string().refine(isValidDateKey, 'Use a valid date in YYYY-MM-DD format');

export const summaryQuerySchema = z
  .object({
    range: z.enum(['week', 'month']).default('week'),
    date: dateKey.optional()
  })
  .strict();

export const heatmapQuerySchema = z
  .object({
    days: z.coerce.number().int().min(7).max(365).default(120)
  })
  .strict();

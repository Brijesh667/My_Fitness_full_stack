import { z } from 'zod';
import { DAY_KEYS, isValidDateKey } from '../utils/dates.js';
import { MEAL_TYPES, UNITS } from '../models/dietSubSchemas.js';

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id');
const dateKey = z.string().refine(isValidDateKey, 'Use a valid date in YYYY-MM-DD format');

const itemSchema = z
  .object({
    name: z.string().trim().min(2, 'Item name must be 2–50 characters').max(50, 'Item name must be 2–50 characters'),
    quantity: z.coerce.number().min(0.1, 'Quantity must be at least 0.1').max(10000, 'Quantity must be at most 10000'),
    unit: z.enum(UNITS),
    calories: z.coerce.number().min(0, 'Calories cannot be negative').max(5000, 'Calories must be at most 5000'),
    proteinG: z.coerce.number().min(0).max(1000),
    carbsG: z.coerce.number().min(0).max(1000),
    fatG: z.coerce.number().min(0).max(1000)
  })
  .strict();

const timeSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm')
  .or(z.literal(''))
  .optional();

const planMealSchema = z
  .object({
    _id: objectId.optional(),
    type: z.enum(MEAL_TYPES),
    time: timeSchema,
    notes: z.string().trim().max(200, 'Notes must be at most 200 characters').optional(),
    items: z
      .array(itemSchema)
      .max(15, 'A meal can have at most 15 items')
      .default([])
  })
  .strict();

const planDaySchema = z
  .object({
    day: z.enum(DAY_KEYS),
    meals: z.array(planMealSchema).max(8, 'A day can have at most 8 meals').default([])
  })
  .strict();

export const dietPlanSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be 2–40 characters').max(40, 'Name must be 2–40 characters'),
    goal: z.enum(['fat_loss', 'muscle_gain', 'maintain', 'strength']),
    dailyTargets: z
      .object({
        calories: z.coerce.number().min(800, 'Calories must be between 800 and 6000').max(6000, 'Calories must be between 800 and 6000'),
        proteinG: z.coerce.number().min(10, 'Protein must be between 10 and 500 g').max(500, 'Protein must be between 10 and 500 g'),
        carbsG: z.coerce.number().min(10, 'Carbs must be between 10 and 1000 g').max(1000, 'Carbs must be between 10 and 1000 g'),
        fatG: z.coerce.number().min(10, 'Fat must be between 10 and 400 g').max(400, 'Fat must be between 10 and 400 g')
      })
      .strict(),
    days: z
      .array(planDaySchema)
      .min(1, 'Add at least one day')
      .max(7, 'A plan has at most 7 days')
      .refine((days) => new Set(days.map((day) => day.day)).size === days.length, 'Each day can appear once'),
    source: z.enum(['manual', 'ai']).default('manual'),
    citations: z
      .array(
        z
          .object({
            source: z.string().trim().max(100),
            chunkId: z.string().trim().max(100)
          })
          .strict()
      )
      .max(10)
      .optional()
  })
  .strict();

const logMealSchema = z
  .object({
    _id: objectId.optional(),
    planMealId: objectId.nullable().optional(),
    type: z.enum(MEAL_TYPES),
    status: z.enum(['eaten', 'skipped', 'modified']).default('eaten'),
    items: z.array(itemSchema).max(15, 'A meal can have at most 15 items').default([])
  })
  .strict();

export const dietLogSchema = z
  .object({
    meals: z.array(logMealSchema).max(8, 'A day can have at most 8 meals').default([])
  })
  .strict();

export const dietDateQuerySchema = z.object({ date: dateKey.optional() }).strict();

export const dietAnalyticsQuerySchema = z
  .object({ range: z.enum(['week', 'month']).default('week') })
  .strict();

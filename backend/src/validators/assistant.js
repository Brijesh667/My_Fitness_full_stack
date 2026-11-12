import { z } from 'zod';
import { DAY_KEYS } from '../utils/dates.js';
import { MEAL_TYPES, UNITS } from '../models/dietSubSchemas.js';

const itemSchema = z
  .object({
    name: z.string().trim().min(2).max(50),
    quantity: z.coerce.number().min(0.1).max(10000),
    unit: z.enum(UNITS),
    calories: z.coerce.number().min(0).max(5000),
    proteinG: z.coerce.number().min(0).max(1000),
    carbsG: z.coerce.number().min(0).max(1000),
    fatG: z.coerce.number().min(0).max(1000)
  })
  .strict();

const time = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm')
  .optional();

const mealSchema = z
  .object({
    type: z.enum(MEAL_TYPES),
    time,
    notes: z.string().trim().max(200).optional(),
    items: z.array(itemSchema).min(1).max(15)
  })
  .strict();

const dailyTargets = z
  .object({
    calories: z.coerce.number().min(800).max(6000),
    proteinG: z.coerce.number().min(10).max(500),
    carbsG: z.coerce.number().min(10).max(1000),
    fatG: z.coerce.number().min(10).max(400)
  })
  .strict();

const citation = z
  .object({
    source: z.string().trim().max(100),
    chunkId: z.string().trim().max(100)
  })
  .strict();

const warnings = z.array(z.string().trim().max(200)).max(10).default([]);
const assumptions = z.array(z.string().trim().max(200)).max(10).default([]);

export const planResponseSchema = z
  .object({
    summary: z.string().trim().min(1).max(300),
    assumptions,
    dailyTargets,
    days: z
      .array(
        z
          .object({
            day: z.enum(DAY_KEYS),
            meals: z.array(mealSchema).min(1).max(8)
          })
          .strict()
      )
      .length(7)
      .refine(
        (days) => new Set(days.map((day) => day.day)).size === 7,
        'Each weekday must appear once'
      )
      .refine(
        (days) => DAY_KEYS.every((day) => days.some((entry) => entry.day === day)),
        'All seven weekdays are required'
      ),
    citations: z.array(citation).max(10).default([]),
    warnings,
    disclaimer: z.string().trim().max(500)
  })
  .strict();

export const mealResponseSchema = z
  .object({
    meal: mealSchema,
    assumptions,
    warnings,
    citations: z.array(citation).max(10).default([]),
    disclaimer: z.string().trim().max(500)
  })
  .strict();

export const assistantRequestSchema = z
  .object({
    mode: z.enum(['plan', 'meal']),
    goal: z.enum(['fat_loss', 'muscle_gain', 'maintain', 'strength']),
    mealsPerDay: z.coerce.number().int().min(3).max(6).default(4),
    dietPreference: z.enum(['veg', 'non_veg', 'eggetarian', 'vegan']),
    allergies: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
    cuisine: z.string().trim().max(30).optional(),
    notes: z.string().trim().max(300).optional(),
    day: z.enum(DAY_KEYS).optional(),
    mealType: z.enum(MEAL_TYPES).optional()
  })
  .strict()
  .superRefine((input, ctx) => {
    if (input.mode === 'meal' && !input.day) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['day'], message: 'Choose a day for the meal' });
    }
    if (input.mode === 'meal' && !input.mealType) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['mealType'], message: 'Choose a meal type' });
    }
  });

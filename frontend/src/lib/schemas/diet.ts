import { z } from 'zod';
import { DAY_KEYS, MEAL_TYPES, UNITS } from '@/lib/dates';

export const dietItemSchema = z.object({
  name: z.string().trim().min(2, 'Name must be 2–50 characters').max(50, 'Name must be 2–50 characters'),
  quantity: z.coerce.number().min(0.1, 'At least 0.1').max(10000, 'At most 10000'),
  unit: z.enum(UNITS),
  calories: z.coerce.number().min(0, 'Cannot be negative').max(5000, 'At most 5000'),
  proteinG: z.coerce.number().min(0).max(1000, 'At most 1000'),
  carbsG: z.coerce.number().min(0).max(1000, 'At most 1000'),
  fatG: z.coerce.number().min(0).max(1000, 'At most 1000')
});

export const dietMealSchema = z.object({
  _id: z.string().optional(),
  type: z.enum(MEAL_TYPES),
  time: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm')
    .or(z.literal(''))
    .optional(),
  notes: z.string().trim().max(200, 'Notes must be under 200 characters').optional(),
  items: z.array(dietItemSchema).max(15, 'Maximum 15 items')
});

export const dietPlanFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be 2–40 characters').max(40, 'Name must be 2–40 characters'),
  goal: z.enum(['fat_loss', 'muscle_gain', 'maintain', 'strength']),
  dailyTargets: z.object({
    calories: z.coerce.number().min(800, '800–6000').max(6000, '800–6000'),
    proteinG: z.coerce.number().min(10, '10–500 g').max(500, '10–500 g'),
    carbsG: z.coerce.number().min(10, '10–1000 g').max(1000, '10–1000 g'),
    fatG: z.coerce.number().min(10, '10–400 g').max(400, '10–400 g')
  }),
  days: z
    .array(
      z.object({
        day: z.enum(DAY_KEYS),
        meals: z.array(dietMealSchema).max(8, 'Maximum 8 meals per day')
      })
    )
    .length(7)
});

export type DietPlanFormValues = z.infer<typeof dietPlanFormSchema>;

export const assistantFormSchema = z.object({
  mode: z.enum(['plan', 'meal']),
  goal: z.enum(['fat_loss', 'muscle_gain', 'maintain', 'strength']),
  mealsPerDay: z.coerce.number().int().min(3, '3–6 meals').max(6, '3–6 meals'),
  dietPreference: z.enum(['veg', 'non_veg', 'eggetarian', 'vegan']),
  allergiesText: z.string().trim().max(300, 'Keep allergies under 300 characters').optional(),
  cuisine: z.string().trim().max(30, 'Keep cuisine under 30 characters').optional(),
  notes: z.string().trim().max(300, 'Notes must be under 300 characters').optional(),
  day: z.enum(DAY_KEYS).optional(),
  mealType: z.enum(MEAL_TYPES).optional()
});

export type AssistantFormValues = z.infer<typeof assistantFormSchema>;

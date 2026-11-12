import { z } from 'zod';
import { MUSCLES } from '../models/User.js';
import { DAY_KEYS } from '../utils/dates.js';
import { setInputSchema, linkInputSchema } from './exercise.js';

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id');

const sets = z
  .array(setInputSchema)
  .min(1, 'Add at least one set')
  .max(10, 'Maximum 10 sets')
  .optional();

const links = z.array(linkInputSchema).max(5, 'Maximum 5 links').optional();

const description = z
  .string()
  .trim()
  .max(100, 'Description must be at most 100 characters')
  .optional();

export const dayParamSchema = z.enum(DAY_KEYS);

export const setMusclesSchema = z
  .object({
    muscles: z
      .array(z.enum(MUSCLES))
      .max(4, 'Choose at most 4 muscles')
      .refine((muscles) => new Set(muscles).size === muscles.length, 'Choose each muscle once'),
    confirm: z.boolean().optional()
  })
  .strict();

const overrides = z
  .object({
    sets,
    description
  })
  .strict();

const customExercise = z
  .object({
    name: z.string().trim().min(2, 'Name must be 2–50 characters').max(50, 'Name must be 2–50 characters'),
    description,
    sets,
    links
  })
  .strict();

export const addPlanExerciseSchema = z.union([
  z
    .object({
      exerciseId: objectId,
      overrides: overrides.optional(),
      autoAddMuscle: z.boolean().optional()
    })
    .strict(),
  z
    .object({
      custom: customExercise,
      targetMuscle: z.enum(MUSCLES),
      saveToLibrary: z.boolean().optional()
    })
    .strict()
]);

export const updatePlanExerciseSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be 2–50 characters').max(50, 'Name must be 2–50 characters').optional(),
    description,
    sets,
    links
  })
  .strict();

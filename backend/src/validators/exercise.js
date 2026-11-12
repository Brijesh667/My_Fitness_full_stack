import { z } from 'zod';
import { MUSCLES } from '../models/User.js';

export const setInputSchema = z
  .object({
    name: z.string().optional(),
    tag: z.enum(['normal', 'failure']).default('normal'),
    description: z
      .string()
      .trim()
      .max(100, 'Set description must be at most 100 characters')
      .optional(),
    repetitions: z.coerce
      .number({ invalid_type_error: 'Repetitions must be a number' })
      .int('Repetitions must be a whole number')
      .min(1, 'Repetitions must be at least 1')
      .max(1000, 'Repetitions must be at most 1000')
      .default(12)
  })
  .strict();

export const linkInputSchema = z
  .object({
    label: z.string().trim().max(40, 'Label must be at most 40 characters').optional(),
    url: z
      .string()
      .trim()
      .url('Enter a valid http(s) URL')
      .max(300, 'URL must be at most 300 characters')
      .refine((value) => /^https?:\/\//i.test(value), 'Link must start with http:// or https://')
  })
  .strict();

const description = z
  .string()
  .trim()
  .max(100, 'Description must be at most 100 characters')
  .optional();

const sets = z
  .array(setInputSchema)
  .min(1, 'Add at least one set')
  .max(10, 'Maximum 10 sets')
  .optional();

const links = z
  .array(linkInputSchema)
  .max(5, 'Maximum 5 links')
  .optional();

export const createExerciseSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be 2–50 characters').max(50, 'Name must be 2–50 characters'),
    targetMuscle: z.enum(MUSCLES),
    description,
    sets,
    links
  })
  .strict();

export const updateExerciseSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be 2–50 characters').max(50, 'Name must be 2–50 characters').optional(),
    targetMuscle: z.enum(MUSCLES).optional(),
    description,
    sets,
    links
  })
  .strict();

export const listExercisesQuerySchema = z
  .object({
    search: z.string().trim().max(50).optional(),
    muscle: z.enum(MUSCLES).optional(),
    source: z.enum(['all', 'library', 'mine']).default('all'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    sort: z.enum(['name']).default('name')
  })
  .strict();

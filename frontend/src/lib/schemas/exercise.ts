import { z } from 'zod';
import { MUSCLES } from '@/lib/dates';

export const setSchema = z.object({
  tag: z.enum(['normal', 'failure']),
  description: z.string().trim().max(100, 'Keep it under 100 characters').optional(),
  repetitions: z.coerce
    .number()
    .int('Use a whole number')
    .min(1, 'At least 1 rep')
    .max(1000, 'At most 1000 reps')
});

export type SetValues = z.infer<typeof setSchema>;

export const linkSchema = z.object({
  label: z.string().trim().max(40, 'Label is too long').optional(),
  url: z
    .string()
    .trim()
    .url('Enter a valid URL')
    .max(300, 'URL is too long')
    .refine((value) => /^https?:\/\//i.test(value), 'Use http:// or https://')
});

export const exerciseFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be 2–50 characters').max(50, 'Name must be 2–50 characters'),
  targetMuscle: z.enum(MUSCLES),
  description: z.string().trim().max(100, 'Keep it under 100 characters').optional(),
  sets: z.array(setSchema).min(1, 'Add at least one set').max(10, 'Maximum 10 sets'),
  links: z.array(linkSchema).max(5, 'Maximum 5 links')
});

export type ExerciseFormValues = z.infer<typeof exerciseFormSchema>;

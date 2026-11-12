import { z } from 'zod';

const optionalNumber = (min: number, max: number, message: string, integer = false) =>
  z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
    (integer ? z.number({ invalid_type_error: message }).int(message) : z.number({ invalid_type_error: message }))
      .min(min, message)
      .max(max, message)
      .optional()
  );

export const profileFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be 2–30 characters').max(30, 'Name must be 2–30 characters'),
  age: optionalNumber(13, 100, 'Enter an age between 13 and 100', true),
  gender: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional()
  ),
  heightCm: optionalNumber(50, 260, 'Enter a height between 50 and 260 cm'),
  weightKg: optionalNumber(20, 400, 'Enter a weight between 20 and 400 kg'),
  goal: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.enum(['fat_loss', 'muscle_gain', 'maintain', 'strength']).optional()
  ),
  experience: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.enum(['beginner', 'intermediate', 'advanced']).optional()
  ),
  dietPreference: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.enum(['veg', 'non_veg', 'eggetarian', 'vegan']).optional()
  )
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

import { z } from 'zod';

const optionalNumber = (min, max, message, integer = false) => {
  let schema = z.number({ invalid_type_error: message }).min(min, message).max(max, message);
  if (integer) schema = schema.int(message);
  return schema.nullable().optional();
};

const profileShape = {
  age: optionalNumber(13, 100, 'Age must be between 13 and 100', true),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).nullable().optional(),
  heightCm: optionalNumber(50, 260, 'Height must be between 50 and 260 cm'),
  weightKg: optionalNumber(20, 400, 'Weight must be between 20 and 400 kg'),
  goal: z.enum(['fat_loss', 'muscle_gain', 'maintain', 'strength']).nullable().optional(),
  experience: z.enum(['beginner', 'intermediate', 'advanced']).nullable().optional(),
  dietPreference: z.enum(['veg', 'non_veg', 'eggetarian', 'vegan']).nullable().optional()
};

export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be 2–30 characters')
      .max(30, 'Name must be 2–30 characters')
      .optional(),
    profile: z.object(profileShape).strict().optional()
  })
  .strict();

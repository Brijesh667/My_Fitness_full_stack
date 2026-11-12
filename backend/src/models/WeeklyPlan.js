import mongoose from 'mongoose';
import { MUSCLES } from './User.js';
import { DAY_KEYS } from '../utils/dates.js';
import { defaultSets, linkSchema, normaliseSets, setSchema } from './subSchemas.js';

const planExerciseSchema = new mongoose.Schema(
  {
    sourceExerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', default: null },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    targetMuscle: { type: String, required: true, enum: MUSCLES },
    description: { type: String, trim: true, maxlength: 100 },
    sets: {
      type: [setSchema],
      default: defaultSets,
      validate: {
        validator: (sets) => sets.length >= 1 && sets.length <= 10,
        message: 'Sets must be between 1 and 10'
      }
    },
    links: {
      type: [linkSchema],
      default: [],
      validate: { validator: (links) => links.length <= 5, message: 'Maximum 5 links' }
    },
    isCustom: { type: Boolean, default: false }
  },
  { timestamps: false }
);

const muscleGroupSchema = new mongoose.Schema(
  {
    muscle: { type: String, required: true, enum: MUSCLES },
    exercises: {
      type: [planExerciseSchema],
      default: [],
      validate: { validator: (items) => items.length <= 12, message: 'Maximum 12 exercises' }
    }
  },
  { _id: false }
);

const daySchema = new mongoose.Schema(
  {
    day: { type: String, required: true, enum: DAY_KEYS },
    muscles: {
      type: [muscleGroupSchema],
      default: [],
      validate: { validator: (items) => items.length <= 4, message: 'Maximum 4 muscles per day' }
    }
  },
  { _id: false }
);

const weeklyPlanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    days: {
      type: [daySchema],
      default: () => DAY_KEYS.map((day) => ({ day, muscles: [] })),
      validate: {
        validator: (days) => days.length === 7,
        message: 'A plan needs exactly 7 days'
      }
    }
  },
  { timestamps: true }
);

weeklyPlanSchema.pre('validate', function syncSets(next) {
  for (const day of this.days ?? []) {
    for (const group of day.muscles ?? []) {
      if (Array.isArray(group.exercises) && group.exercises.length) {
        for (const exercise of group.exercises) {
          if (Array.isArray(exercise.sets) && exercise.sets.length) {
            exercise.sets = normaliseSets(exercise.sets.map((set) => set.toObject?.() ?? set));
          }
        }
      }
    }
  }
  next();
});

export const WeeklyPlan = mongoose.model('WeeklyPlan', weeklyPlanSchema);
export { planExerciseSchema, muscleGroupSchema };

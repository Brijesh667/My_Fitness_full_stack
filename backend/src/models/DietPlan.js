import mongoose from 'mongoose';
import { DAY_KEYS } from '../utils/dates.js';
import { dietItemSchema, dietTotalsSchema, MEAL_TYPES } from './dietSubSchemas.js';

const planMealSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, enum: MEAL_TYPES },
    time: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    notes: { type: String, trim: true, maxlength: 200 },
    items: {
      type: [dietItemSchema],
      default: [],
      validate: { validator: (items) => items.length <= 15, message: 'Maximum 15 items per meal' }
    }
  },
  { _id: true }
);

const planDaySchema = new mongoose.Schema(
  {
    day: { type: String, required: true, enum: DAY_KEYS },
    meals: {
      type: [planMealSchema],
      default: [],
      validate: { validator: (meals) => meals.length <= 8, message: 'Maximum 8 meals per day' }
    }
  },
  { _id: false }
);

const dietPlanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 40 },
    goal: {
      type: String,
      required: true,
      enum: ['fat_loss', 'muscle_gain', 'maintain', 'strength']
    },
    dailyTargets: {
      type: dietTotalsSchema,
      required: true,
      validate: {
        validator: (targets) =>
          targets.calories >= 800 &&
          targets.calories <= 6000 &&
          targets.proteinG >= 10 &&
          targets.proteinG <= 500 &&
          targets.carbsG >= 10 &&
          targets.carbsG <= 1000 &&
          targets.fatG >= 10 &&
          targets.fatG <= 400,
        message: 'Daily targets are outside the allowed ranges'
      }
    },
    days: {
      type: [planDaySchema],
      default: () => DAY_KEYS.map((day) => ({ day, meals: [] })),
      validate: {
        validator: (days) => days.length === 7,
        message: 'A diet plan needs exactly 7 days'
      }
    },
    source: { type: String, enum: ['manual', 'ai'], default: 'manual' },
    citations: {
      type: [
        new mongoose.Schema(
          {
            source: { type: String, trim: true, maxlength: 100 },
            chunkId: { type: String, trim: true, maxlength: 100 }
          },
          { _id: false }
        )
      ],
      default: []
    }
  },
  { timestamps: true }
);

export const DietPlan = mongoose.model('DietPlan', dietPlanSchema);

import mongoose from 'mongoose';
import { dietItemSchema, dietTotalsSchema, MEAL_TYPES } from './dietSubSchemas.js';

const logMealSchema = new mongoose.Schema(
  {
    planMealId: { type: mongoose.Schema.Types.ObjectId, default: null },
    type: { type: String, required: true, enum: MEAL_TYPES },
    status: { type: String, required: true, enum: ['eaten', 'skipped', 'modified'], default: 'eaten' },
    items: {
      type: [dietItemSchema],
      default: [],
      validate: { validator: (items) => items.length <= 15, message: 'Maximum 15 items per meal' }
    },
    totals: { type: dietTotalsSchema, default: () => ({ calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }) }
  },
  { _id: true }
);

const dietLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    meals: {
      type: [logMealSchema],
      default: [],
      validate: { validator: (meals) => meals.length <= 8, message: 'Maximum 8 meals per day' }
    },
    totals: { type: dietTotalsSchema, default: () => ({ calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }) },
    adherencePct: { type: Number, default: 0, min: 0, max: 100 }
  },
  { timestamps: true }
);

dietLogSchema.index({ user: 1, date: 1 }, { unique: true });

export const DietLog = mongoose.model('DietLog', dietLogSchema);

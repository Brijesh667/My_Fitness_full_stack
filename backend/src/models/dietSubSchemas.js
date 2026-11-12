import mongoose from 'mongoose';

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'];
export const UNITS = ['g', 'ml', 'piece', 'cup', 'tbsp', 'tsp', 'serving'];

export const dietItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    quantity: { type: Number, required: true, min: 0.1, max: 10000 },
    unit: { type: String, required: true, enum: UNITS },
    calories: { type: Number, required: true, min: 0, max: 5000, default: 0 },
    proteinG: { type: Number, required: true, min: 0, max: 1000, default: 0 },
    carbsG: { type: Number, required: true, min: 0, max: 1000, default: 0 },
    fatG: { type: Number, required: true, min: 0, max: 1000, default: 0 }
  },
  { _id: false }
);

export const dietTotalsSchema = new mongoose.Schema(
  {
    calories: { type: Number, default: 0, min: 0 },
    proteinG: { type: Number, default: 0, min: 0 },
    carbsG: { type: Number, default: 0, min: 0 },
    fatG: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

export function zeroTotals() {
  return { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
}

export function sumItems(items = []) {
  return items.reduce(
    (totals, item) => ({
      calories: totals.calories + (item.calories ?? 0),
      proteinG: totals.proteinG + (item.proteinG ?? 0),
      carbsG: totals.carbsG + (item.carbsG ?? 0),
      fatG: totals.fatG + (item.fatG ?? 0)
    }),
    zeroTotals()
  );
}

export function normaliseItem(item) {
  return {
    name: item.name.trim(),
    quantity: item.quantity,
    unit: item.unit,
    calories: item.calories,
    proteinG: item.proteinG,
    carbsG: item.carbsG,
    fatG: item.fatG
  };
}

export function roundTotals(totals) {
  return {
    calories: Math.round(totals.calories),
    proteinG: Math.round(totals.proteinG * 10) / 10,
    carbsG: Math.round(totals.carbsG * 10) / 10,
    fatG: Math.round(totals.fatG * 10) / 10
  };
}

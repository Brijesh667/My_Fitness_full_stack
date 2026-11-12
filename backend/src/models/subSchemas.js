import mongoose from 'mongoose';

export const MAX_SETS = 10;
export const MAX_LINKS = 5;

export const setSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      validate: { validator: (v) => /^Set (10|[1-9])$/.test(v), message: 'Set name is invalid' }
    },
    tag: { type: String, enum: ['normal', 'failure'], default: 'normal' },
    description: { type: String, trim: true, maxlength: 100 },
    repetitions: {
      type: Number,
      default: 12,
      min: 1,
      max: 1000,
      validate: { validator: Number.isInteger, message: 'Repetitions must be a whole number' }
    }
  },
  { _id: false }
);

export const linkSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, maxlength: 40 },
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
      validate: {
        validator: (value) => /^https?:\/\//i.test(value) && value.length <= 300,
        message: 'Link must be a valid http(s) URL'
      }
    }
  },
  { _id: false }
);

export function normaliseSets(sets = []) {
  return sets.map((set, index) => ({
    name: `Set ${index + 1}`,
    tag: set.tag ?? 'normal',
    ...(set.description ? { description: set.description.trim() } : {}),
    repetitions: set.repetitions ?? 12
  }));
}

export function defaultSets() {
  return normaliseSets([{ repetitions: 12 }, { repetitions: 12 }, { repetitions: 12 }]);
}

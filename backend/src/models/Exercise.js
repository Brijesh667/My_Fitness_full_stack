import mongoose from 'mongoose';
import { MUSCLES } from './User.js';
import { defaultSets, linkSchema, normaliseSets, setSchema } from './subSchemas.js';

const exerciseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    nameLower: { type: String, required: true, trim: true },
    targetMuscle: { type: String, required: true, enum: MUSCLES },
    description: { type: String, trim: true, maxlength: 100 },
    sets: {
      type: [setSchema],
      default: defaultSets,
      validate: [
        { validator: (sets) => sets.length >= 1, message: 'Add at least one set' },
        { validator: (sets) => sets.length <= 10, message: 'Maximum 10 sets' }
      ]
    },
    links: {
      type: [linkSchema],
      default: [],
      validate: { validator: (links) => links.length <= 5, message: 'Maximum 5 links' }
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isCustom: { type: Boolean, default: false }
  },
  { timestamps: true }
);

exerciseSchema.index({ name: 'text' });
exerciseSchema.index({ targetMuscle: 1 });
exerciseSchema.index({ owner: 1 });
exerciseSchema.index({ owner: 1, nameLower: 1 }, { unique: true });

exerciseSchema.pre('validate', function syncNames(next) {
  if (this.name) this.nameLower = this.name.trim().toLowerCase();
  if (Array.isArray(this.sets) && this.sets.length) {
    this.sets = normaliseSets(this.sets.map((set) => set.toObject?.() ?? set));
  }
  next();
});

export const Exercise = mongoose.model('Exercise', exerciseSchema);

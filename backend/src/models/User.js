import mongoose from 'mongoose';

export const MUSCLES = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'traps',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'cardio'
];

const profileSchema = new mongoose.Schema(
  {
    age: {
      type: Number,
      min: 13,
      max: 100,
      validate: { validator: Number.isInteger, message: 'Age must be a whole number' }
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say']
    },
    heightCm: { type: Number, min: 50, max: 260 },
    weightKg: { type: Number, min: 20, max: 400 },
    goal: { type: String, enum: ['fat_loss', 'muscle_gain', 'maintain', 'strength'] },
    experience: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
    dietPreference: { type: String, enum: ['veg', 'non_veg', 'eggetarian', 'vegan'] }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 30 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 100
    },
    passwordHash: { type: String, required: true, select: false },
    avatarUrl: { type: String },
    avatarPublicId: { type: String },
    profile: { type: profileSchema, default: () => ({}) }
  },
  { timestamps: true }
);

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    avatarUrl: this.avatarUrl ?? null,
    profile: this.profile?.toObject?.() ?? {},
    createdAt: this.createdAt
  };
};

export const User = mongoose.model('User', userSchema);

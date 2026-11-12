import mongoose from 'mongoose';
import { MUSCLES } from './User.js';
import { DAY_KEYS } from '../utils/dates.js';

const sessionSetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    tag: { type: String, enum: ['normal', 'failure'], default: 'normal' },
    plannedReps: { type: Number, min: 1, max: 1000, default: 12 },
    completed: { type: Boolean, default: false },
    actualReps: {
      type: Number,
      min: 0,
      max: 1000,
      validate: { validator: Number.isInteger, message: 'Actual reps must be a whole number' }
    },
    weightKg: {
      type: Number,
      min: 0,
      max: 1000,
      validate: {
        validator: (value) => value === undefined || Number.isInteger(value * 2),
        message: 'Weight must be in 0.5 kg steps'
      }
    },
    completedAt: { type: Date }
  },
  { _id: false }
);

const sessionExerciseSchema = new mongoose.Schema(
  {
    planExerciseId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'partial', 'skipped'],
      default: 'pending'
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
    sets: { type: [sessionSetSchema], default: [] }
  },
  { _id: false }
);

const sessionMuscleSchema = new mongoose.Schema(
  {
    muscle: { type: String, required: true, enum: MUSCLES },
    exercises: { type: [sessionExerciseSchema], default: [] }
  },
  { _id: false }
);

const workoutSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/
    },
    dayKey: { type: String, required: true, enum: DAY_KEYS },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress'
    },
    timerRunning: { type: Boolean, default: false },
    firstStartedAt: { type: Date },
    lastResumeAt: { type: Date },
    accumulatedMs: { type: Number, default: 0, min: 0 },
    endedAt: { type: Date },
    durationSec: { type: Number, default: 0, min: 0 },
    lastActivityAt: { type: Date, default: Date.now },
    muscles: { type: [sessionMuscleSchema], default: [] },
    plannedSets: { type: Number, default: 0, min: 0 },
    completedSets: { type: Number, default: 0, min: 0 },
    completionPct: { type: Number, default: 0, min: 0, max: 100 }
  },
  { timestamps: true }
);

workoutSessionSchema.index({ user: 1, date: 1 }, { unique: true });

export const WorkoutSession = mongoose.model('WorkoutSession', workoutSessionSchema);

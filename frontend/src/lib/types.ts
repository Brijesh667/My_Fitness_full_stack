import type { DayKey, MealType, Muscle, Unit } from './dates';

export interface Profile {
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  heightCm?: number;
  weightKg?: number;
  goal?: 'fat_loss' | 'muscle_gain' | 'maintain' | 'strength';
  experience?: 'beginner' | 'intermediate' | 'advanced';
  dietPreference?: 'veg' | 'non_veg' | 'eggetarian' | 'vegan';
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  profile: Profile;
  createdAt: string;
}

export interface SetTemplate {
  name?: string;
  tag: 'normal' | 'failure';
  description?: string;
  repetitions: number;
}

export interface ExerciseLink {
  label?: string;
  url: string;
}

export interface Exercise {
  _id: string;
  name: string;
  targetMuscle: Muscle;
  description?: string;
  sets: SetTemplate[];
  links: ExerciseLink[];
  owner: string | null;
  isCustom: boolean;
}

export interface ExerciseList {
  items: Exercise[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface PlanExercise {
  _id: string;
  sourceExerciseId: string | null;
  name: string;
  targetMuscle: Muscle;
  description?: string;
  sets: SetTemplate[];
  links: ExerciseLink[];
  isCustom: boolean;
}

export interface MuscleGroup {
  muscle: Muscle;
  exercises: PlanExercise[];
}

export interface PlanDay {
  day: DayKey;
  muscles: MuscleGroup[];
}

export interface WeeklyPlan {
  _id: string;
  user: string;
  days: PlanDay[];
}

export type ExerciseStatus = 'pending' | 'in_progress' | 'completed' | 'partial' | 'skipped';

export interface SessionSet {
  name: string;
  tag: 'normal' | 'failure';
  plannedReps: number;
  completed: boolean;
  actualReps?: number;
  weightKg?: number;
  completedAt?: string;
}

export interface SessionExercise {
  planExerciseId: string;
  name: string;
  status: ExerciseStatus;
  startedAt?: string;
  completedAt?: string;
  sets: SessionSet[];
}

export interface SessionMuscle {
  muscle: Muscle;
  exercises: SessionExercise[];
}

export type SessionStatus = 'in_progress' | 'completed' | 'abandoned';

export interface WorkoutSession {
  _id: string;
  date: string;
  dayKey: DayKey;
  status: SessionStatus;
  timerRunning: boolean;
  firstStartedAt?: string;
  lastResumeAt?: string;
  accumulatedMs: number;
  endedAt?: string;
  durationSec: number;
  lastActivityAt: string;
  muscles: SessionMuscle[];
  plannedSets: number;
  completedSets: number;
  completionPct: number;
  elapsedMs: number;
  allExercisesCompleted: boolean;
}

export interface PreviewExercise {
  planExerciseId: string;
  name: string;
  sets: { name: string; tag: 'normal' | 'failure'; plannedReps: number }[];
}

export interface Preview {
  date: string;
  day: DayKey;
  isRestDay: boolean;
  muscles: { muscle: Muscle; exercises: PreviewExercise[] }[];
  plannedSets: number;
}

export interface TodayResponse {
  session: WorkoutSession | null;
  preview: Preview | null;
}

export interface AnalyticsMuscle {
  muscle: Muscle;
  completedSets: number;
  plannedSets: number;
  skipped: number;
  pct: number;
}

export interface AnalyticsSummary {
  range: { from: string; to: string; label: string };
  consistencyPct: number;
  streak: { current: number; best: number };
  gymTimeMin: number;
  avgSessionMin: number;
  setsCompleted: number;
  setsPlanned: number;
  failureSets: number;
  muscles: AnalyticsMuscle[];
  weekdays: { day: DayKey; pct: number; plannedDays: number }[];
  trend: { weekStart: string; pct: number }[];
  insights: { key: string; text: string }[];
  volume: { exercise: string; volume: number }[];
}

export interface HeatmapResponse {
  days: number;
  from: string;
  to: string;
  heatmap: { date: string; pct: number | null }[];
}

export interface DietItem {
  name: string;
  quantity: number;
  unit: Unit;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface DietMeal {
  _id?: string;
  type: MealType;
  time?: string;
  notes?: string;
  items: DietItem[];
}

export interface DietDay {
  day: DayKey;
  meals: DietMeal[];
}

export interface DietPlan {
  _id: string;
  name: string;
  goal: 'fat_loss' | 'muscle_gain' | 'maintain' | 'strength';
  dailyTargets: { calories: number; proteinG: number; carbsG: number; fatG: number };
  days: DietDay[];
  source: 'manual' | 'ai';
  citations: { source: string; chunkId: string }[];
}

export interface DietLogMeal {
  _id?: string;
  planMealId?: string | null;
  type: MealType;
  status: 'eaten' | 'skipped' | 'modified';
  items: DietItem[];
  totals: { calories: number; proteinG: number; carbsG: number; fatG: number };
}

export interface DietLog {
  _id?: string;
  date: string;
  meals: DietLogMeal[];
  totals: { calories: number; proteinG: number; carbsG: number; fatG: number };
  adherencePct: number;
}

export interface DietLogResponse {
  log: DietLog;
  exists: boolean;
}

export interface AssistantResult {
  mode: 'plan' | 'meal';
  plan?: {
    summary: string;
    assumptions: string[];
    dailyTargets: { calories: number; proteinG: number; carbsG: number; fatG: number };
    days: DietDay[];
    citations: { source: string; chunkId: string }[];
    warnings: string[];
    disclaimer: string;
  };
  meal?: DietMeal;
  assumptions?: string[];
  warnings?: string[];
  citations?: { source: string; chunkId: string }[];
  disclaimer?: string;
  meta: { chunks: number; provider: string };
}

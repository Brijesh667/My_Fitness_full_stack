import mongoose from 'mongoose';
import { Exercise } from '../models/Exercise.js';
import { WeeklyPlan } from '../models/WeeklyPlan.js';
import { normaliseSets } from '../models/subSchemas.js';
import { DAY_KEYS } from '../utils/dates.js';
import { badRequest, conflict, notFound } from '../utils/appError.js';
import { createCustomExercise } from './exerciseService.js';

export const MAX_MUSCLES = 4;
const MAX_EXERCISES = 12;

export function emptyDays() {
  return DAY_KEYS.map((day) => ({ day, muscles: [] }));
}

export function assertDay(day) {
  if (!DAY_KEYS.includes(day)) {
    throw badRequest('Unknown day', { day: 'Choose a valid day' });
  }
  return day;
}

export async function getOrCreatePlan(user) {
  let plan = await WeeklyPlan.findOne({ user: user._id });
  if (plan) return plan;

  try {
    plan = await WeeklyPlan.create({ user: user._id, days: emptyDays() });
  } catch (error) {
    if (error.code === 11000) plan = await WeeklyPlan.findOne({ user: user._id });
    else throw error;
  }
  return plan;
}

function findDay(plan, day) {
  const entry = plan.days.find((item) => item.day === day);
  if (!entry) throw notFound('Day not found in plan');
  return entry;
}

export async function getPlan(user) {
  return getOrCreatePlan(user);
}

export async function setDayMuscles(user, day, muscles, confirm = false) {
  assertDay(day);
  const plan = await getOrCreatePlan(user);
  const entry = findDay(plan, day);

  const existing = new Map(entry.muscles.map((group) => [group.muscle, group]));
  const removed = entry.muscles.filter(
    (group) => !muscles.includes(group.muscle) && group.exercises.length > 0
  );

  if (removed.length && !confirm) {
    throw conflict(
      'CONFIRM_REQUIRED',
      'Removing a muscle with exercises needs confirmation'
    );
  }

  entry.muscles = muscles.map((muscle) => existing.get(muscle) ?? { muscle, exercises: [] });
  await plan.save();
  return plan;
}

async function findAccessibleExercise(user, exerciseId) {
  if (!mongoose.isValidObjectId(exerciseId)) throw notFound('Exercise not found');
  const exercise = await Exercise.findOne({
    _id: exerciseId,
    $or: [{ owner: null }, { owner: user._id }]
  });
  if (!exercise) throw notFound('Exercise not found');
  return exercise;
}

function cloneSetTemplate(sets) {
  return normaliseSets(sets.map((set) => set.toObject?.() ?? set));
}

function buildPlanExercise(exercise, overrides = {}) {
  return {
    sourceExerciseId: exercise._id,
    name: exercise.name,
    targetMuscle: exercise.targetMuscle,
    description: overrides.description ?? exercise.description,
    sets: overrides.sets ? normaliseSets(overrides.sets) : cloneSetTemplate(exercise.sets),
    links: (exercise.links ?? []).map((link) => link.toObject?.() ?? link),
    isCustom: Boolean(exercise.isCustom)
  };
}

function addExerciseToGroup(group, exercise) {
  if (group.exercises.length >= MAX_EXERCISES) {
    throw conflict('EXERCISE_CAP_REACHED', 'A muscle can hold at most 12 exercises');
  }
  group.exercises.push(exercise);
}

export async function addLibraryExercise(user, day, input) {
  assertDay(day);
  const plan = await getOrCreatePlan(user);
  const entry = findDay(plan, day);
  const exercise = await findAccessibleExercise(user, input.exerciseId);

  let group = entry.muscles.find((item) => item.muscle === exercise.targetMuscle);

  if (!group) {
    if (!input.autoAddMuscle) {
      throw conflict(
        'MUSCLE_NOT_IN_DAY',
        `${exercise.targetMuscle} is not part of this day. Add the muscle first.`
      );
    }
    if (entry.muscles.length >= MAX_MUSCLES) {
      throw conflict('MUSCLE_CAP_REACHED', 'A day can hold at most 4 muscles');
    }
    entry.muscles.push({ muscle: exercise.targetMuscle, exercises: [] });
    group = entry.muscles[entry.muscles.length - 1];
  }

  addExerciseToGroup(group, buildPlanExercise(exercise, input.overrides));
  await plan.save();
  return plan;
}

export async function addCustomPlanExercise(user, day, input) {
  assertDay(day);
  const plan = await getOrCreatePlan(user);
  const entry = findDay(plan, day);
  const group = entry.muscles.find((item) => item.muscle === input.targetMuscle);

  if (!group) {
    throw conflict('MUSCLE_NOT_IN_DAY', `${input.targetMuscle} is not part of this day`);
  }

  addExerciseToGroup(group, {
    sourceExerciseId: null,
    name: input.custom.name,
    targetMuscle: input.targetMuscle,
    description: input.custom.description,
    sets: normaliseSets(input.custom.sets ?? [{ repetitions: 12 }]),
    links: input.custom.links ?? [],
    isCustom: true
  });

  await plan.save();

  if (input.saveToLibrary) {
    await createCustomExercise(user, {
      name: input.custom.name,
      targetMuscle: input.targetMuscle,
      description: input.custom.description,
      sets: input.custom.sets,
      links: input.custom.links
    });
  }

  return plan;
}

function locatePlanExercise(plan, day, planExerciseId) {
  if (!mongoose.isValidObjectId(planExerciseId)) throw notFound('Plan exercise not found');
  const entry = findDay(plan, day);
  for (const group of entry.muscles) {
    const index = group.exercises.findIndex(
      (exercise) => exercise._id.toString() === planExerciseId
    );
    if (index !== -1) return { group, exercise: group.exercises[index] };
  }
  throw notFound('Plan exercise not found');
}

export async function updatePlanExercise(user, day, planExerciseId, input) {
  assertDay(day);
  const plan = await getOrCreatePlan(user);
  const { exercise } = locatePlanExercise(plan, day, planExerciseId);

  if (input.name !== undefined) exercise.name = input.name;
  if (input.description !== undefined) exercise.description = input.description || undefined;
  if (input.sets !== undefined) exercise.sets = normaliseSets(input.sets);
  if (input.links !== undefined) exercise.links = input.links;

  await plan.save();
  return plan;
}

export async function removePlanExercise(user, day, planExerciseId) {
  assertDay(day);
  const plan = await getOrCreatePlan(user);
  const { group, exercise } = locatePlanExercise(plan, day, planExerciseId);
  group.exercises.pull({ _id: exercise._id });
  await plan.save();
  return plan;
}

export function serialisePlan(plan) {
  return plan.toObject({ virtuals: false });
}

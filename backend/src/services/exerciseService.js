import mongoose from 'mongoose';
import { Exercise } from '../models/Exercise.js';
import { defaultSets, normaliseSets } from '../models/subSchemas.js';
import { forbidden, notFound } from '../utils/appError.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function listExercises(user, query) {
  const { search, muscle, source, page, limit } = query;
  // Ignore legacy documents from older schemas that lack the current fields.
  const filter = { nameLower: { $exists: true } };

  if (muscle) filter.targetMuscle = muscle;

  if (source === 'library') filter.owner = null;
  else if (source === 'mine') filter.owner = user._id;
  else filter.$or = [{ owner: null }, { owner: user._id }];

  if (search) {
    filter.name = { $regex: escapeRegex(search), $options: 'i' };
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Exercise.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    Exercise.countDocuments(filter)
  ]);

  return {
    items: items.map(stripInternals),
    page,
    limit,
    total,
    hasMore: skip + items.length < total
  };
}

export async function getExercise(user, id) {
  if (!mongoose.isValidObjectId(id)) throw notFound('Exercise not found');
  const exercise = await Exercise.findOne({
    _id: id,
    nameLower: { $exists: true },
    $or: [{ owner: null }, { owner: user._id }]
  }).lean();
  if (!exercise) throw notFound('Exercise not found');
  return stripInternals(exercise);
}

export function normaliseExerciseInput(input) {
  return {
    ...input,
    description: input.description?.trim() || undefined,
    sets: normaliseSets(input.sets?.length ? input.sets : defaultSets()),
    links: (input.links ?? []).map((link) => ({
      ...(link.label ? { label: link.label.trim() } : {}),
      url: link.url.trim()
    }))
  };
}

export async function createCustomExercise(user, input) {
  const exercise = await Exercise.create({
    ...normaliseExerciseInput(input),
    owner: user._id,
    isCustom: true
  });
  return stripInternals(exercise.toObject());
}

async function findOwnedExercise(user, id) {
  if (!mongoose.isValidObjectId(id)) throw notFound('Exercise not found');
  const exercise = await Exercise.findById(id);
  if (!exercise) throw notFound('Exercise not found');
  if (!exercise.owner || exercise.owner.toString() !== user._id.toString()) {
    throw forbidden('Only your own custom exercises can be changed');
  }
  return exercise;
}

export async function updateCustomExercise(user, id, input) {
  const exercise = await findOwnedExercise(user, id);
  const normalised = normaliseExerciseInput(input);
  for (const [key, value] of Object.entries(normalised)) {
    if (value !== undefined) exercise[key] = value;
  }
  await exercise.save();
  return stripInternals(exercise.toObject());
}

export async function deleteCustomExercise(user, id) {
  const exercise = await findOwnedExercise(user, id);
  await exercise.deleteOne();
}

export function stripInternals(exercise) {
  const copy = { ...exercise };
  delete copy.nameLower;
  delete copy.__v;
  return copy;
}

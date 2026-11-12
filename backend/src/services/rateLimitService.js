import { RateLimit } from '../models/RateLimit.js';
import { dateKeyInTimeZone, nextResetAt, secondsUntil } from '../utils/timezone.js';

const MAX_ATTEMPTS = 6;

const asDate = (value) => (value instanceof Date ? value : new Date(value));

function resultFor(doc, limit, allowed, now) {
  return {
    allowed,
    used: doc.count,
    limit,
    remaining: Math.max(0, limit - doc.count),
    resetAt: doc.expireAt,
    retryAfterSec: allowed ? 0 : secondsUntil(doc.expireAt, now)
  };
}

function deniedFor(doc, limit, now) {
  return resultFor(doc, limit, false, now);
}

/**
 * Atomic fixed-window counter. The conditional update means only `limit`
 * callers can increment from a given value; concurrent callers either observe
 * the limit or retry after a safe insert.
 */
export async function consumeLimit(key, { limit, expireAt, now = new Date() }) {
  const at = asDate(now);
  const expiresAt = asDate(expireAt);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const existing = await RateLimit.findById(key).lean();

    if (existing && existing.expireAt.getTime() <= at.getTime()) {
      await RateLimit.deleteOne({ _id: key, expireAt: existing.expireAt });
      continue;
    }

    if (existing && existing.count >= limit) {
      return deniedFor(existing, limit, at);
    }

    const updated = await RateLimit.findOneAndUpdate(
      { _id: key, count: { $lt: limit } },
      { $inc: { count: 1 } },
      { new: true }
    ).lean();

    if (updated) return resultFor(updated, limit, true, at);

    const current = await RateLimit.findById(key).lean();
    if (current && current.expireAt.getTime() > at.getTime() && current.count >= limit) {
      return deniedFor(current, limit, at);
    }

    if (!current || current.expireAt.getTime() <= at.getTime()) {
      if (current) {
        await RateLimit.deleteOne({ _id: key, expireAt: current.expireAt });
      }
      try {
        const created = await RateLimit.create({ _id: key, count: 1, expireAt: expiresAt });
        return resultFor(created, limit, true, at);
      } catch (error) {
        if (error.code !== 11000) throw error;
      }
    }
  }

  const fallback = await RateLimit.findById(key).lean();
  if (fallback && fallback.count < limit) {
    const updated = await RateLimit.findOneAndUpdate(
      { _id: key, count: { $lt: limit } },
      { $inc: { count: 1 } },
      { new: true }
    ).lean();
    if (updated) return resultFor(updated, limit, true, at);
  }

  return fallback
    ? deniedFor(fallback, limit, at)
    : deniedFor({ count: 0, expireAt: expiresAt }, limit, at);
}

export async function peekLimit(key, now = new Date()) {
  const at = asDate(now);
  const doc = await RateLimit.findById(key).lean();
  if (!doc || doc.expireAt.getTime() <= at.getTime()) return { used: 0, resetAt: null };
  return { used: doc.count, resetAt: doc.expireAt };
}

export async function resetLimit(key) {
  await RateLimit.deleteOne({ _id: key });
}

export async function refundLimit(key, now = new Date()) {
  const doc = await RateLimit.findOneAndUpdate(
    { _id: key, count: { $gt: 0 } },
    { $inc: { count: -1 } },
    { new: true }
  ).lean();
  return doc
    ? { used: doc.count, resetAt: doc.expireAt, retryAfterSec: secondsUntil(doc.expireAt, now) }
    : { used: 0, resetAt: null, retryAfterSec: 0 };
}

export function fixedWindowResetAt(now, windowSeconds) {
  return new Date(asDate(now).getTime() + windowSeconds * 1000);
}

export async function consumeWindow(key, { limit, windowSeconds, now = new Date() }) {
  const at = asDate(now);
  const result = await consumeLimit(key, {
    limit,
    expireAt: fixedWindowResetAt(at, windowSeconds),
    now: at
  });
  return result;
}

export async function consumeDaily(keyBase, { limit, now = new Date(), timeZone = 'Asia/Kolkata' }) {
  const at = asDate(now);
  const dayKey = dateKeyInTimeZone(at, timeZone);
  const resetAt = nextResetAt(at, timeZone);
  const key = `${keyBase}:${dayKey}`;
  const result = await consumeLimit(key, { limit, expireAt: resetAt, now: at });
  return {
    ...result,
    key,
    dayKey,
    resetsAt: resetAt.toISOString(),
    retryAfterSec: result.allowed ? 0 : secondsUntil(resetAt, at)
  };
}

export async function getDailyUsage(keyBase, { limit, now = new Date(), timeZone = 'Asia/Kolkata' }) {
  const at = asDate(now);
  const dayKey = dateKeyInTimeZone(at, timeZone);
  const resetAt = nextResetAt(at, timeZone);
  const key = `${keyBase}:${dayKey}`;
  const peek = await peekLimit(key, at);
  return {
    dayKey,
    key,
    limit,
    used: peek.used,
    remaining: Math.max(0, limit - peek.used),
    resetsAt: resetAt.toISOString()
  };
}

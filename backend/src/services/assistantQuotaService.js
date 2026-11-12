import { env } from '../config/env.js';
import { consumeDaily, getDailyUsage, refundLimit } from './rateLimitService.js';

const quotaBase = (userId) => `assistant:${userId}`;

export async function consumeAssistantQuota(userId, now = new Date()) {
  return consumeDaily(quotaBase(userId), {
    limit: env.ASSISTANT_DAILY_LIMIT,
    now,
    timeZone: env.APP_TIMEZONE
  });
}

export async function getAssistantUsage(userId, now = new Date()) {
  return getDailyUsage(quotaBase(userId), {
    limit: env.ASSISTANT_DAILY_LIMIT,
    now,
    timeZone: env.APP_TIMEZONE
  });
}

export async function refundAssistantQuota(key, now = new Date()) {
  if (!key) return null;
  return refundLimit(key, now);
}

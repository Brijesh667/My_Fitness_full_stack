import { env } from '../config/env.js';
import { consumeWindow, peekLimit, resetLimit } from './rateLimitService.js';
import { secondsUntil } from '../utils/timezone.js';

const normalizedEmail = (email) => String(email ?? '').trim().toLowerCase();

export function loginLimitKeys(ip, email) {
  const safeIp = String(ip ?? 'unknown');
  return {
    ip: safeIp,
    email: normalizedEmail(email),
    pairKey: `login:pair:${safeIp}:${normalizedEmail(email)}`,
    ipKey: `login:ip:${safeIp}`
  };
}

export async function checkLoginAllowed(ip, email, now = new Date()) {
  const keys = loginLimitKeys(ip, email);
  const [pair, ipState] = await Promise.all([peekLimit(keys.pairKey, now), peekLimit(keys.ipKey, now)]);
  const pairBlocked = pair.used >= env.LOGIN_PAIR_LIMIT;
  const ipBlocked = ipState.used >= env.LOGIN_IP_LIMIT;

  if (!pairBlocked && !ipBlocked) return { allowed: true, keys };

  const blockedResets = [
    pairBlocked && pair.resetAt,
    ipBlocked && ipState.resetAt
  ].filter(Boolean);
  const resetAt = blockedResets.sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

  return {
    allowed: false,
    keys,
    retryAfterSec: resetAt ? secondsUntil(resetAt, now) : env.LOGIN_WINDOW_MINUTES * 60
  };
}

export async function recordLoginFailure(ip, email, now = new Date()) {
  const keys = loginLimitKeys(ip, email);
  const windowSeconds = env.LOGIN_WINDOW_MINUTES * 60;

  await Promise.all([
    consumeWindow(keys.pairKey, {
      limit: env.LOGIN_PAIR_LIMIT,
      windowSeconds,
      now
    }),
    consumeWindow(keys.ipKey, {
      limit: env.LOGIN_IP_LIMIT,
      windowSeconds,
      now
    })
  ]);
}

export async function resetLoginPair(ip, email) {
  const keys = loginLimitKeys(ip, email);
  await resetLimit(keys.pairKey);
}

import { env } from '../config/env.js';
import { consumeWindow } from '../services/rateLimitService.js';
import { consumeAssistantQuota } from '../services/assistantQuotaService.js';
import { checkLoginAllowed } from '../services/loginRateLimitService.js';

function rateLimited(res, retryAfterSec, message) {
  const seconds = Math.max(1, Math.ceil(Number(retryAfterSec) || 1));
  res.set('Retry-After', String(seconds));
  return res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message,
      retryAfterSec: seconds
    }
  });
}

export function signupIpLimiter(req, res, next) {
  const ip = req.ip ?? 'unknown';
  consumeWindow(`signup:ip:${ip}`, {
    limit: env.SIGNUP_IP_LIMIT,
    windowSeconds: env.SIGNUP_WINDOW_MINUTES * 60
  })
    .then((result) => {
      if (!result.allowed) {
        return rateLimited(
          res,
          result.retryAfterSec,
          'Too many signup attempts from this network. Please try again later.'
        );
      }
      return next();
    })
    .catch(next);
}

export function loginAttemptLimiter(req, res, next) {
  const ip = req.ip ?? 'unknown';
  checkLoginAllowed(ip, req.body.email)
    .then((result) => {
      if (!result.allowed) {
        return rateLimited(
          res,
          result.retryAfterSec,
          'Too many failed login attempts. Please try again later.'
        );
      }
      req.loginLimitKeys = result.keys;
      return next();
    })
    .catch(next);
}

export function assistantDailyLimiter(req, res, next) {
  consumeAssistantQuota(req.user.id)
    .then((quota) => {
      if (!quota.allowed) {
        return rateLimited(
          res,
          quota.retryAfterSec,
          'Your daily diet assistant limit has been reached. Please try again after midnight.'
        );
      }
      req.assistantQuota = quota;
      return next();
    })
    .catch(next);
}

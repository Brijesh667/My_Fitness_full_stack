import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { unauthorized } from '../utils/appError.js';

function extractToken(req) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7).trim();
  return req.cookies?.token ?? null;
}

export async function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return next(unauthorized());

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return next(unauthorized());
    req.user = user;
    return next();
  } catch {
    return next(unauthorized('Your session has expired. Please sign in again.'));
  }
}

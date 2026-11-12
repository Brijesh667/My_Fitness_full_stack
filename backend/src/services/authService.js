import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { AppError, conflict } from '../utils/appError.js';

const BCRYPT_COST = 10;
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function signToken(user) {
  return jwt.sign({ sub: user._id.toString() }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE,
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/'
  };
}

export async function signup({ name, email, password }) {
  const existing = await User.findOne({ email });
  if (existing) throw conflict('EMAIL_TAKEN', 'An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const user = await User.create({ name, email, passwordHash });
  return user;
}

export const invalidCredentials = () =>
  new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');

export async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) throw invalidCredentials();

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) throw invalidCredentials();
  return user;
}

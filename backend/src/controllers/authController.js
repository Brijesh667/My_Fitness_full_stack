import { login, signup, signToken, cookieOptions } from '../services/authService.js';
import { recordLoginFailure, resetLoginPair } from '../services/loginRateLimitService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const signupHandler = asyncHandler(async (req, res) => {
  const user = await signup(req.body);
  res.cookie('token', signToken(user), cookieOptions());
  res.status(201).json({ success: true, data: { user: user.toPublicJSON() } });
});

export const loginHandler = asyncHandler(async (req, res) => {
  try {
    const user = await login(req.body);
    if (req.loginLimitKeys) {
      await resetLoginPair(req.loginLimitKeys.ip, req.loginLimitKeys.email).catch(() => {});
    }
    res.cookie('token', signToken(user), cookieOptions());
    res.json({ success: true, data: { user: user.toPublicJSON() } });
  } catch (error) {
    if (error.code === 'INVALID_CREDENTIALS' && req.loginLimitKeys) {
      await recordLoginFailure(req.loginLimitKeys.ip, req.loginLimitKeys.email).catch(() => {});
    }
    throw error;
  }
});

export function logoutHandler(req, res) {
  res.clearCookie('token', { ...cookieOptions(), maxAge: undefined });
  res.json({ success: true, data: { loggedOut: true } });
}

export function meHandler(req, res) {
  res.json({ success: true, data: { user: req.user.toPublicJSON() } });
}

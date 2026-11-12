import { asyncHandler } from '../utils/asyncHandler.js';
import { clearAvatar, setAvatar, updateProfile } from '../services/profileService.js';

export function getProfile(req, res) {
  res.json({ success: true, data: { user: req.user.toPublicJSON() } });
}

export const patchProfile = asyncHandler(async (req, res) => {
  const user = await updateProfile(req.user, req.body);
  res.json({ success: true, data: { user: user.toPublicJSON() } });
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  const user = await setAvatar(req.user, req.file);
  res.json({ success: true, data: { user: user.toPublicJSON(), avatarUrl: user.avatarUrl } });
});

export const deleteAvatar = asyncHandler(async (req, res) => {
  const user = await clearAvatar(req.user);
  res.json({ success: true, data: { user: user.toPublicJSON() } });
});

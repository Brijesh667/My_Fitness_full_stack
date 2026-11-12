import { removeAvatar, storeAvatar } from '../config/cloudinary.js';
import { badRequest } from '../utils/appError.js';

function cleanProfile(profile) {
  const cleaned = {};
  for (const [key, value] of Object.entries(profile ?? {})) {
    if (value === null || value === undefined || value === '') continue;
    cleaned[key] = value;
  }
  return cleaned;
}

export async function updateProfile(user, input) {
  if (input.name !== undefined) user.name = input.name;

  if (input.profile !== undefined) {
    user.profile = cleanProfile({ ...(user.profile?.toObject?.() ?? user.profile), ...input.profile });
  }

  await user.save();
  return user;
}

export async function setAvatar(user, file) {
  if (!file) throw badRequest('Choose an image to upload');

  const previousPublicId = user.avatarPublicId;
  const { url, publicId } = await storeAvatar(file.buffer, file.mimetype);
  user.avatarUrl = url;
  user.avatarPublicId = publicId;
  await user.save();

  if (previousPublicId) {
    await removeAvatar(previousPublicId).catch(() => {});
  }

  return user;
}

export async function clearAvatar(user) {
  const publicId = user.avatarPublicId;
  user.avatarUrl = undefined;
  user.avatarPublicId = undefined;
  await user.save();
  if (publicId) await removeAvatar(publicId).catch(() => {});
  return user;
}

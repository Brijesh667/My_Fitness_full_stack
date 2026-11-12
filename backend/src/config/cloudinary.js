import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

export const uploadsDir = path.resolve(process.cwd(), 'uploads');

const MOCK_PREFIX = 'mock:';
const EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

if (!env.CLOUDINARY_MOCK) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET
  });
}

async function uploadToCloudinary(buffer, mimetype) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: env.CLOUDINARY_UPLOAD_FOLDER, resource_type: 'image' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer, mimetype);
  });
}

export async function storeAvatar(buffer, mimetype) {
  if (env.CLOUDINARY_MOCK) {
    await fs.mkdir(uploadsDir, { recursive: true });
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${EXTENSIONS[mimetype] ?? '.bin'}`;
    await fs.writeFile(path.join(uploadsDir, filename), buffer);
    return { url: `/uploads/${filename}`, publicId: `${MOCK_PREFIX}${filename}` };
  }

  const result = await uploadToCloudinary(buffer, mimetype);
  return { url: result.secure_url, publicId: result.public_id };
}

export async function removeAvatar(publicId) {
  if (!publicId) return;

  if (env.CLOUDINARY_MOCK || publicId.startsWith(MOCK_PREFIX)) {
    const filename = publicId.slice(MOCK_PREFIX.length);
    await fs.rm(path.join(uploadsDir, path.basename(filename)), { force: true });
    return;
  }

  await cloudinary.uploader.destroy(publicId);
}

export function cloudinaryEnabled() {
  return !env.CLOUDINARY_MOCK;
}

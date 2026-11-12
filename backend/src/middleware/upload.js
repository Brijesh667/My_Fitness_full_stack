import multer from 'multer';
import { AppError } from '../utils/appError.js';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter(req, file, cb) {
    if (!ALLOWED.has(file.mimetype)) {
      return cb(new AppError(400, 'INVALID_FILE', 'Avatar must be a JPG, PNG or WebP image'));
    }
    return cb(null, true);
  }
});

export const avatarUpload = upload.single('avatar');

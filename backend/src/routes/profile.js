import { Router } from 'express';
import {
  deleteAvatar,
  getProfile,
  patchProfile,
  uploadAvatar
} from '../controllers/profileController.js';
import { requireAuth } from '../middleware/auth.js';
import { avatarUpload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema } from '../validators/profile.js';

const router = Router();

router.use(requireAuth);
router.get('/', getProfile);
router.patch('/', validate(updateProfileSchema), patchProfile);
router.post('/avatar', avatarUpload, uploadAvatar);
router.delete('/avatar', deleteAvatar);

export default router;

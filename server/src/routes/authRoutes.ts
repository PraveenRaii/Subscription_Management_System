import { Router } from 'express';
import {
  register,
  verifyOtp,
  resendOtp,
  login,
  googleLogin,
  forgotPassword,
  resetPassword,
  getMe,
  registerStaff,
  updateProfile,
  uploadAvatar,
  changePassword,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/roleCheck.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/resend-otp', authLimiter, resendOtp);
router.post('/login', authLimiter, login);
router.post('/google', googleLogin);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.post('/upload-avatar', authenticate, uploadAvatar);
router.put('/change-password', authenticate, changePassword);
router.post('/staff', authenticate, authorize('super_admin'), registerStaff);

export default router;

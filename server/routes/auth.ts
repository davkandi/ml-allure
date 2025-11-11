import { Router } from 'express';
import {
  register,
  login,
  getMe,
  refreshToken,
  changePassword,
  guestCheckout,
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  guestCheckoutSchema,
} from '../schemas/authSchemas';

const router = Router();

// Public routes
router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/refresh', validateRequest(refreshTokenSchema), refreshToken);
router.post('/guest-checkout', validateRequest(guestCheckoutSchema), guestCheckout);

// Protected routes
router.get('/me', authenticateToken, getMe);
router.post('/change-password', authenticateToken, validateRequest(changePasswordSchema), changePassword);

export default router;

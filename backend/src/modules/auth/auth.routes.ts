import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authRateLimiter } from '../../middleware/rate-limiter.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.schemas.js';

export const authRouter = Router();

authRouter.post(
  '/register',
  authRateLimiter,
  validateRequest({ body: registerSchema }),
  authController.register,
);

authRouter.post(
  '/login',
  authRateLimiter,
  validateRequest({ body: loginSchema }),
  authController.login,
);

authRouter.post('/logout', authController.logout);

authRouter.post(
  '/refresh',
  validateRequest({ body: refreshTokenSchema }),
  authController.refreshToken,
);

authRouter.get('/me', authenticate, authController.getMe);

authRouter.post(
  '/change-password',
  authenticate,
  validateRequest({ body: changePasswordSchema }),
  authController.changePassword,
);

authRouter.post(
  '/forgot-password',
  authRateLimiter,
  validateRequest({ body: forgotPasswordSchema }),
  authController.forgotPassword,
);

authRouter.post(
  '/reset-password',
  authRateLimiter,
  validateRequest({ body: resetPasswordSchema }),
  authController.resetPassword,
);

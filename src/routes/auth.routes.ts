import { Router } from 'express';
import passport from 'passport';
import {
  changePassword,
  forgotPassword,
  handleGoogleCallback,
  getCurrentUser,
  login,
  logout,
  refreshToken,
  register,
  resetPassword,
  setPassword,
  verifyEmail,
} from '../controllers/auth.controller.ts';
import { requireAuth } from '../middleware/auth.middleware.ts';
import { authRateLimits } from '../middleware/rate-limit.middleware.ts';
import {
  requireFields,
  validateEmailField,
  validateRefreshTokenField,
  validateTokenField,
} from '../middleware/validation.middleware.ts';

const router = Router();

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  }),
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/auth/failure',
  }),
  handleGoogleCallback as any,
);

router.post(
  '/register',
  authRateLimits.registerByIp as any,
  requireFields(['email', 'password', 'name']) as any,
  validateEmailField as any,
  register as any,
);
router.post(
  '/verify-email',
  requireFields(['token']) as any,
  validateTokenField('token') as any,
  verifyEmail as any,
);
router.post(
  '/login',
  authRateLimits.loginByIpAndEmail as any,
  requireFields(['email', 'password']) as any,
  validateEmailField as any,
  login as any,
);
router.post(
  '/refresh',
  authRateLimits.refreshByIp as any,
  validateRefreshTokenField as any,
  refreshToken as any,
);

router.post(
  '/forgot-password',
  authRateLimits.forgotPasswordByIpAndEmail as any,
  requireFields(['email']) as any,
  validateEmailField as any,
  forgotPassword as any,
);
router.post(
  '/reset-password',
  requireFields(['token', 'newPassword']) as any,
  validateTokenField('token') as any,
  resetPassword as any,
);

router.post(
  '/set-password',
  requireAuth as any,
  requireFields(['newPassword']) as any,
  setPassword as any,
);
router.post(
  '/change-password',
  requireAuth as any,
  requireFields(['currentPassword', 'newPassword']) as any,
  changePassword as any,
);

router.get('/me', requireAuth as any, getCurrentUser as any);

router.post('/logout', requireAuth as any, logout as any);

router.get('/failure', (req, res) => {
  res.status(401).json({ error: 'Authentication failed' });
});

export default router;

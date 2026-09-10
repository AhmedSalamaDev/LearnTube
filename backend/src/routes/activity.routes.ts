import { Router } from 'express';
import {
  logActivityHandler,
  updateProgressHandler,
  getProgressHandler,
  getCourseProgressHandler,
  getHeatmapHandler,
  getDashboardHandler,
  getDayActivity,
} from '../controllers/activity.controller.ts';
import { requireVerifiedEmail } from '../middleware/auth.middleware.ts';

const router = Router();

router.post('/log', requireVerifiedEmail as any, logActivityHandler as any);

router.patch(
  '/progress/:videoId',
  requireVerifiedEmail as any,
  updateProgressHandler as any,
);

router.get(
  '/progress/:videoId',
  requireVerifiedEmail as any,
  getProgressHandler as any,
);

router.get(
  '/course-progress/:courseId',
  requireVerifiedEmail as any,
  getCourseProgressHandler as any,
);

router.get('/day-activity', requireVerifiedEmail as any, getDayActivity as any);

router.get('/heatmap', requireVerifiedEmail as any, getHeatmapHandler as any);

router.get(
  '/dashboard',
  requireVerifiedEmail as any,
  getDashboardHandler as any,
);

export default router;

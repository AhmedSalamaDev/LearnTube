import { Router } from 'express';
import {
  createCourse,
  listCourses,
  getCourse,
  removeCourse,
  searchCourses,
  syncCourse,
} from '../controllers/course.controller.ts';
import { requireVerifiedEmail } from '../middleware/auth.middleware.ts';

const router = Router();

// search must be before /:id so it doesn't match as an ID
router.get('/search', requireVerifiedEmail as any, searchCourses as any);

router.post('/', requireVerifiedEmail as any, createCourse as any);
router.get('/', requireVerifiedEmail as any, listCourses as any);
router.get('/:id', requireVerifiedEmail as any, getCourse as any);
router.delete('/:id', requireVerifiedEmail as any, removeCourse as any);

router.post('/:id/sync', requireVerifiedEmail as any, syncCourse as any);

export default router;

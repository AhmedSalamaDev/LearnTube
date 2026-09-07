import { Router } from 'express';
import {
  createCourse,
  listCourses,
  getCourse,
  removeCourse,
  searchCourses,
  syncCourse,
} from '../controllers/course.controller.ts';
import { requireAuth } from '../middleware/auth.middleware.ts';

const router = Router();

// search must be before /:id so it doesn't match as an ID
router.get('/search', requireAuth as any, searchCourses as any);

router.post('/', requireAuth as any, createCourse as any);
router.get('/', requireAuth as any, listCourses as any);
router.get('/:id', requireAuth as any, getCourse as any);
router.delete('/:id', requireAuth as any, removeCourse as any);

router.post('/:id/sync', requireAuth as any, syncCourse as any);

export default router;

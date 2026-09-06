import { Router } from "express";
import {
  logActivityHandler,
  updateProgressHandler,
  getProgressHandler,
  getCourseProgressHandler,
  getHeatmapHandler,
  getDashboardHandler,
  getDayActivity,
} from "../controllers/activity.controller.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";

const router = Router();

router.post("/log", requireAuth as any, logActivityHandler as any);

router.patch(
  "/progress/:videoId",
  requireAuth as any,
  updateProgressHandler as any
);

router.get("/progress/:videoId", requireAuth as any, getProgressHandler as any);

router.get(
  "/course-progress/:courseId",
  requireAuth as any,
  getCourseProgressHandler as any
);

router.get("/day-activity", requireAuth as any, getDayActivity as any);

router.get("/heatmap", requireAuth as any, getHeatmapHandler as any);

router.get("/dashboard", requireAuth as any, getDashboardHandler as any);

export default router;

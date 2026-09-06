import { Router } from "express";
import {
  createCourse,
  listCourses,
  getCourse,
  removeCourse,
} from "../controllers/course.controller.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";

const router = Router();

router.post("/", requireAuth as any, createCourse as any);

router.get("/", requireAuth as any, listCourses as any);

router.get("/:id", requireAuth as any, getCourse as any);

router.delete("/:id", requireAuth as any, removeCourse as any);

export default router;

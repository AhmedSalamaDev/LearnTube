import type { Response } from "express";
import type { RequestWithUser } from "../utils/types.ts";
import {
  createCourseFromUrl,
  getUserCourses,
  getCourseWithVideos,
  deleteCourse,
} from "../services/course.service.ts";

export async function createCourse(
  req: RequestWithUser,
  res: Response
): Promise<void> {
  try {
    const { youtubeUrl } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    if (!youtubeUrl) {
      res.status(400).json({ error: "youtubeUrl is required" });
      return;
    }

    const result = await createCourseFromUrl(userId, youtubeUrl);

    res.status(201).json({
      message: "Course created successfully",
      course: result.course,
      videosCount: result.videos.length,
    });
  } catch (error) {
    console.error("Create course error:", error);

    if (error instanceof Error) {
      // Check for PostgreSQL unique constraint violation
      if (
        (error as any).code === "23505" || // PostgreSQL unique violation
        error.message.includes("duplicate key") ||
        error.message.includes("already added")
      ) {
        res.status(409).json({
          error: "Course already exists",
          message: "You have already added this video/playlist to your courses",
        });
        return;
      }

      if (error.message.includes("Invalid YouTube URL")) {
        res.status(400).json({
          error: "Invalid URL",
          message: error.message,
        });
        return;
      }
    }

    res.status(500).json({
      error: "Failed to create course",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function listCourses(
  req: RequestWithUser,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const courses = await getUserCourses(userId);

    res.json({ courses });
  } catch (error) {
    console.error("List courses error:", error);
    res.status(500).json({
      error: "Failed to fetch courses",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function getCourse(
  req: RequestWithUser,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    if (!id) {
      res.status(400).json({ error: "Course ID is required" });
      return;
    }

    const course = await getCourseWithVideos(id, userId);

    res.json({ course });
  } catch (error) {
    console.error("Get course error:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      res.status(403).json({ error: "Unauthorized" });
      return;
    }

    if (error instanceof Error && error.message === "Course not found") {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    res.status(500).json({
      error: "Failed to fetch course",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function removeCourse(
  req: RequestWithUser,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    if (!id) {
      res.status(400).json({ error: "Course ID is required" });
      return;
    }

    await deleteCourse(id, userId);

    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Delete course error:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      res.status(403).json({ error: "Unauthorized" });
      return;
    }

    if (error instanceof Error && error.message === "Course not found") {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    res.status(500).json({
      error: "Failed to delete course",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

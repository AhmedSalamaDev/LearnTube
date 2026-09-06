import type { Response } from "express";
import type { RequestWithUser } from "../utils/types.ts";
import {
  logActivity,
  updateVideoProgress,
  getVideoProgress,
  getCourseProgressData,
  getHeatmapData,
  getDashboardStats,
  getDayActivityData,
} from "../services/activity.service.ts";

export async function logActivityHandler(
  req: RequestWithUser,
  res: Response
): Promise<void> {
  try {
    const { videoId, watchedSecondsChunk } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    if (!videoId || watchedSecondsChunk === undefined) {
      res
        .status(400)
        .json({ error: "videoId and watchedSecondsChunk are required" });
      return;
    }

    await logActivity(userId, videoId, watchedSecondsChunk);

    res.json({ success: true });
  } catch (error) {
    console.error("Log activity error:", error);
    res.status(500).json({
      error: "Failed to log activity",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function updateProgressHandler(
  req: RequestWithUser,
  res: Response
): Promise<void> {
  try {
    const { videoId } = req.params;
    const { checkpointSeconds, isCompleted } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    if (!videoId) {
      res.status(400).json({ error: "videoId is required" });
      return;
    }

    if (checkpointSeconds === undefined || isCompleted === undefined) {
      res
        .status(400)
        .json({ error: "checkpointSeconds and isCompleted are required" });
      return;
    }

    await updateVideoProgress(userId, videoId, checkpointSeconds, isCompleted);

    res.json({ success: true });
  } catch (error) {
    console.error("Update progress error:", error);
    res.status(500).json({
      error: "Failed to update progress",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function getProgressHandler(
  req: RequestWithUser,
  res: Response
): Promise<void> {
  try {
    const { videoId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    if (!videoId) {
      res.status(400).json({ error: "videoId is required" });
      return;
    }

    const progress = await getVideoProgress(userId, videoId);

    res.json({ progress });
  } catch (error) {
    console.error("Get progress error:", error);
    res.status(500).json({
      error: "Failed to get progress",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function getCourseProgressHandler(
  req: RequestWithUser,
  res: Response
): Promise<void> {
  try {
    const { courseId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    if (!courseId) {
      res.status(400).json({ error: "courseId is required" });
      return;
    }

    const data = await getCourseProgressData(userId, courseId);

    res.json(data);
  } catch (error) {
    console.error("Get course progress error:", error);
    res.status(500).json({
      error: "Failed to get course progress",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function getDayActivity(
  req: RequestWithUser,
  res: Response
): Promise<void> {
  try {
    const { date } = req.query; // YYYY-MM-DD format
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    let dayDate: string;

    if (date && typeof date === "string") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        res.status(400).json({
          error: "Invalid date format. Use YYYY-MM-DD",
        });
        return;
      }
      dayDate = date;
    } else {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      dayDate = `${year}-${month}-${day}`;
    }

    const data = await getDayActivityData(userId, dayDate);

    res.json({
      date: dayDate,
      totalSeconds: data.totalSeconds,
      videosWatched: data.videosWatched,
      activities: data.activities,
    });
  } catch (error) {
    console.error("Get day activity error:", error);
    res.status(500).json({
      error: "Failed to get day activity data",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function getHeatmapHandler(
  req: RequestWithUser,
  res: Response
): Promise<void> {
  try {
    const { year } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const yearNum = year ? parseInt(year as string) : new Date().getFullYear();

    const data = await getHeatmapData(userId, yearNum);

    res.json({ year: yearNum, data });
  } catch (error) {
    console.error("Get heatmap error:", error);
    res.status(500).json({
      error: "Failed to get heatmap data",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function getDashboardHandler(
  req: RequestWithUser,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const stats = await getDashboardStats(userId);

    res.json(stats);
  } catch (error) {
    console.error("Get dashboard error:", error);
    res.status(500).json({
      error: "Failed to get dashboard stats",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

import { db } from "../db/index.ts";
import {
  userActivity,
  progress,
  dailyActivity,
  courseProgress,
  videos,
  courses,
} from "../db/schema.ts";
import { eq, and, sql } from "drizzle-orm";

export async function logActivity(
  userId: string,
  videoId: string,
  watchedSecondsChunk: number
) {
  const today = new Date().toISOString().split("T")[0] as string;

  const [video] = await db.select().from(videos).where(eq(videos.id, videoId));

  if (!video) {
    throw new Error("Video not found");
  }

  await db.transaction(async (tx) => {
    await tx.insert(userActivity).values({
      userId,
      videoId,
      watchedSeconds: watchedSecondsChunk,
    });

    const existingDaily = await tx
      .select()
      .from(dailyActivity)
      .where(
        and(
          eq(dailyActivity.userId, userId),
          sql`${dailyActivity.date} = ${today}`
        )
      );

    if (existingDaily.length > 0) {
      await tx
        .update(dailyActivity)
        .set({
          totalSeconds: sql`${dailyActivity.totalSeconds} + ${watchedSecondsChunk}`,
        })
        .where(
          and(
            eq(dailyActivity.userId, userId),
            sql`${dailyActivity.date} = ${today}`
          )
        );
    } else {
      await tx.insert(dailyActivity).values({
        userId,
        date: today,
        totalSeconds: watchedSecondsChunk,
      });
    }

    const existingCourseProgress = await tx
      .select()
      .from(courseProgress)
      .where(
        and(
          eq(courseProgress.userId, userId),
          eq(courseProgress.coursesId, video.coursesId)
        )
      );

    if (existingCourseProgress.length > 0) {
      await tx
        .update(courseProgress)
        .set({
          totalWatchedSeconds: sql`${courseProgress.totalWatchedSeconds} + ${watchedSecondsChunk}`,
        })
        .where(
          and(
            eq(courseProgress.userId, userId),
            eq(courseProgress.coursesId, video.coursesId)
          )
        );
    } else {
      await tx.insert(courseProgress).values({
        userId,
        coursesId: video.coursesId,
        totalWatchedSeconds: watchedSecondsChunk,
        completedVideos: 0,
      });
    }

    // Update video progress - increment totalWatchedSeconds
    const existingProgress = await tx
      .select()
      .from(progress)
      .where(and(eq(progress.userId, userId), eq(progress.videoId, videoId)));

    if (existingProgress.length > 0) {
      await tx
        .update(progress)
        .set({
          totalWatchedSeconds: sql`${progress.totalWatchedSeconds} + ${watchedSecondsChunk}`,
          lastWatchedAt: new Date(),
        })
        .where(and(eq(progress.userId, userId), eq(progress.videoId, videoId)));
    } else {
      await tx.insert(progress).values({
        userId,
        videoId,
        checkpointSeconds: 0,
        totalWatchedSeconds: watchedSecondsChunk,
        completed: false,
        lastWatchedAt: new Date(),
      });
    }
  });

  return { success: true };
}

export async function updateVideoProgress(
  userId: string,
  videoId: string,
  checkpointSeconds: number,
  isCompleted: boolean
) {
  const [video] = await db.select().from(videos).where(eq(videos.id, videoId));

  if (!video) {
    throw new Error("Video not found");
  }

  const [existing] = await db
    .select()
    .from(progress)
    .where(and(eq(progress.userId, userId), eq(progress.videoId, videoId)));

  const wasCompleted = existing?.completed || false;

  await db.transaction(async (tx) => {
    await tx
      .insert(progress)
      .values({
        userId,
        videoId,
        checkpointSeconds,
        totalWatchedSeconds: 0,
        completed: isCompleted,
        lastWatchedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [progress.userId, progress.videoId],
        set: {
          checkpointSeconds,
          completed: isCompleted,
          lastWatchedAt: new Date(),
        },
      });

    if (isCompleted && !wasCompleted) {
      await tx
        .update(courseProgress)
        .set({
          completedVideos: sql`${courseProgress.completedVideos} + 1`,
        })
        .where(
          and(
            eq(courseProgress.userId, userId),
            eq(courseProgress.coursesId, video.coursesId)
          )
        );
    }
  });

  return { success: true };
}

export async function getVideoProgress(userId: string, videoId: string) {
  const [result] = await db
    .select()
    .from(progress)
    .where(and(eq(progress.userId, userId), eq(progress.videoId, videoId)));

  return result || null;
}

export async function getCourseProgressData(userId: string, courseId: string) {
  const [courseData] = await db
    .select()
    .from(courseProgress)
    .where(
      and(
        eq(courseProgress.userId, userId),
        eq(courseProgress.coursesId, courseId)
      )
    );

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId));

  const courseVideos = await db
    .select()
    .from(videos)
    .where(eq(videos.coursesId, courseId));

  const videoProgressList = await db
    .select()
    .from(progress)
    .where(
      and(
        eq(progress.userId, userId),
        sql`${progress.videoId} IN (SELECT id FROM ${videos} WHERE ${videos.coursesId} = ${courseId})`
      )
    );

  return {
    course,
    totalWatchedSeconds: courseData?.totalWatchedSeconds || 0,
    completedVideos: courseData?.completedVideos || 0,
    totalVideos: courseVideos.length,
    totalDurationSeconds: course?.totalDurationSeconds || 0,
    videoProgress: videoProgressList,
  };
}

export async function getDayActivityData(userId: string, dayDate: string) {
  const [dailyRecord] = await db
    .select()
    .from(dailyActivity)
    .where(
      and(eq(dailyActivity.userId, userId), eq(dailyActivity.date, dayDate))
    );

  // Get all activities (video watches) for that day
  const dayStart = `${dayDate} 00:00:00`;
  const dayEnd = `${dayDate} 23:59:59`;

  const activities = await db
    .select({
      id: userActivity.id,
      videoId: userActivity.videoId,
      videoTitle: videos.title,
      courseName: courses.title,
      watchedSeconds: userActivity.watchedSeconds,
      timestamp: userActivity.timestamp,
    })
    .from(userActivity)
    .leftJoin(videos, eq(userActivity.videoId, videos.id))
    .leftJoin(courses, eq(videos.coursesId, courses.id))
    .where(
      and(
        eq(userActivity.userId, userId),
        sql`${userActivity.timestamp} >= ${dayStart}`,
        sql`${userActivity.timestamp} <= ${dayEnd}`
      )
    )
    .orderBy(userActivity.timestamp);

  // Count unique videos watched
  const uniqueVideos = new Set(activities.map((a) => a.videoId)).size;

  return {
    totalSeconds: dailyRecord?.totalSeconds || 0,
    videosWatched: uniqueVideos,
    activities: activities,
  };
}

export async function getHeatmapData(userId: string, year: number) {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const data = await db
    .select()
    .from(dailyActivity)
    .where(
      and(
        eq(dailyActivity.userId, userId),
        sql`${dailyActivity.date} >= ${startDate}`,
        sql`${dailyActivity.date} <= ${endDate}`
      )
    )
    .orderBy(dailyActivity.date);

  return data;
}

export async function getDashboardStats(userId: string) {
  const [totalActivityResult] = await db
    .select({
      totalSeconds: sql<number>`COALESCE(SUM(${dailyActivity.totalSeconds}), 0)`,
    })
    .from(dailyActivity)
    .where(eq(dailyActivity.userId, userId));

  const userCourses = await db
    .select()
    .from(courses)
    .where(eq(courses.userId, userId));

  const coursesProgressData = await db
    .select()
    .from(courseProgress)
    .where(eq(courseProgress.userId, userId));

  const totalCompleted = coursesProgressData.reduce(
    (sum, cp) => sum + cp.completedVideos,
    0
  );

  return {
    totalWatchTimeSeconds: totalActivityResult?.totalSeconds || 0,
    totalCourses: userCourses.length,
    totalCompletedVideos: totalCompleted,
    coursesProgress: coursesProgressData,
  };
}

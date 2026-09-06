import { db } from "../db/index.ts";
import { courses, videos } from "../db/schema.ts";
import { eq } from "drizzle-orm";
import {
  extractYouTubeId,
  fetchVideoMetadata,
  fetchPlaylistMetadata,
  type VideoMetadata,
} from "./youtube.service.ts";

export async function createCourseFromUrl(userId: string, youtubeUrl: string) {
  const parsed = extractYouTubeId(youtubeUrl);

  if (!parsed) {
    throw new Error("Invalid YouTube URL");
  }

  if (parsed.type === "video") {
    return await createSingleVideoCourse(userId, parsed.id);
  } else {
    return await createPlaylistCourse(userId, parsed.id);
  }
}

async function createSingleVideoCourse(userId: string, videoId: string) {
  const videoMetadata = await fetchVideoMetadata(videoId);

  const [course] = await db
    .insert(courses)
    .values({
      userId,
      title: videoMetadata.title,
      thumbnailUrl: videoMetadata.thumbnailUrl,
      totalDurationSeconds: videoMetadata.durationSeconds,
      youtubePlaylistId: null,
    })
    .returning();

  if (!course) {
    throw new Error("Failed to create course");
  }

  const [video] = await db
    .insert(videos)
    .values({
      coursesId: course.id,
      userId,
      youtubeVideoId: videoMetadata.videoId,
      title: videoMetadata.title,
      durationSeconds: videoMetadata.durationSeconds,
      thumbnailUrl: videoMetadata.thumbnailUrl,
      order: 0,
    })
    .returning();

  return {
    course,
    videos: [video],
  };
}

async function createPlaylistCourse(userId: string, playlistId: string) {
  const playlistMetadata = await fetchPlaylistMetadata(playlistId);

  const totalDuration = playlistMetadata.videos.reduce(
    (sum, v) => sum + v.durationSeconds,
    0
  );

  const [course] = await db
    .insert(courses)
    .values({
      userId,
      title: playlistMetadata.title,
      describtion: playlistMetadata.description,
      thumbnailUrl: playlistMetadata.thumbnailUrl,
      totalDurationSeconds: totalDuration,
      youtubePlaylistId: playlistId,
    })
    .returning();

  if (!course) {
    throw new Error("Failed to create course");
  }

  const videoRecords = await db
    .insert(videos)
    .values(
      playlistMetadata.videos.map((v, index) => ({
        coursesId: course.id,
        userId,
        youtubeVideoId: v.videoId,
        title: v.title,
        durationSeconds: v.durationSeconds,
        thumbnailUrl: v.thumbnailUrl,
        order: index,
      }))
    )
    .returning();

  return {
    course,
    videos: videoRecords,
  };
}

export async function getUserCourses(userId: string) {
  return await db.select().from(courses).where(eq(courses.userId, userId));
}

export async function getCourseWithVideos(courseId: string, userId: string) {
  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId));

  if (!course) {
    throw new Error("Course not found");
  }

  if (course.userId !== userId) {
    throw new Error("Unauthorized");
  }

  const courseVideos = await db
    .select()
    .from(videos)
    .where(eq(videos.coursesId, courseId))
    .orderBy(videos.order);

  return {
    ...course,
    videos: courseVideos,
  };
}

export async function deleteCourse(courseId: string, userId: string) {
  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId));

  if (!course) {
    throw new Error("Course not found");
  }

  if (course.userId !== userId) {
    throw new Error("Unauthorized");
  }

  await db.delete(courses).where(eq(courses.id, courseId));

  return { success: true };
}

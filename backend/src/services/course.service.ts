import { db } from '../db/index.ts';
import { courses, videos, userCourses } from '../db/schema.ts';
import { eq, and } from 'drizzle-orm';
import {
  extractYouTubeId,
  fetchVideoMetadata,
  fetchPlaylistMetadata,
  type VideoMetadata,
} from './youtube.service.ts';

export async function createCourseFromUrl(userId: string, youtubeUrl: string) {
  const parsed = extractYouTubeId(youtubeUrl);

  if (!parsed) {
    throw new Error('Invalid YouTube URL');
  }

  if (parsed.type === 'video') {
    return await createSingleVideoCourse(userId, parsed.id);
  } else {
    return await createPlaylistCourse(userId, parsed.id);
  }
}

async function createSingleVideoCourse(userId: string, videoId: string) {
  const pseudoPlaylistId = `video_${videoId}`;

  // Check if global course exists
  let [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.youtubePlaylistId, pseudoPlaylistId));

  if (!course) {
    const videoMetadata = await fetchVideoMetadata(videoId);
    const [newCourse] = await db
      .insert(courses)
      .values({
        title: videoMetadata.title,
        thumbnailUrl: videoMetadata.thumbnailUrl,
        totalDurationSeconds: videoMetadata.durationSeconds,
        youtubePlaylistId: pseudoPlaylistId,
      })
      .returning();

    if (!newCourse) {
      throw new Error('Failed to create course');
    }
    course = newCourse;

    // create video globally
    await db
      .insert(videos)
      .values({
        coursesId: course.id,
        youtubeVideoId: videoMetadata.videoId,
        title: videoMetadata.title,
        durationSeconds: videoMetadata.durationSeconds,
        thumbnailUrl: videoMetadata.thumbnailUrl,
        order: 0,
      })
      .onConflictDoNothing(); // just in case
  }

  // Link user to course
  await db
    .insert(userCourses)
    .values({
      userId,
      courseId: course.id,
    })
    .onConflictDoNothing();

  const courseVideos = await db
    .select()
    .from(videos)
    .where(eq(videos.coursesId, course.id));

  return {
    course,
    videos: courseVideos,
  };
}

async function createPlaylistCourse(userId: string, playlistId: string) {
  // Check if global course exists
  let [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.youtubePlaylistId, playlistId));

  if (!course) {
    const playlistMetadata = await fetchPlaylistMetadata(playlistId);

    const totalDuration = playlistMetadata.videos.reduce(
      (sum, v) => sum + v.durationSeconds,
      0,
    );

    const [newCourse] = await db
      .insert(courses)
      .values({
        title: playlistMetadata.title,
        describtion: playlistMetadata.description,
        thumbnailUrl: playlistMetadata.thumbnailUrl,
        totalDurationSeconds: totalDuration,
        youtubePlaylistId: playlistId,
      })
      .returning();

    if (!newCourse) {
      throw new Error('Failed to create course');
    }
    course = newCourse;

    const courseId = course.id;
    await db
      .insert(videos)
      .values(
        playlistMetadata.videos.map((v, index) => ({
          coursesId: courseId,
          youtubeVideoId: v.videoId,
          title: v.title,
          durationSeconds: v.durationSeconds,
          thumbnailUrl: v.thumbnailUrl,
          order: index,
        })),
      )
      .onConflictDoNothing();
  }

  // Link user to course
  await db
    .insert(userCourses)
    .values({
      userId,
      courseId: course.id,
    })
    .onConflictDoNothing();

  const courseVideos = await db
    .select()
    .from(videos)
    .where(eq(videos.coursesId, course.id));

  return {
    course,
    videos: courseVideos,
  };
}

export async function getUserCourses(userId: string) {
  const result = await db
    .select({
      course: courses,
    })
    .from(userCourses)
    .innerJoin(courses, eq(userCourses.courseId, courses.id))
    .where(eq(userCourses.userId, userId));

  return result.map((r) => r.course);
}

export async function getCourseWithVideos(courseId: string, userId: string) {
  const [enrollment] = await db
    .select()
    .from(userCourses)
    .where(
      and(eq(userCourses.courseId, courseId), eq(userCourses.userId, userId)),
    );

  if (!enrollment) {
    throw new Error('Unauthorized or course not found');
  }

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId));

  if (!course) {
    throw new Error('Course not found');
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
  const [enrollment] = await db
    .select()
    .from(userCourses)
    .where(
      and(eq(userCourses.courseId, courseId), eq(userCourses.userId, userId)),
    );

  if (!enrollment) {
    throw new Error('Unauthorized or course not found');
  }

  await db
    .delete(userCourses)
    .where(
      and(eq(userCourses.courseId, courseId), eq(userCourses.userId, userId)),
    );

  return { success: true };
}

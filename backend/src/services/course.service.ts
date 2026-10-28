import { db } from '../db/index.ts';
import {
  courses,
  videos,
  userCourses,
  courseProgress,
  progress,
} from '../db/schema.ts';
import { eq, and, sql } from 'drizzle-orm';
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
  const rows = await db
    .select({
      course: courses,
      totalWatchedSeconds: sql<number>`COALESCE(${courseProgress.totalWatchedSeconds}, 0)`,
      completedVideos: sql<number>`COALESCE(${courseProgress.completedVideos}, 0)`,
      totalVideos: sql<number>`(
        SELECT COUNT(*)::int FROM ${videos}
        WHERE ${videos.coursesId} = ${courses.id}
      )`,
    })
    .from(userCourses)
    .innerJoin(courses, eq(userCourses.courseId, courses.id))
    .leftJoin(
      courseProgress,
      and(
        eq(courseProgress.coursesId, courses.id),
        eq(courseProgress.userId, userId),
      ),
    )
    .where(eq(userCourses.userId, userId));

  if (rows.length === 0) {
    return [];
  }

  const userVideoProgress = await db
    .select({
      coursesId: videos.coursesId,
      videoId: progress.videoId,
      videoTitle: videos.title,
      checkpointSeconds: progress.checkpointSeconds,
      lastWatchedAt: progress.lastWatchedAt,
    })
    .from(progress)
    .innerJoin(videos, eq(progress.videoId, videos.id))
    .innerJoin(
      userCourses,
      and(
        eq(userCourses.courseId, videos.coursesId),
        eq(userCourses.userId, userId),
      ),
    )
    .where(eq(progress.userId, userId))
    .orderBy(sql`${progress.lastWatchedAt} DESC`);

  const latestByCourse = new Map<
    string,
    (typeof userVideoProgress)[number]
  >();
  for (const item of userVideoProgress) {
    if (!latestByCourse.has(item.coursesId)) {
      latestByCourse.set(item.coursesId, item);
    }
  }

  return rows.map(
    ({ course, totalWatchedSeconds, completedVideos, totalVideos }) => {
      const latest = latestByCourse.get(course.id);
      const watched = Number(totalWatchedSeconds) || 0;
      const completed = Number(completedVideos) || 0;
      const videosCount = Number(totalVideos) || 0;
      const totalDuration = course.totalDurationSeconds || 0;
      const progressPercentage =
        totalDuration > 0
          ? Math.min(100, (watched / totalDuration) * 100)
          : 0;

      return {
        ...course,
        progressPercentage,
        totalWatchedSeconds: watched,
        completedVideos: completed,
        totalVideos: videosCount,
        currentVideoId: latest?.videoId,
        currentVideoTitle: latest?.videoTitle,
        currentCheckpoint: latest?.checkpointSeconds || 0,
        lastWatchedAt: latest?.lastWatchedAt,
      };
    },
  );
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
export async function syncPlaylistCourse(courseId: string, userId: string) {
  const [enrollment] = await db
    .select()
    .from(userCourses)
    .where(
      and(eq(userCourses.courseId, courseId), eq(userCourses.userId, userId))
    );

  if (!enrollment) {
    throw new Error('Unauthorized or course not found');
  }

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId));

  if (!course || !course.youtubePlaylistId || course.youtubePlaylistId.startsWith('video_')) {
    throw new Error('Course is not a valid playlist');
  }

  const playlistMetadata = await fetchPlaylistMetadata(course.youtubePlaylistId);

  const totalDuration = playlistMetadata.videos.reduce(
    (sum, v) => sum + v.durationSeconds,
    0
  );

  await db
    .update(courses)
    .set({
      title: playlistMetadata.title,
      describtion: playlistMetadata.description,
      thumbnailUrl: playlistMetadata.thumbnailUrl,
      totalDurationSeconds: totalDuration,
    })
    .where(eq(courses.id, courseId));

  const existingVideos = await db
    .select()
    .from(videos)
    .where(eq(videos.coursesId, courseId));

  const existingVideoIds = new Set(existingVideos.map((v) => v.youtubeVideoId));

  const newVideos = playlistMetadata.videos
    .map((v, index) => ({
      coursesId: courseId,
      youtubeVideoId: v.videoId,
      title: v.title,
      durationSeconds: v.durationSeconds,
      thumbnailUrl: v.thumbnailUrl,
      order: index,
    }))
    .filter((v) => !existingVideoIds.has(v.youtubeVideoId));

  if (newVideos.length > 0) {
    await db.insert(videos).values(newVideos).onConflictDoNothing();
  }
  
  return { success: true, addedVideosCount: newVideos.length };
}

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Spinner } from '../components/ui/Spinner';
import { VideoCard } from '../components/course/VideoCard';

interface Video {
  id: string;
  coursesId: string;
  youtubeVideoId: string;
  title: string;
  durationSeconds: number;
  thumbnailUrl: string | null;
  order: number;
}

interface VideoProgress {
  userId: string;
  videoId: string;
  checkpointSeconds: number;
  totalWatchedSeconds: number;
  completed: boolean;
  lastWatchedAt: string;
}

interface Course {
  id: string;
  userId: string;
  title: string;
  describtion: string | null;
  thumbnailUrl: string | null;
  youtubePlaylistId: string | null;
  totalDurationSeconds: number;
  createdAt: string;
  videos: Video[];
}

interface CourseProgress {
  course: {
    id: string;
    title: string;
    totalDurationSeconds: number;
  };
  totalWatchedSeconds: number;
  completedVideos: number;
  totalVideos: number;
  totalDurationSeconds: number;
  videoProgress: VideoProgress[];
}

export const CoursePage = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [completingVideoId, setCompletingVideoId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setIsLoading(true);

        // Fetch course with videos
        const courseResponse = await api.get(`/courses/${id}`);
        setCourse(courseResponse.data.course);

        // Fetch progress
        const progressResponse = await api.get(
          `/activity/course-progress/${id}`,
        );
        setProgress(progressResponse.data);
      } catch (error) {
        console.error('Failed to fetch course:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchCourse();
    }
  }, [id]);

  const handleSync = async () => {
    if (!course) return;
    try {
      setIsSyncing(true);
      await api.post(`/courses/${course.id}/sync`);

      const courseResponse = await api.get(`/courses/${id}`);
      setCourse(courseResponse.data.course);
    } catch (error) {
      console.error('Failed to sync course:', error);
      alert('Failed to sync course. Check console for details.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }

    setIsDeleting(true);
    try {
      await api.delete(`/courses/${course?.id}`);
      window.location.href = '/dashboard';
    } finally {
      setIsDeleting(false);
      setConfirmingDelete(false);
    }
  };

  const handleComplete = async (video: Video) => {
    setCompletingVideoId(video.id);
    try {
      await api.patch(`/activity/progress/${video.id}`, {
        checkpointSeconds: video.durationSeconds,
        isCompleted: true,
      });
      setProgress((current) =>
        current
          ? {
              ...current,
              completedVideos: Math.min(
                current.totalVideos,
                current.completedVideos +
                  (progressMap.get(video.id)?.completed ? 0 : 1),
              ),
              videoProgress: [
                ...current.videoProgress.filter(
                  (item) => item.videoId !== video.id,
                ),
                {
                  userId: '',
                  videoId: video.id,
                  checkpointSeconds: video.durationSeconds,
                  totalWatchedSeconds: video.durationSeconds,
                  completed: true,
                  lastWatchedAt: new Date().toISOString(),
                },
              ],
            }
          : current,
      );
    } catch (error) {
      console.error('Failed to mark video complete:', error);
    } finally {
      setCompletingVideoId(null);
    }
  };

  if (isLoading) {
    return <Spinner />;
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Course not found</p>
        <Link to="/dashboard" className="text-blue-600 hover:underline mt-4">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const progressPercentage =
    course.totalDurationSeconds > 0
      ? ((progress?.totalWatchedSeconds || 0) / course.totalDurationSeconds) *
        100
      : 0;

  // Create a map of video progress
  const progressMap = new Map<string, VideoProgress>();
  progress?.videoProgress.forEach((vp) => {
    progressMap.set(vp.videoId, vp);
  });

  const isPlaylist =
    course.youtubePlaylistId && !course.youtubePlaylistId.startsWith('video_');

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 overflow-hidden">
      {/* Back button */}
      <Link
        to="/dashboard"
        className="inline-flex max-w-full items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        <svg
          className="w-5 h-5 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Dashboard
      </Link>

      {/* Course Header */}
      <div className="lt-panel p-4 shadow-xl sm:p-6">
        <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:gap-6">
          {/* Thumbnail */}
          <div className="aspect-video w-full flex-shrink-0 overflow-hidden rounded-lg bg-gray-200 lg:w-80">
            {course.thumbnailUrl ? (
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg
                  className="w-16 h-16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="mb-4 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <h1 className="min-w-0 break-words font-['Plus_Jakarta_Sans'] text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
                {course.title}
              </h1>
              <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                {isPlaylist && (
                  <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--lt-border)] bg-[var(--lt-surface-high)] px-3 py-1.5 text-sm font-medium text-[var(--lt-primary)] hover:bg-[var(--lt-surface-highest)] disabled:opacity-50 sm:flex-none"
                  >
                    <svg
                      className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    {isSyncing ? 'Syncing...' : 'Sync Playlist'}
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-[#93000a] bg-[#93000a]/15 px-3 py-1.5 text-sm font-medium text-[var(--lt-rose)] hover:bg-[#93000a]/30 disabled:opacity-50 sm:flex-none"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    delete
                  </span>
                  {confirmingDelete
                    ? 'Confirm remove'
                    : isDeleting
                      ? 'Removing...'
                      : 'Remove course'}
                </button>
              </div>
            </div>

            {course.describtion && (
              <p className="mb-4 break-words text-gray-600">
                {course.describtion}
              </p>
            )}

            <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-600">
              <span>{course.videos.length} videos</span>
              <span>{formatDuration(course.totalDurationSeconds)} total</span>
              <span>
                {progress?.completedVideos || 0} /{course.videos.length}{' '}
                completed
              </span>
            </div>

            {/* Overall Progress */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Course Progress</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video List */}
      <div className="lt-panel overflow-hidden shadow-xl">
        <div className="border-b border-gray-200 p-4 sm:p-5">
          <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-gray-900">
            Course Content
          </h2>
        </div>

        <div className="divide-y divide-gray-100">
          {course.videos.map((video) => {
            const videoProgress = progressMap.get(video.id);
            return (
              <VideoCard
                key={video.id}
                id={video.id}
                courseId={course.id}
                youtubeVideoId={video.youtubeVideoId}
                title={video.title}
                durationSeconds={video.durationSeconds}
                thumbnailUrl={video.thumbnailUrl}
                order={video.order}
                totalWatchedSeconds={videoProgress?.totalWatchedSeconds || 0}
                completed={videoProgress?.completed || false}
                onComplete={() => handleComplete(video)}
                isCompleting={completingVideoId === video.id}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

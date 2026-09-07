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
    <div className="max-w-6xl mx-auto">
      {/* Back button */}
      <Link
        to="/dashboard"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
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
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex gap-6">
          {/* Thumbnail */}
          <div className="flex-shrink-0 w-80 aspect-video bg-gray-200 rounded-lg overflow-hidden">
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
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {course.title}
              </h1>
              {isPlaylist && (
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50 transition-colors"
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
            </div>

            {course.describtion && (
              <p className="text-gray-600 mb-4">{course.describtion}</p>
            )}

            <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
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
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Course Content</h2>
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
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

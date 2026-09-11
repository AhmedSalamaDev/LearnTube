import { Link } from 'react-router-dom';

interface VideoCardProps {
  id: string;
  courseId: string;
  youtubeVideoId: string;
  title: string;
  durationSeconds: number;
  thumbnailUrl: string | null;
  order: number;
  totalWatchedSeconds?: number;
  completed?: boolean;
  onComplete?: () => void;
  isCompleting?: boolean;
}

export const VideoCard = ({
  id,
  courseId,
  // youtubeVideoId,
  title,
  durationSeconds,
  thumbnailUrl,
  order,
  totalWatchedSeconds = 0,
  completed = false,
  onComplete,
  isCompleting = false,
}: VideoCardProps) => {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage =
    durationSeconds > 0 ? (totalWatchedSeconds / durationSeconds) * 100 : 0;

  return (
    <div className="group rounded-lg transition-colors hover:bg-gray-50">
      <Link to={`/course/${courseId}/video/${id}`} className="block">
        <div className="flex min-w-0 gap-3 p-3 sm:gap-4">
          {/* Order Number */}
          <div className="w-6 flex-shrink-0 pt-2 sm:w-8">
            <span className="text-gray-500 font-medium">{order + 1}</span>
          </div>

          {/* Thumbnail */}
          <div className="relative w-28 flex-shrink-0 aspect-video overflow-hidden rounded bg-gray-200 sm:w-40">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            )}

            {/* Duration badge */}
            <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1.5 py-0.5 rounded">
              {formatDuration(durationSeconds)}
            </div>

            {/* Completed badge */}
            {completed && (
              <div className="absolute top-1 right-1 bg-green-600 text-white rounded-full p-1">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Video Info */}
          <div className="flex-1 min-w-0">
            <h3 className="break-words font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
              {title}
            </h3>

            {/* Progress bar */}
            {totalWatchedSeconds > 0 && (
              <div className="mb-1">
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div
                    className="bg-blue-600 h-1 rounded-full transition-all"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {completed
                    ? 'Completed'
                    : `${Math.round(progressPercentage)}% watched`}
                </p>
              </div>
            )}

            {totalWatchedSeconds === 0 && !completed && (
              <p className="text-xs text-gray-500">Not started</p>
            )}
          </div>
        </div>
      </Link>
      <div className="flex justify-end px-3 pb-3 sm:justify-end">
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            onComplete?.();
          }}
          disabled={completed || isCompleting}
          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${completed ? 'bg-tertiary-container/20 text-tertiary' : 'bg-surface-container-high text-on-surface-variant hover:bg-tertiary-container/20 hover:text-tertiary'} disabled:opacity-60`}
        >
          <span className="material-symbols-outlined text-[16px]">
            {completed ? 'check_circle' : 'check'}
          </span>
          {completed
            ? 'Completed'
            : isCompleting
              ? 'Saving...'
              : 'Mark complete'}
        </button>
      </div>
    </div>
  );
};

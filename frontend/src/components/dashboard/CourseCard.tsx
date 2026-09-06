import { Link } from "react-router-dom";
import { useState } from "react";
import { api } from "../../lib/api";

interface CourseCardProps {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  totalDurationSeconds: number;
  progressPercentage?: number;
  totalWatchedSeconds?: number;
  onDelete?: () => void;
}

export const CourseCard = ({
  id,
  title,
  description,
  thumbnailUrl,
  totalDurationSeconds,
  progressPercentage = 0,
  totalWatchedSeconds = 0,
  onDelete,
}: CourseCardProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDeleting(true);
    try {
      await api.delete(`/courses/${id}`);
      onDelete?.();
    } catch (error) {
      console.error("Failed to delete course:", error);
      setShowDeleteConfirm(false);
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowDeleteConfirm(false);
  };

  return (
    <Link to={`/course/${id}`} className="block group h-full">
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden h-full flex flex-col">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gray-200 flex-shrink-0 overflow-hidden">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title}
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

          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            {formatDuration(totalDurationSeconds)}
          </div>
        </div>

        {/* Content */}
        <div className="p-3 flex-1 flex flex-col">
          <h3 className="font-semibold text-base text-gray-900 group-hover:text-blue-600 transition-colors mb-1.5 line-clamp-1">
            {title}
          </h3>

          {description && (
            <p className="text-xs text-gray-600 mb-2 line-clamp-1">
              {description}
            </p>
          )}

          {/* Spacer to push progress and stats to bottom */}
          <div className="flex-1"></div>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Stats and Delete */}
          {!showDeleteConfirm ? (
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{formatDuration(totalWatchedSeconds)} watched</span>

              {/* Delete button */}
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="text-red-600 hover:text-red-700 disabled:opacity-50 text-xs"
              >
                Delete
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs">
              <span className="text-red-600 font-medium">Delete course?</span>
              <div className="flex gap-2">
                <button
                  onClick={handleCancelDelete}
                  disabled={isDeleting}
                  className="px-2 py-1 text-gray-600 hover:text-gray-900 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Confirm"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

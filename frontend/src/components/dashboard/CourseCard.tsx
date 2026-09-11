import { Link } from 'react-router-dom';
import { useState } from 'react';
import { api } from '../../lib/api';

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

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

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
  const [confirming, setConfirming] = useState(false);
  const handleDelete = async (event: React.MouseEvent) => {
    event.preventDefault();
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setIsDeleting(true);
    try {
      await api.delete(`/courses/${id}`);
      onDelete?.();
    } finally {
      setIsDeleting(false);
      setConfirming(false);
    }
  };
  return (
    <Link to={`/course/${id}`} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--lt-border)] bg-[var(--lt-surface-low)] transition hover:-translate-y-0.5 hover:border-[var(--lt-primary-strong)] hover:shadow-xl hover:shadow-black/20">
        <div className="relative aspect-video overflow-hidden bg-[var(--lt-surface)]">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-[var(--lt-primary)]">
                school
              </span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[var(--lt-surface-low)] to-transparent" />
          <span className="lt-mono absolute bottom-3 right-3 rounded bg-[var(--lt-background)]/85 px-2 py-1 text-xs">
            {formatDuration(totalDurationSeconds)}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 font-['Plus_Jakarta_Sans'] font-bold text-[var(--lt-text)] transition group-hover:text-[var(--lt-primary)]">
              {title}
            </h3>
            <span className="lt-mono shrink-0 text-xs text-[var(--lt-green)]">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          {description && (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--lt-muted)]">
              {description}
            </p>
          )}
          <div className="mt-auto pt-5">
            <div className="mb-2 h-1.5 rounded-full bg-[var(--lt-surface-highest)]">
              <div
                className="h-full rounded-full bg-[var(--lt-green)]"
                style={{ width: `${Math.min(100, progressPercentage)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-[var(--lt-muted)]">
              <span>{formatDuration(totalWatchedSeconds)} watched</span>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className={`font-semibold ${confirming ? 'text-[var(--lt-rose)]' : 'text-[var(--lt-muted)] hover:text-[var(--lt-rose)]'}`}
              >
                {confirming
                  ? 'Confirm remove'
                  : isDeleting
                    ? 'Removing...'
                    : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

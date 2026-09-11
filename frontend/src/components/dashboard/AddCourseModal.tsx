import { useState } from 'react';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddCourseModal = ({
  isOpen,
  onClose,
  onSuccess,
}: AddCourseModalProps) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.post('/courses', { youtubeUrl });
      setYoutubeUrl('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create course');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setYoutubeUrl('');
      setError('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--lt-background)]/80 px-4 backdrop-blur-md">
      <div className="lt-panel w-full max-w-xl shadow-2xl">
        <div className="p-6">
          <div className="mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-[var(--lt-rose)]">
              smart_display
            </span>
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-bold">
                Import YouTube course
              </h2>
              <p className="text-sm text-[var(--lt-muted)]">
                Build a focused syllabus from a video or playlist.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="youtubeUrl" className="lt-label mb-2 block">
                YouTube URL
              </label>
              <input
                type="text"
                id="youtubeUrl"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full rounded-lg border border-[var(--lt-border)] bg-[var(--lt-surface)] px-4 py-3 text-sm outline-none focus:border-[var(--lt-primary)]"
                disabled={isLoading}
                required
              />
              <p className="mt-2 text-sm text-[var(--lt-muted)]">
                Paste a YouTube video or playlist URL
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-[#93000a] bg-[#93000a]/20 p-3 text-sm text-[var(--lt-rose)]">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                disabled={!youtubeUrl.trim()}
              >
                Add Course
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

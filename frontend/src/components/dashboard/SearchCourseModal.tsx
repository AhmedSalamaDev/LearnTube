import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';

interface SearchResult {
  id: string;
  type: 'video' | 'playlist';
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
}

interface SearchCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SearchCourseModal = ({
  isOpen,
  onClose,
  onSuccess,
}: SearchCourseModalProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setError('');
      return;
    }

    const timer = setTimeout(async () => {
      if (query.trim().length >= 3) {
        setIsSearching(true);
        setError('');
        try {
          const res = await api.get(
            `/courses/search?q=${encodeURIComponent(query)}`,
          );
          setResults(res.data.results || []);
        } catch (err: any) {
          setError(err.response?.data?.error || 'Failed to search');
          setResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  const handleAddCourse = async (result: SearchResult) => {
    setError('');
    setIsAdding(true);

    const youtubeUrl =
      result.type === 'playlist'
        ? `https://www.youtube.com/playlist?list=${result.id}`
        : `https://www.youtube.com/watch?v=${result.id}`;

    try {
      await api.post('/courses', { youtubeUrl });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create course');
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    if (!isAdding) {
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--lt-background)]/80 px-4 backdrop-blur-md">
      <div
        className="lt-panel flex w-full max-w-3xl flex-col shadow-2xl"
        style={{ maxHeight: '80vh' }}
      >
        <div className="border-b border-[var(--lt-border)] p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-bold">
              Search YouTube
            </h2>
            <button
              onClick={handleClose}
              disabled={isAdding}
              className="text-[var(--lt-muted)] hover:text-[var(--lt-text)]"
            >
              <span className="material-symbols-outlined text-[22px]">
                close
              </span>
            </button>
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for videos or playlists..."
            className="w-full rounded-lg border border-[var(--lt-border)] bg-[var(--lt-surface)] px-4 py-3 text-sm outline-none focus:border-[var(--lt-primary)]"
            disabled={isAdding}
            autoFocus
          />
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          {error && (
            <div className="mb-4 rounded-lg border border-[#93000a] bg-[#93000a]/20 p-3 text-sm text-[var(--lt-rose)]">
              {error}
            </div>
          )}

          {isSearching ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="flex gap-4 rounded-lg border border-[var(--lt-border)] bg-[var(--lt-surface)] p-4 transition hover:bg-[var(--lt-surface-high)]"
                >
                  <div className="flex-shrink-0 w-32 h-24 relative">
                    <img
                      src={result.thumbnailUrl}
                      alt={result.title}
                      className="w-full h-full object-cover rounded"
                    />
                    <span className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1.5 py-0.5 rounded">
                      {result.type === 'playlist' ? 'Playlist' : 'Video'}
                    </span>
                  </div>
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 line-clamp-2">
                        {result.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {result.channelTitle}
                      </p>
                    </div>
                    <div className="mt-2 text-right">
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => handleAddCourse(result)}
                        disabled={isAdding}
                        className="text-sm px-3 py-1.5"
                      >
                        Add Course
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : query.trim().length >= 3 ? (
            <p className="text-center text-gray-500 py-8">
              No results found for "{query}"
            </p>
          ) : (
            <p className="text-center text-gray-500 py-8">
              Type at least 3 characters to search
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

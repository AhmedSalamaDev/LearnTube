import { useState, useEffect } from 'react';
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 flex flex-col"
        style={{ maxHeight: '80vh' }}
      >
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Search YouTube</h2>
            <button
              onClick={handleClose}
              disabled={isAdding}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for videos or playlists..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isAdding}
            autoFocus
          />
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
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
                  className="flex gap-4 border p-4 rounded-lg hover:bg-gray-50 transition-colors"
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
    </div>
  );
};

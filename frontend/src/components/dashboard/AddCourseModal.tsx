import { useState } from "react";
import { api } from "../../lib/api";
import { Button } from "../ui/Button";

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
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await api.post("/courses", { youtubeUrl });
      setYoutubeUrl("");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create course");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setYoutubeUrl("");
      setError("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Add New Course</h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="youtubeUrl"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                YouTube URL
              </label>
              <input
                type="text"
                id="youtubeUrl"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                Paste a YouTube video or playlist URL
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
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

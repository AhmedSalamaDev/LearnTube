import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Spinner } from "../components/ui/Spinner";
import { VideoPlayer } from "../components/player/VideoPlayer";

interface Video {
  id: string;
  coursesId: string;
  youtubeVideoId: string;
  title: string;
  durationSeconds: number;
  thumbnailUrl: string | null;
  order: number;
}

interface Course {
  id: string;
  title: string;
  videos: Video[];
}

export const PlayerPage = () => {
  const { courseId, videoId } = useParams<{
    courseId: string;
    videoId: string;
  }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch course with videos
        const response = await api.get(`/courses/${courseId}`);
        const courseData = response.data.course;
        setCourse(courseData);

        // Find current video
        const video = courseData.videos.find((v: Video) => v.id === videoId);
        setCurrentVideo(video || null);
      } catch (error) {
        console.error("Failed to fetch course data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId && videoId) {
      fetchData();
    }
  }, [courseId, videoId]);

  const handleVideoEnd = () => {
    if (!course || !currentVideo) return;

    // Find next video
    const currentIndex = course.videos.findIndex((v) => v.id === videoId);
    if (currentIndex < course.videos.length - 1) {
      const nextVideo = course.videos[currentIndex + 1];
      navigate(`/course/${courseId}/video/${nextVideo.id}`);
    }
  };

  const handleVideoClick = (video: Video) => {
    navigate(`/course/${courseId}/video/${video.id}`);
  };

  if (isLoading) {
    return <Spinner />;
  }

  if (!course || !currentVideo) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Video not found</p>
        <Link
          to={`/course/${courseId}`}
          className="text-blue-600 hover:underline mt-4"
        >
          Back to Course
        </Link>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back button */}
      <Link
        to={`/course/${courseId}`}
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
        Back to Course
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main video player */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-4">
            <VideoPlayer
              videoId={currentVideo.id}
              youtubeVideoId={currentVideo.youtubeVideoId}
              onVideoEnd={handleVideoEnd}
            />
          </div>

          {/* Video info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {currentVideo.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>
                Video {currentVideo.order + 1} of {course.videos.length}
              </span>
              <span>{formatDuration(currentVideo.durationSeconds)}</span>
            </div>
          </div>
        </div>

        {/* Video list sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">{course.title}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {course.videos.length} videos
              </p>
            </div>

            <div className="max-h-[600px] overflow-y-auto">
              {course.videos.map((video) => {
                const isActive = video.id === videoId;
                return (
                  <button
                    key={video.id}
                    onClick={() => handleVideoClick(video)}
                    className={`w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      isActive ? "bg-blue-50 border-l-4 border-l-blue-600" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Order number */}
                      <span
                        className={`flex-shrink-0 text-sm font-medium ${
                          isActive ? "text-blue-600" : "text-gray-500"
                        }`}
                      >
                        {video.order + 1}
                      </span>

                      {/* Thumbnail */}
                      <div className="flex-shrink-0 w-24 aspect-video bg-gray-200 rounded overflow-hidden">
                        {video.thumbnailUrl ? (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg
                              className="w-6 h-6"
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
                        <div className="relative -mt-5 mr-1 flex justify-end">
                          <span className="bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded">
                            {formatDuration(video.durationSeconds)}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium line-clamp-2 ${
                            isActive ? "text-blue-600" : "text-gray-900"
                          }`}
                        >
                          {video.title}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

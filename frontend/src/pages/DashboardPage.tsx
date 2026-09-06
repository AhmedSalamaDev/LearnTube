import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { CourseCard } from "../components/dashboard/CourseCard";
import { AddCourseModal } from "../components/dashboard/AddCourseModal";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";

interface Course {
  id: string;
  title: string;
  describtion: string | null;
  thumbnailUrl: string | null;
  totalDurationSeconds: number;
  progressPercentage?: number;
  totalWatchedSeconds?: number;
}

export const DashboardPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      setError("");

      // Fetch courses list
      const coursesResponse = await api.get("/courses");
      const coursesList = coursesResponse.data.courses || [];

      // Fetch progress data for each course
      const coursesWithProgress = await Promise.all(
        coursesList.map(async (course: Course) => {
          try {
            const progressResponse = await api.get(
              `/activity/course-progress/${course.id}`
            );
            const progressData = progressResponse.data;

            // Calculate progress percentage
            const progressPercentage =
              progressData.totalDurationSeconds > 0
                ? (progressData.totalWatchedSeconds /
                    progressData.totalDurationSeconds) *
                  100
                : 0;

            return {
              ...course,
              progressPercentage,
              totalWatchedSeconds: progressData.totalWatchedSeconds || 0,
            };
          } catch (err) {
            console.error(
              `Failed to fetch progress for course ${course.id}:`,
              err
            );
            // Return course with 0 progress if fetch fails
            return {
              ...course,
              progressPercentage: 0,
              totalWatchedSeconds: 0,
            };
          }
        })
      );

      setCourses(coursesWithProgress);
    } catch (err) {
      console.error("Failed to fetch courses:", err);
      setError("Failed to load courses");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-600 mt-1">
            {courses.length} {courses.length === 1 ? "course" : "courses"}
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <span className="flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Course
          </span>
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {courses.length === 0 ? (
        <div className="text-center py-16">
          <svg
            className="w-24 h-24 mx-auto text-gray-400 mb-4"
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
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            No courses yet
          </h2>
          <p className="text-gray-500 mb-6">
            Add your first course from YouTube to get started!
          </p>
          <Button onClick={() => setIsModalOpen(true)}>
            Add Your First Course
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              id={course.id}
              title={course.title}
              description={course.describtion}
              thumbnailUrl={course.thumbnailUrl}
              totalDurationSeconds={course.totalDurationSeconds}
              progressPercentage={course.progressPercentage}
              totalWatchedSeconds={course.totalWatchedSeconds}
              onDelete={fetchCourses}
            />
          ))}
        </div>
      )}

      <AddCourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCourses}
      />
    </div>
  );
};

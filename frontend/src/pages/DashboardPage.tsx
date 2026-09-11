import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { CourseCard } from '../components/dashboard/CourseCard';
import { AddCourseModal } from '../components/dashboard/AddCourseModal';
import { SearchCourseModal } from '../components/dashboard/SearchCourseModal';
import { Spinner } from '../components/ui/Spinner';

interface Course {
  id: string;
  title: string;
  describtion: string | null;
  thumbnailUrl: string | null;
  totalDurationSeconds: number;
  progressPercentage?: number;
  totalWatchedSeconds?: number;
  completedVideos?: number;
  totalVideos?: number;
  currentVideoId?: string;
  currentVideoTitle?: string;
  currentCheckpoint?: number;
  lastWatchedAt?: string;
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

export const DashboardPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [resumeCourse, setResumeCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await api.get('/courses');
      const enriched = await Promise.all(
        (response.data.courses || []).map(async (course: Course) => {
          try {
            const progressResponse = await api.get(
              `/activity/course-progress/${course.id}`,
            );
            const progress = progressResponse.data;
            const watched = progress.totalWatchedSeconds || 0;
            const total =
              progress.totalDurationSeconds || course.totalDurationSeconds || 0;
            const latest = [...(progress.videoProgress || [])].sort(
              (a, b) =>
                new Date(b.lastWatchedAt || 0).getTime() -
                new Date(a.lastWatchedAt || 0).getTime(),
            )[0];
            return {
              ...course,
              progressPercentage:
                total > 0 ? Math.min(100, (watched / total) * 100) : 0,
              totalWatchedSeconds: watched,
              completedVideos: progress.completedVideos || 0,
              totalVideos: progress.totalVideos || 0,
              currentVideoId: latest?.videoId,
              currentCheckpoint: latest?.checkpointSeconds || 0,
              currentVideoTitle: latest?.videoTitle,
              lastWatchedAt: latest?.lastWatchedAt,
            };
          } catch {
            return { ...course, progressPercentage: 0, totalWatchedSeconds: 0 };
          }
        }),
      );
      setCourses(enriched);
      setResumeCourse(
        enriched
          .filter((course) => course.currentVideoId)
          .sort(
            (a, b) =>
              new Date(b.lastWatchedAt || 0).getTime() -
              new Date(a.lastWatchedAt || 0).getTime(),
          )[0] ||
          enriched[0] ||
          null,
      );
    } catch {
      setError('Failed to load your courses.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  if (isLoading) return <Spinner />;

  const visibleCourses = courses.filter((course) => {
    const matchesQuery = course.title
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'completed'
        ? course.progressPercentage === 100
        : course.progressPercentage !== 100);
    return matchesQuery && matchesFilter;
  });
  const resumeProgress = Math.round(resumeCourse?.progressPercentage || 0);

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="lt-label mb-2 flex items-center gap-2 text-[var(--lt-green)]">
            <span className="h-2 w-2 rounded-full bg-[var(--lt-green)]" />
            Scholar workspace
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-extrabold tracking-tight sm:text-4xl">
            Active curriculum
          </h1>
          <p className="mt-2 text-sm text-[var(--lt-muted)]">
            Your focused library of videos and playlists.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-[var(--lt-border)] bg-[var(--lt-surface-high)] px-4 py-2.5 text-sm font-bold hover:bg-[var(--lt-surface-highest)]"
          >
            <span className="material-symbols-outlined text-[18px]">
              search
            </span>
            Search YouTube
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-[var(--lt-rose-strong)] px-4 py-2.5 text-sm font-bold text-white hover:brightness-110"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add course
          </button>
        </div>
      </section>
      {error && (
        <div className="rounded-lg border border-[#93000a] bg-[#93000a]/20 p-4 text-sm text-[var(--lt-rose)]">
          {error}
        </div>
      )}
      {resumeCourse && (
        <section className="overflow-hidden rounded-2xl border border-[var(--lt-border)] bg-[var(--lt-surface-low)] shadow-2xl">
          <div className="grid lg:grid-cols-12">
            <div className="relative min-h-64 bg-[var(--lt-surface)] lg:col-span-5">
              {resumeCourse.thumbnailUrl ? (
                <img
                  src={resumeCourse.thumbnailUrl}
                  alt={resumeCourse.title}
                  className="h-full w-full object-cover opacity-75"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="material-symbols-outlined text-7xl text-[var(--lt-primary)]">
                    school
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--lt-surface-low)] via-transparent to-transparent" />
              <span className="lt-label absolute left-5 top-5 rounded bg-[var(--lt-background)]/80 px-2 py-1 text-[var(--lt-green)]">
                Live checkpoint
              </span>
              <span className="lt-mono absolute bottom-5 right-5 rounded bg-[var(--lt-background)]/80 px-2 py-1 text-xs">
                {formatDuration(resumeCourse.currentCheckpoint || 0)} /{' '}
                {formatDuration(resumeCourse.totalDurationSeconds)}
              </span>
            </div>
            <div className="flex flex-col justify-between p-6 lg:col-span-7 lg:p-8">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="lt-label text-[var(--lt-primary)]">
                    Continue learning
                  </span>
                  <span className="lt-mono text-sm text-[var(--lt-green)]">
                    {resumeProgress}% complete
                  </span>
                </div>
                <h2 className="mt-3 font-['Plus_Jakarta_Sans'] text-2xl font-bold">
                  {resumeCourse.title}
                </h2>
                <div className="mt-5 flex items-start gap-3 rounded-xl bg-[var(--lt-surface)] p-4">
                  <span className="material-symbols-outlined text-[var(--lt-primary)]">
                    play_circle
                  </span>
                  <div>
                    <span className="lt-label">Current lesson</span>
                    <p className="mt-1 font-semibold">
                      {resumeCourse.currentVideoTitle ||
                        'Open the course to begin'}
                    </p>
                  </div>
                </div>
                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-xs text-[var(--lt-muted)]">
                    <span>
                      {resumeCourse.completedVideos || 0} of{' '}
                      {resumeCourse.totalVideos || 0} videos completed
                    </span>
                    <span>
                      {formatDuration(resumeCourse.totalWatchedSeconds || 0)}{' '}
                      watched
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--lt-surface-highest)]">
                    <div
                      className="h-full rounded-full bg-[var(--lt-green)]"
                      style={{ width: `${resumeProgress}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to={
                    resumeCourse.currentVideoId
                      ? `/course/${resumeCourse.id}/video/${resumeCourse.currentVideoId}`
                      : `/course/${resumeCourse.id}`
                  }
                  className="flex items-center gap-2 rounded-lg bg-[var(--lt-primary)] px-5 py-3 text-sm font-bold text-[#171b26] hover:bg-[var(--lt-primary-strong)]"
                >
                  <span className="material-symbols-outlined">play_arrow</span>
                  Resume lesson
                </Link>
                <Link
                  to={`/course/${resumeCourse.id}`}
                  className="flex items-center gap-2 rounded-lg bg-[var(--lt-surface-high)] px-4 py-3 text-sm font-bold hover:bg-[var(--lt-surface-highest)]"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    menu_book
                  </span>
                  Course syllabus
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
      <section>
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold">
            My courses{' '}
            <span className="lt-mono text-sm text-[var(--lt-muted)]">
              {courses.length}
            </span>
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg bg-[var(--lt-surface)] p-1">
              {[
                ['all', 'All'],
                ['active', 'In progress'],
                ['completed', 'Completed'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setFilter(value as typeof filter)}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold ${filter === value ? 'bg-[var(--lt-surface-high)] text-[var(--lt-primary)]' : 'text-[var(--lt-muted)]'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-[var(--lt-border)] bg-[var(--lt-surface)] px-3 py-2">
              <span className="material-symbols-outlined text-[18px] text-[var(--lt-muted)]">
                filter_list
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter courses"
                className="w-32 bg-transparent text-sm outline-none placeholder:text-[var(--lt-muted)]"
              />
            </div>
          </div>
        </div>
        {courses.length === 0 ? (
          <div className="lt-panel-muted py-20 text-center">
            <span className="material-symbols-outlined text-6xl text-[var(--lt-primary)]">
              playlist_add
            </span>
            <h3 className="mt-4 font-['Plus_Jakarta_Sans'] text-xl font-bold">
              Build your first course
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--lt-muted)]">
              Add a YouTube video or playlist to create your focused learning
              library.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-6 rounded-lg bg-[var(--lt-rose-strong)] px-5 py-3 text-sm font-bold text-white"
            >
              Add by URL
            </button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleCourses.map((course) => (
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
      </section>
      <AddCourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCourses}
      />
      <SearchCourseModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSuccess={fetchCourses}
      />
    </div>
  );
};

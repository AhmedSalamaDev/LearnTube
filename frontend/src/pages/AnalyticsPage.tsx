import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Heatmap } from '../components/profile/Heatmap';
import { Spinner } from '../components/ui/Spinner';

interface HeatmapData {
  date: string;
  totalSeconds: number;
}

interface DashboardStats {
  totalWatchTimeSeconds: number;
  totalCourses: number;
  totalCompletedVideos: number;
}

interface Course {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  totalDurationSeconds: number;
}

interface CourseProgress {
  course: Course | null;
  totalWatchedSeconds: number;
  completedVideos: number;
  totalVideos: number;
  totalDurationSeconds: number;
}

interface ActivityItem {
  id: string;
  videoId: string;
  videoTitle: string | null;
  courseName: string | null;
  watchedSeconds: number;
  timestamp: string;
}

interface DayActivity {
  date: string;
  totalSeconds: number;
  videosWatched: number;
  activities: ActivityItem[];
}

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`));

const calculateStreak = (data: HeatmapData[]) => {
  const activeDates = new Set(
    data.filter((item) => item.totalSeconds > 0).map((item) => item.date),
  );
  let longest = 0;
  let current = 0;
  const sorted = [...activeDates].sort();
  sorted.forEach((date, index) => {
    const previous =
      index > 0 ? new Date(`${sorted[index - 1]}T12:00:00`) : null;
    const currentDate = new Date(`${date}T12:00:00`);
    if (
      previous &&
      (currentDate.getTime() - previous.getTime()) / 86400000 === 1
    )
      current += 1;
    else current = 1;
    longest = Math.max(longest, current);
  });
  return { activeDays: activeDates.size, longest };
};

export const AnalyticsPage = () => {
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from(
    { length: Math.max(1, currentYear - 2025 + 1) },
    (_, index) => currentYear - index,
  );
  const [year, setYear] = useState(currentYear);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayActivity, setDayActivity] = useState<DayActivity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDayLoading, setIsDayLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      setError('');
      try {
        const [statsResponse, heatmapResponse, coursesResponse] =
          await Promise.all([
            api.get('/activity/dashboard'),
            api.get(`/activity/heatmap?year=${year}`),
            api.get('/courses'),
          ]);
        const courses: Course[] = coursesResponse.data.courses || [];
        const progress = await Promise.all(
          courses.map(async (course) => {
            const response = await api.get(
              `/activity/course-progress/${course.id}`,
            );
            return { ...response.data, course } as CourseProgress;
          }),
        );
        setStats(statsResponse.data);
        setHeatmapData(heatmapResponse.data.data || []);
        setCourseProgress(progress);
      } catch (loadError) {
        console.error('Failed to load analytics:', loadError);
        setError('Failed to load analytics. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    loadAnalytics();
  }, [year]);

  const summary = useMemo(() => {
    const totalSeconds = heatmapData.reduce(
      (sum, item) => sum + item.totalSeconds,
      0,
    );
    const { activeDays, longest } = calculateStreak(heatmapData);
    const completedCourses = courseProgress.filter(
      (item) =>
        item.totalVideos > 0 && item.completedVideos >= item.totalVideos,
    ).length;
    const averageProgress =
      courseProgress.length > 0
        ? (courseProgress.reduce(
            (sum, item) =>
              sum +
              (item.totalDurationSeconds > 0
                ? item.totalWatchedSeconds / item.totalDurationSeconds
                : 0),
            0,
          ) /
            courseProgress.length) *
          100
        : 0;
    return {
      totalSeconds,
      activeDays,
      longest,
      completedCourses,
      averageProgress,
    };
  }, [courseProgress, heatmapData]);

  const handleDayClick = async (date: string) => {
    setSelectedDate(date);
    setIsDayLoading(true);
    try {
      const response = await api.get(`/activity/day-activity?date=${date}`);
      setDayActivity(response.data);
    } catch (dayError) {
      console.error('Failed to load day activity:', dayError);
      setDayActivity(null);
    } finally {
      setIsDayLoading(false);
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="mx-auto min-w-0 max-w-7xl space-y-6 overflow-x-hidden">
      <section className="flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="lt-label mb-2 flex items-center gap-2 text-[var(--lt-green)]">
            <span className="h-2 w-2 rounded-full bg-[var(--lt-green)]" />
            Learning intelligence
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-extrabold tracking-tight sm:text-4xl">
            Analytics
          </h1>
          <p className="mt-2 text-sm text-[var(--lt-muted)]">
            Understand your learning rhythm and course progress.
          </p>
        </div>
        <label className="flex w-fit items-center gap-2 rounded-lg border border-[var(--lt-border)] bg-[var(--lt-surface)] px-3 py-2 text-sm text-[var(--lt-muted)]">
          Year
          <select
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            className="bg-transparent font-semibold text-[var(--lt-text)] outline-none"
          >
            {availableYears.map((availableYear) => (
              <option key={availableYear} value={availableYear}>
                {availableYear}
              </option>
            ))}
          </select>
        </label>
      </section>
      {error && (
        <div className="rounded-lg border border-[#93000a] bg-[#93000a]/20 p-4 text-sm text-[var(--lt-rose)]">
          {error}
        </div>
      )}

      <section className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          [
            'schedule',
            'Total watch time',
            formatTime(stats?.totalWatchTimeSeconds || 0),
            'var(--lt-primary)',
          ],
          [
            'calendar_month',
            'Active days',
            String(summary.activeDays),
            'var(--lt-green)',
          ],
          [
            'task_alt',
            'Videos completed',
            String(stats?.totalCompletedVideos || 0),
            'var(--lt-green)',
          ],
          [
            'local_fire_department',
            'Longest streak',
            `${summary.longest} days`,
            'var(--lt-rose)',
          ],
          [
            'auto_stories',
            'Average course progress',
            `${Math.round(summary.averageProgress)}%`,
            'var(--lt-primary)',
          ],
        ].map(([icon, label, value, color]) => (
          <div key={label} className="lt-panel min-w-0 p-5">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--lt-muted)]">
              <span>{label}</span>
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ color }}
              >
                {' '}
                {icon}{' '}
              </span>
            </div>
            <p
              className="mt-4 font-['JetBrains_Mono'] text-2xl font-semibold"
              style={{ color }}
            >
              {value}
            </p>
          </div>
        ))}
      </section>

      <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="lt-panel min-w-0 overflow-hidden p-4 shadow-xl sm:p-5">
          <div className="mb-4 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-bold">
                Annual activity
              </h2>
              <p className="mt-1 text-sm text-[var(--lt-muted)]">
                Select a day to inspect the activity log.
              </p>
            </div>
            <span className="lt-mono text-xs text-[var(--lt-green)]">
              {summary.activeDays} active days
            </span>
          </div>
          <Heatmap data={heatmapData} year={year} onDayClick={handleDayClick} />
        </div>
        <div className="lt-panel min-w-0 p-5 shadow-xl">
          <div className="lt-label text-[var(--lt-primary)]">Selected day</div>
          {!selectedDate ? (
            <div className="flex min-h-48 flex-col items-center justify-center text-center text-sm text-[var(--lt-muted)]">
              <span className="material-symbols-outlined mb-3 text-4xl text-[var(--lt-primary)]">
                touch_app
              </span>
              Choose a day from the heatmap.
            </div>
          ) : isDayLoading ? (
            <div className="flex min-h-48 items-center justify-center text-sm text-[var(--lt-muted)]">
              Loading activity...
            </div>
          ) : dayActivity ? (
            <div className="mt-4">
              <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-bold">
                {formatDate(dayActivity.date)}
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-[var(--lt-surface)] p-3">
                  <span className="lt-label">Study time</span>
                  <p className="mt-1 font-semibold text-[var(--lt-green)]">
                    {formatTime(dayActivity.totalSeconds)}
                  </p>
                </div>
                <div className="rounded-lg bg-[var(--lt-surface)] p-3">
                  <span className="lt-label">Videos</span>
                  <p className="mt-1 font-semibold text-[var(--lt-primary)]">
                    {dayActivity.videosWatched}
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-2">
                {dayActivity.activities.length === 0 ? (
                  <p className="text-sm text-[var(--lt-muted)]">
                    No recorded activity for this day.
                  </p>
                ) : (
                  dayActivity.activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="rounded-lg bg-[var(--lt-surface)] p-3"
                    >
                      <p className="truncate text-sm font-semibold">
                        {activity.videoTitle || 'Untitled video'}
                      </p>
                      <p className="mt-1 truncate text-xs text-[var(--lt-muted)]">
                        {activity.courseName || 'Unknown course'} ·{' '}
                        {formatTime(activity.watchedSeconds)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[var(--lt-rose)]">
              Unable to load this day.
            </p>
          )}
        </div>
      </section>

      <section className="lt-panel min-w-0 overflow-hidden shadow-xl">
        <div className="flex flex-col gap-2 border-b border-[var(--lt-border)] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-bold">
              Course performance
            </h2>
            <p className="mt-1 text-sm text-[var(--lt-muted)]">
              A detailed view of every course in your library.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="text-sm font-semibold text-[var(--lt-primary)] hover:underline"
          >
            Open library
          </Link>
        </div>
        <div className="divide-y divide-[var(--lt-border)]">
          {courseProgress.length === 0 ? (
            <p className="p-8 text-center text-sm text-[var(--lt-muted)]">
              Add a course to start building analytics.
            </p>
          ) : (
            courseProgress.map((item) => {
              const percentage =
                item.totalDurationSeconds > 0
                  ? Math.min(
                      100,
                      (item.totalWatchedSeconds / item.totalDurationSeconds) *
                        100,
                    )
                  : 0;
              return (
                <div
                  key={item.course?.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
                >
                  <div className="h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-[var(--lt-surface)]">
                    {item.course?.thumbnailUrl ? (
                      <img
                        src={item.course.thumbnailUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="material-symbols-outlined text-[var(--lt-primary)]">
                          school
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-3">
                      <h3 className="truncate font-semibold">
                        {item.course?.title || 'Untitled course'}
                      </h3>
                      <span className="lt-mono shrink-0 text-xs text-[var(--lt-green)]">
                        {Math.round(percentage)}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-[var(--lt-surface-highest)]">
                      <div
                        className="h-full rounded-full bg-[var(--lt-green)]"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-[var(--lt-muted)]">
                      {item.completedVideos} of {item.totalVideos} videos
                      completed · {formatTime(item.totalWatchedSeconds)} watched
                    </p>
                  </div>
                  <Link
                    to={`/course/${item.course?.id}`}
                    className="flex items-center justify-center gap-1 rounded-lg bg-[var(--lt-surface-high)] px-3 py-2 text-sm font-semibold hover:bg-[var(--lt-surface-highest)]"
                  >
                    <span className="material-symbols-outlined text-[17px]">
                      open_in_new
                    </span>
                    View
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};

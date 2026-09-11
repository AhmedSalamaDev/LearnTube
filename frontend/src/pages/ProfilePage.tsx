import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/ui/Spinner';

interface DashboardStats {
  totalWatchTimeSeconds: number;
  totalCourses: number;
  totalCompletedVideos: number;
}

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

export const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get('/activity/dashboard')
      .then((response) => setStats(response.data))
      .catch((error) => console.error('Failed to fetch profile data:', error))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <Spinner />;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="lt-panel flex flex-col justify-between gap-6 p-6 shadow-xl sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="h-20 w-20 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--lt-primary)] text-3xl font-bold text-[#171b26]">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="lt-label mb-2 text-[var(--lt-green)]">
              Learner account
            </div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold">
              {user?.name}
            </h1>
            <p className="mt-1 text-sm text-[var(--lt-muted)]">{user?.email}</p>
            <span
              className={`mt-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${user?.emailVerified ? 'bg-[var(--lt-green)]/15 text-[var(--lt-green)]' : 'bg-[var(--lt-rose)]/15 text-[var(--lt-rose)]'}`}
            >
              <span className="material-symbols-outlined text-[15px]">
                {user?.emailVerified ? 'verified' : 'warning'}
              </span>
              {user?.emailVerified
                ? 'Verified email'
                : 'Email verification required'}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/profile/security"
            className="flex items-center gap-2 rounded-lg bg-[var(--lt-surface-high)] px-4 py-2.5 text-sm font-semibold hover:bg-[var(--lt-surface-highest)]"
          >
            <span className="material-symbols-outlined text-[18px]">
              security
            </span>
            {user?.hasPassword ? 'Change password' : 'Set password'}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg bg-[#93000a]/20 px-4 py-2.5 text-sm font-semibold text-[var(--lt-rose)] hover:bg-[#93000a]/30"
          >
            <span className="material-symbols-outlined text-[18px]">
              logout
            </span>
            Log out
          </button>
        </div>
      </section>
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <div className="lt-label text-[var(--lt-primary)]">At a glance</div>
            <h2 className="mt-1 font-['Plus_Jakarta_Sans'] text-2xl font-bold">
              Your learning summary
            </h2>
          </div>
          <Link
            to="/analytics"
            className="text-sm font-semibold text-[var(--lt-primary)] hover:underline"
          >
            View full analytics
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [
              'schedule',
              'Total watch time',
              formatTime(stats?.totalWatchTimeSeconds || 0),
              'var(--lt-primary)',
            ],
            [
              'auto_stories',
              'Courses',
              String(stats?.totalCourses || 0),
              'var(--lt-green)',
            ],
            [
              'task_alt',
              'Videos completed',
              String(stats?.totalCompletedVideos || 0),
              'var(--lt-rose)',
            ],
          ].map(([icon, label, value, color]) => (
            <div key={label} className="lt-panel p-5">
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
                className="mt-4 font-['JetBrains_Mono'] text-3xl font-semibold"
                style={{ color }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="lt-panel p-6">
        <div className="flex items-start gap-4">
          <span className="material-symbols-outlined text-3xl text-[var(--lt-primary)]">
            insights
          </span>
          <div>
            <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-bold">
              Keep your rhythm visible
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--lt-muted)]">
              Your detailed activity history, annual heatmap, daily study logs,
              and course performance now live in Analytics.
            </p>
            <Link
              to="/analytics"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--lt-primary)] hover:underline"
            >
              Open Analytics
              <span className="material-symbols-outlined text-[17px]">
                arrow_forward
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

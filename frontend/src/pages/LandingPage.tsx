import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const LandingPage = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="lt-page min-h-screen" />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="lt-page">
      <header className="border-b border-[var(--lt-border)] bg-[rgba(15,19,29,0.78)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[26px] text-[var(--lt-primary)]">
              school
            </span>
            <span className="font-['Plus_Jakarta_Sans'] text-xl font-bold">
              Learn<span className="text-[var(--lt-primary)]">Tube</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-3 py-2 text-sm font-semibold text-[var(--lt-muted)] hover:text-[var(--lt-text)]"
            >
              Log in
            </Link>
            <Link
              to="/login"
              className="rounded-lg bg-[var(--lt-rose-strong)] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[var(--lt-rose-strong)]/20 hover:brightness-110"
            >
              Start learning
            </Link>
          </div>
        </div>
      </header>
      <main>
        <section className="relative overflow-hidden px-4 pb-20 pt-20 sm:px-6 lg:px-8 lg:pt-28">
          <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-[var(--lt-primary-strong)]/10 blur-3xl" />
          <div className="relative mx-auto max-w-5xl text-center">
            <div className="lt-label mb-5 flex items-center justify-center gap-2 text-[var(--lt-green)]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--lt-green)]" />
              Distraction-free learning workspace
            </div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-4xl font-extrabold tracking-tight text-[var(--lt-text)] sm:text-6xl lg:text-7xl">
              Turn YouTube into a{' '}
              <span className="text-[var(--lt-primary)]">focused course.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[var(--lt-muted)] sm:text-lg">
              Organize videos into a linear curriculum, resume exactly where you
              stopped, and build a learning rhythm without algorithmic
              distractions.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-lg bg-[var(--lt-primary)] px-5 py-3 font-bold text-[#171b26] shadow-xl shadow-[var(--lt-primary)]/10 hover:bg-[var(--lt-primary-strong)]"
              >
                <span className="material-symbols-outlined">bolt</span>Start
                learning free
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-lg bg-[var(--lt-surface-high)] px-5 py-3 font-bold text-[var(--lt-text)] hover:bg-[var(--lt-surface-highest)]"
              >
                <span className="material-symbols-outlined">login</span>Log in
                to resume
              </Link>
            </div>
          </div>
          <div className="relative mx-auto mt-16 max-w-6xl rounded-2xl border border-[var(--lt-border)] bg-[var(--lt-surface-low)] p-2 shadow-2xl shadow-black/30">
            <div className="grid overflow-hidden rounded-xl border border-[var(--lt-border)] bg-[var(--lt-background)] lg:grid-cols-12">
              <div className="min-h-[270px] p-6 lg:col-span-8">
                <div className="flex items-center justify-between">
                  <span className="lt-label text-[var(--lt-green)]">
                    Live checkpoint
                  </span>
                  <span className="lt-mono text-xs text-[var(--lt-muted)]">
                    14:29 / 31:18
                  </span>
                </div>
                <div className="mt-8 flex aspect-video items-center justify-center rounded-xl bg-gradient-to-br from-[#171b26] via-[#262a35] to-[#171b26]">
                  <span className="material-symbols-outlined text-6xl text-[var(--lt-primary)]">
                    play_circle
                  </span>
                </div>
              </div>
              <div className="border-t border-[var(--lt-border)] bg-[var(--lt-surface)] p-5 lg:col-span-4 lg:border-l lg:border-t-0">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="lt-label">Course progress</div>
                    <div className="mt-1 text-lg font-bold">
                      Distributed Systems
                    </div>
                  </div>
                  <span className="lt-mono text-sm text-[var(--lt-green)]">
                    68%
                  </span>
                </div>
                <div className="mt-4 h-2 rounded-full bg-[var(--lt-surface-highest)]">
                  <div className="h-full w-[68%] rounded-full bg-[var(--lt-green)]" />
                </div>
                <div className="mt-6 space-y-2">
                  {[
                    'Introduction & Principles',
                    'Design Patterns',
                    'Advanced Architecture Patterns',
                    'Scalability & Reliability',
                  ].map((title, index) => (
                    <div
                      key={title}
                      className={`flex items-center gap-3 rounded-lg p-3 text-sm ${index === 2 ? 'bg-[var(--lt-surface-high)] text-[var(--lt-primary)]' : 'text-[var(--lt-muted)]'}`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {index < 2
                          ? 'check_circle'
                          : index === 2
                            ? 'play_circle'
                            : 'radio_button_unchecked'}
                      </span>
                      {title}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="border-t border-[var(--lt-border)] bg-[var(--lt-surface)] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
            {[
              [
                'playlist_add',
                'Import your curriculum',
                'Add a YouTube video or playlist and turn it into a structured course.',
              ],
              [
                'history',
                'Resume your checkpoint',
                'Your watched time and video checkpoints stay attached to each lesson.',
              ],
              [
                'analytics',
                'See your learning rhythm',
                'Review course progress, completed videos, total watch time, and your activity heatmap.',
              ],
            ].map(([icon, title, copy]) => (
              <div key={title} className="lt-panel-muted p-6">
                <span className="material-symbols-outlined text-3xl text-[var(--lt-primary)]">
                  {icon}
                </span>
                <h2 className="mt-5 font-['Plus_Jakarta_Sans'] text-lg font-bold">
                  {title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--lt-muted)]">
                  {copy}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t border-[var(--lt-border)] px-4 py-8 text-center text-sm text-[var(--lt-muted)] flex flex-col items-center gap-4">
        <div>LearnTube · A focused home for your video learning.</div>
        <div className="flex gap-4">
          <Link
            to="/privacy"
            className="hover:text-[var(--lt-text)] transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms"
            className="hover:text-[var(--lt-text)] transition-colors"
          >
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
};

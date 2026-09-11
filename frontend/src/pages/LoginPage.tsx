import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';

const passwordRules = [
  ['10 characters minimum', (value: string) => value.length >= 10],
  ['One uppercase letter', (value: string) => /[A-Z]/.test(value)],
  ['One lowercase letter', (value: string) => /[a-z]/.test(value)],
  ['One number', (value: string) => /[0-9]/.test(value)],
  ['One symbol', (value: string) => /[^A-Za-z0-9]/.test(value)],
] as const;

export const LoginPage = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (isAuthLoading) {
    return <div className="lt-page min-h-screen" />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const selectMode = (loginMode: boolean) => {
    setIsLogin(loginMode);
    setError('');
    setSuccessMsg('');
  };

  const handleGoogleLogin = () => {
    const apiUrl =
      import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    window.location.href = `${apiUrl}/auth/google`;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const response = await api.post('/auth/login', { email, password });
        const tokens = response.data.data?.tokens;
        if (tokens) {
          localStorage.setItem('auth_token', tokens.accessToken);
          localStorage.setItem('refresh_token', tokens.refreshToken);
        }
        window.location.href = '/dashboard';
      } else {
        const response = await api.post('/auth/register', {
          name,
          email,
          password,
        });
        setSuccessMsg(
          response.data.data?.requiresEmailVerification
            ? 'Account created. Check your email to verify your account, then sign in.'
            : 'Account created. You can sign in now.',
        );
        setIsLogin(true);
        setPassword('');
      }
    } catch (requestError: any) {
      const response = requestError.response?.data;
      setError(
        response?.details?.join(' ') ||
          response?.error ||
          'Something went wrong. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="lt-page relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[28rem] w-[42rem] -translate-x-1/2 rounded-full bg-[var(--lt-primary-strong)]/10 blur-3xl" />
      <header className="relative z-10 border-b border-[var(--lt-border)] bg-[rgba(15,19,29,0.78)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[26px] text-[var(--lt-primary)]">
              school
            </span>
            <span className="font-['Plus_Jakarta_Sans'] text-xl font-bold tracking-tight">
              Learn<span className="text-[var(--lt-primary)]">Tube</span>
            </span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1 text-sm font-semibold text-[var(--lt-muted)] hover:text-[var(--lt-text)]"
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            Back home
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-4 py-20 sm:px-6 lg:py-28">
        <section className="lt-panel w-full max-w-xl p-7 shadow-2xl sm:p-10">
          <div className="mb-8 flex flex-col gap-5">
            <div>
              <div className="lt-label mb-2 text-[var(--lt-primary)]">
                Welcome back
              </div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold">
                {isLogin ? 'Sign in to LearnTube' : 'Create your account'}
              </h2>
              <p className="mt-2 text-sm text-[var(--lt-muted)]">
                {isLogin
                  ? 'Pick up your learning where you left off.'
                  : 'Start building a calmer learning library.'}
              </p>
            </div>
            <div className="flex w-full rounded-lg bg-[var(--lt-surface)] p-1">
              <button
                type="button"
                onClick={() => selectMode(true)}
                className={`flex-1 rounded-md px-3 py-2.5 text-xs font-bold ${isLogin ? 'bg-[var(--lt-surface-high)] text-[var(--lt-primary)]' : 'text-[var(--lt-muted)]'}`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => selectMode(false)}
                className={`flex-1 rounded-md px-3 py-2.5 text-xs font-bold ${!isLogin ? 'bg-[var(--lt-surface-high)] text-[var(--lt-primary)]' : 'text-[var(--lt-muted)]'}`}
              >
                Create account
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-[#93000a] bg-[#93000a]/20 p-3 text-sm text-[var(--lt-rose)]">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-5 rounded-lg border border-[var(--lt-green)]/30 bg-[var(--lt-green)]/10 p-3 text-sm text-[var(--lt-green)]">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <label className="block text-sm font-semibold">
                Name
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-[var(--lt-border)] bg-[var(--lt-surface)] px-4 py-3 font-normal outline-none focus:border-[var(--lt-primary)]"
                  required
                  disabled={isLoading}
                  placeholder="Your name"
                />
              </label>
            )}
            <label className="block text-sm font-semibold">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-lg border border-[var(--lt-border)] bg-[var(--lt-surface)] px-4 py-3 font-normal outline-none focus:border-[var(--lt-primary)]"
                required
                disabled={isLoading}
                placeholder="you@example.com"
              />
            </label>
            <label className="block text-sm font-semibold">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-lg border border-[var(--lt-border)] bg-[var(--lt-surface)] px-4 py-3 font-normal outline-none focus:border-[var(--lt-primary)]"
                required
                disabled={isLoading}
                placeholder="Enter your password"
              />
            </label>
            {!isLogin && (
              <div className="rounded-lg bg-[var(--lt-surface)] p-4">
                <div className="lt-label mb-3">Password requirements</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {passwordRules.map(([label, test]) => (
                    <span
                      key={label}
                      className={`flex items-center gap-1 text-xs ${test(password) ? 'text-[var(--lt-green)]' : 'text-[var(--lt-muted)]'}`}
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        {test(password)
                          ? 'check_circle'
                          : 'radio_button_unchecked'}
                      </span>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <Button
              type="submit"
              className="!w-full !rounded-lg !bg-[var(--lt-primary)] !py-3.5 !font-bold !text-[#171b26] hover:!bg-[var(--lt-primary-strong)]"
              isLoading={isLoading}
            >
              {isLogin ? 'Sign in' : 'Create account'}
              <span className="material-symbols-outlined ml-2 align-middle text-[18px]">
                arrow_forward
              </span>
            </Button>
          </form>

          {isLogin && (
            <Link
              to="/forgot-password"
              className="mt-5 block text-center text-sm font-semibold text-[var(--lt-primary)] hover:underline"
            >
              Forgot your password?
            </Link>
          )}
          <div className="my-7 flex items-center gap-3 text-xs uppercase tracking-widest text-[var(--lt-muted)]">
            <span className="h-px flex-1 bg-[var(--lt-border)]" />
            or continue with
            <span className="h-px flex-1 bg-[var(--lt-border)]" />
          </div>
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-[var(--lt-border)] bg-[var(--lt-surface-high)] px-4 py-3 text-sm font-semibold hover:bg-[var(--lt-surface-highest)]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
          <p className="mt-7 text-center text-xs leading-5 text-[var(--lt-muted)]">
            By continuing, you agree to use LearnTube as your focused learning
            workspace.
          </p>
        </section>
      </main>
    </div>
  );
};

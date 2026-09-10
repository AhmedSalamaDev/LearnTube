import { Navigate, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Spinner } from '../ui/Spinner';
import { Navbar } from './Navbar';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';

export const ProtectedLayout = () => {
  const { user, isLoading } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [errorMsg, setErrorMsg] = useState('');

  if (isLoading) {
    return <Spinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleResend = async () => {
    try {
      setIsResending(true);
      setResendStatus('idle');
      setErrorMsg('');
      await api.post('/auth/resend-verification', { email: user.email });
      setResendStatus('success');
    } catch (err: any) {
      setResendStatus('error');
      setErrorMsg(
        err.response?.data?.error || 'Failed to resend verification email',
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {!user.emailVerified ? (
          <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-xl shadow-md text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Please Verify Your Email
            </h2>
            <p className="text-gray-600 mb-8">
              We sent an email to{' '}
              <span className="font-semibold text-gray-800">{user.email}</span>.
              Please check your inbox and verify your email to access the app.
            </p>

            {resendStatus === 'success' && (
              <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                Verification email sent! Please check your inbox.
              </div>
            )}

            {resendStatus === 'error' && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {errorMsg}
              </div>
            )}

            <Button
              onClick={handleResend}
              isLoading={isResending}
              className="w-full"
            >
              Resend Verification Email
            </Button>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
};

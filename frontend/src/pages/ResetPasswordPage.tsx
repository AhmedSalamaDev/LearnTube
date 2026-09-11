import { FormEvent, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword,
      });
      setMessage(response.data.message);
      setTimeout(() => navigate('/login'), 1200);
    } catch (requestError: any) {
      const response = requestError.response?.data;
      setError(
        response?.details?.join(' ') ||
          response?.error ||
          'Unable to reset password.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Reset password
        </h1>
        <p className="text-gray-600 mb-6">
          Choose a new password for your LearnTube account.
        </p>
        {error && (
          <p className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </p>
        )}
        {message && (
          <p className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
            {message}
          </p>
        )}
        {!token && (
          <p className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            This reset link is missing its token.
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            New password
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={isLoading || !token}
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Confirm new password
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={isLoading || !token}
            />
          </label>
          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            disabled={!token}
          >
            Reset password
          </Button>
        </form>
        <Link
          to="/login"
          className="block mt-6 text-center text-sm text-blue-600 hover:text-blue-700"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
};

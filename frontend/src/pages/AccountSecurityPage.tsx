import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';

export const AccountSecurityPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const hasPassword = Boolean(user?.hasPassword);

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
      const response = hasPassword
        ? await api.post('/auth/change-password', {
            currentPassword,
            newPassword,
          })
        : await api.post('/auth/set-password', { newPassword });

      setMessage(response.data.message);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      setTimeout(() => navigate('/login'), 1200);
    } catch (requestError: any) {
      const response = requestError.response?.data;
      setError(
        response?.details?.join(' ') ||
          response?.error ||
          'Unable to update password.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <Link
          to="/profile"
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Back to profile
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-2">
          {hasPassword ? 'Change password' : 'Set a password'}
        </h1>
        <p className="text-gray-600 mb-6">
          Use at least 10 characters with uppercase, lowercase, a number, and a
          symbol.
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
        <form onSubmit={handleSubmit} className="space-y-4">
          {hasPassword && (
            <label className="block text-sm font-medium text-gray-700">
              Current password
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isLoading}
              />
            </label>
          )}
          <label className="block text-sm font-medium text-gray-700">
            New password
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </label>
          <Button type="submit" className="w-full" isLoading={isLoading}>
            {hasPassword ? 'Change password' : 'Set password'}
          </Button>
        </form>
      </div>
    </div>
  );
};

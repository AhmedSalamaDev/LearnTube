import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message);
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.error || 'Unable to send reset email.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Forgot password?
        </h1>
        <p className="text-gray-600 mb-6">
          Enter your email and we&apos;ll send you a password reset link.
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
          <label className="block text-sm font-medium text-gray-700">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={isLoading}
            />
          </label>
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Send reset link
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

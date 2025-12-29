import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getErrorMessage } from '@/lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await api.post('/api/v1/auth/forgot-password', { email });
      setIsSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-8">
        {/* Mobile Logo */}
        <div className="lg:hidden text-center">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary-600 flex items-center justify-center">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">CGraph</span>
          </Link>
        </div>

        {/* Success Message */}
        <div className="text-center lg:text-left">
          <div className="mx-auto lg:mx-0 w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
            <svg
              className="h-8 w-8 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white">Check your email</h2>
          <p className="mt-2 text-gray-400">
            We've sent a password reset link to <span className="text-white">{email}</span>
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-gray-400 text-sm">
            Didn't receive the email? Check your spam folder, or{' '}
            <button
              onClick={() => setIsSuccess(false)}
              className="text-primary-400 hover:text-primary-300 transition-colors"
            >
              try another email address
            </button>
          </p>

          <Link
            to="/login"
            className="block w-full py-3 px-4 bg-dark-800 hover:bg-dark-700 border border-dark-600 text-white font-medium rounded-lg transition-colors text-center"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Mobile Logo */}
      <div className="lg:hidden text-center">
        <Link to="/" className="inline-flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary-600 flex items-center justify-center">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <span className="text-2xl font-bold text-white">CGraph</span>
        </Link>
      </div>

      {/* Header */}
      <div className="text-center lg:text-left">
        <h2 className="text-3xl font-bold text-white">Forgot password?</h2>
        <p className="mt-2 text-gray-400">
          No worries, we'll send you reset instructions.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            placeholder="you@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Sending...
            </>
          ) : (
            'Reset password'
          )}
        </button>
      </form>

      {/* Back to Login */}
      <Link
        to="/login"
        className="flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to login
      </Link>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, getErrorMessage } from '@/lib/api';
import { LogoIcon } from '@/components/logo';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-dismiss error after 1.5 seconds
  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      setError(null);
    }, 1500);
    return () => clearTimeout(timer);
  }, [error]);

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
        <div className="text-center lg:hidden">
          <a href="https://www.cgraph.org" className="inline-flex items-center gap-3">
            <LogoIcon size={40} color="gradient" showGlow={false} />
            <span className="text-2xl font-bold text-white">CGraph</span>
          </a>
        </div>

        {/* Success Message */}
        <div className="text-center lg:text-left">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 lg:mx-0">
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
          <p className="text-sm text-gray-400">
            Didn't receive the email? Check your spam folder, or{' '}
            <button
              onClick={() => setIsSuccess(false)}
              className="text-primary-400 transition-colors hover:text-primary-300"
            >
              try another email address
            </button>
          </p>

          <Link
            to="/login"
            className="block w-full rounded-lg border border-dark-600 bg-dark-800 px-4 py-3 text-center font-medium text-white transition-colors hover:bg-dark-700"
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
      <div className="text-center lg:hidden">
        <a href="https://www.cgraph.org" className="inline-flex items-center gap-3">
          <LogoIcon size={40} color="gradient" showGlow={false} />
          <span className="text-2xl font-bold text-white">CGraph</span>
        </a>
      </div>

      {/* Header */}
      <div className="text-center lg:text-left">
        <h2 className="text-3xl font-bold text-white">Forgot password?</h2>
        <p className="mt-2 text-gray-400">No worries, we'll send you reset instructions.</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-300">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-lg border border-dark-600 bg-dark-800 px-4 py-3 text-white placeholder-gray-500 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="you@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-3 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
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
        className="flex items-center justify-center gap-2 text-gray-400 transition-colors hover:text-white"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to login
      </Link>
    </div>
  );
}

/**
 * Forgot Password Page for CGraph Landing
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthLayout } from './AuthLayout';

const WEB_APP_URL = import.meta.env.VITE_WEB_APP_URL || 'https://web.cgraph.org';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Call the web app's password reset endpoint
      const response = await fetch(`${WEB_APP_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send reset email');
      }

      setIsSubmitted(true);
    } catch (_err) {
      // Always show success to prevent email enumeration
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout title="Check your email" subtitle="We've sent you a password reset link">
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
              <svg
                className="h-8 w-8 text-emerald-400"
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
          </div>

          <p className="text-gray-400">
            If an account exists for <span className="font-medium text-white">{email}</span>, you'll
            receive an email with instructions to reset your password.
          </p>

          <div className="space-y-3 pt-4">
            <Link
              to="/login"
              className="block w-full rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-3 text-center font-semibold text-white transition-all hover:from-emerald-400 hover:to-cyan-400"
            >
              Back to sign in
            </Link>
            <button
              onClick={() => setIsSubmitted(false)}
              className="block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white transition-all hover:bg-white/10"
            >
              Try a different email
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset password" subtitle="Enter your email and we'll send you a reset link">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400"
          >
            {error}
          </motion.div>
        )}

        {/* Email Field */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-300">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 transition-all focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            placeholder="you@example.com"
          />
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-3 font-semibold text-white transition-all hover:from-emerald-400 hover:to-cyan-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Sending...
            </span>
          ) : (
            'Send reset link'
          )}
        </motion.button>

        {/* Back to Login */}
        <p className="text-center text-sm text-gray-400">
          Remember your password?{' '}
          <Link
            to="/login"
            className="font-medium text-emerald-400 transition-colors hover:text-emerald-300"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

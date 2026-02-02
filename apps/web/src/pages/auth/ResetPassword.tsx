/**
 * Reset Password Page
 *
 * Handles password reset with token validation.
 * Features strength meter and confirmation.
 *
 * @version 1.0.0
 * @since v0.9.2
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { GlassCard } from '@/shared/components/ui';

// =============================================================================
// TYPES
// =============================================================================

type ResetState = 'validating' | 'form' | 'success' | 'expired' | 'error';

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function calculatePasswordStrength(password: string): PasswordStrength {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;

  const labelMap = {
    0: { label: 'Very Weak', color: 'bg-red-500' },
    1: { label: 'Weak', color: 'bg-red-400' },
    2: { label: 'Fair', color: 'bg-orange-500' },
    3: { label: 'Good', color: 'bg-yellow-500' },
    4: { label: 'Strong', color: 'bg-green-500' },
    5: { label: 'Very Strong', color: 'bg-emerald-500' },
  } as const;

  const scoreKey = Math.min(Math.max(score, 0), 5) as 0 | 1 | 2 | 3 | 4 | 5;
  const scoreData = labelMap[scoreKey];

  return {
    score,
    label: scoreData.label,
    color: scoreData.color,
    requirements,
  };
}

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [state, setState] = useState<ResetState>('validating');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const strength = useMemo(() => calculatePasswordStrength(password), [password]);
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const canSubmit = strength.score >= 4 && passwordsMatch && !isLoading;

  // Validate token on mount
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setState('expired');
        return;
      }

      try {
        await api.post('/api/v1/auth/reset-password/validate', { token });
        setState('form');
      } catch (error: unknown) {
        const apiError = error as { response?: { status?: number } };
        if (apiError.response?.status === 410) {
          setState('expired');
        } else {
          setState('error');
          setErrorMessage('Unable to validate reset link. Please try again.');
        }
      }
    }

    validateToken();
  }, [token]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!canSubmit) return;

      setIsLoading(true);
      setErrorMessage('');

      try {
        await api.post('/api/v1/auth/reset-password/confirm', {
          token,
          password,
        });
        setState('success');
      } catch (error: unknown) {
        const apiError = error as { response?: { data?: { message?: string } } };
        setErrorMessage(
          apiError.response?.data?.message || 'Failed to reset password. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [canSubmit, token, password]
  );

  const renderValidating = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center py-8"
    >
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      <p className="mt-4 text-gray-400">Validating your reset link...</p>
    </motion.div>
  );

  const renderExpired = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="py-8 text-center"
    >
      <motion.div
        variants={itemVariants}
        className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20 text-red-400"
      >
        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </motion.div>

      <motion.h2 variants={itemVariants} className="mb-2 text-2xl font-bold text-white">
        Link Expired
      </motion.h2>

      <motion.p variants={itemVariants} className="mb-8 text-gray-400">
        This password reset link has expired or has already been used.
      </motion.p>

      <motion.div variants={itemVariants}>
        <Link
          to="/forgot-password"
          className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-600"
        >
          Request New Link
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </Link>
      </motion.div>
    </motion.div>
  );

  const renderSuccess = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="py-8 text-center"
    >
      <motion.div
        variants={itemVariants}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 text-green-400"
      >
        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </motion.div>

      <motion.h2 variants={itemVariants} className="mb-2 text-2xl font-bold text-white">
        Password Reset!
      </motion.h2>

      <motion.p variants={itemVariants} className="mb-8 text-gray-400">
        Your password has been successfully reset. You can now log in with your new password.
      </motion.p>

      <motion.div variants={itemVariants}>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 px-8 py-3 font-medium text-white shadow-lg shadow-primary-500/25 transition-all hover:scale-[1.02] hover:shadow-primary-500/40"
        >
          Continue to Login
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </button>
      </motion.div>
    </motion.div>
  );

  const renderForm = () => (
    <motion.form
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 text-white">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white">Create New Password</h2>
        <p className="mt-2 text-gray-400">Enter a strong password to secure your account</p>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400"
          >
            {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Password Field */}
      <motion.div variants={itemVariants}>
        <label className="mb-2 block text-sm font-medium text-gray-300">New Password</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
            className="w-full rounded-lg border border-dark-600 bg-dark-800/50 px-4 py-3 pr-12 text-white placeholder-gray-500 transition-all duration-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-300"
          >
            {showPassword ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Password Strength Meter */}
        {password && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3"
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-dark-700">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(strength.score / 5) * 100}%` }}
                  className={`h-full ${strength.color} transition-all duration-300`}
                />
              </div>
              <span className="text-xs font-medium text-gray-400">{strength.label}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { key: 'minLength', label: '8+ characters' },
                { key: 'hasUppercase', label: 'Uppercase letter' },
                { key: 'hasLowercase', label: 'Lowercase letter' },
                { key: 'hasNumber', label: 'Number' },
                { key: 'hasSpecial', label: 'Special character' },
              ].map(({ key, label }) => (
                <div
                  key={key}
                  className={`flex items-center gap-1 ${
                    strength.requirements[key as keyof typeof strength.requirements]
                      ? 'text-green-400'
                      : 'text-gray-500'
                  }`}
                >
                  {strength.requirements[key as keyof typeof strength.requirements] ? (
                    <svg
                      className="h-3.5 w-3.5"
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
                  ) : (
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01"
                      />
                    </svg>
                  )}
                  {label}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Confirm Password Field */}
      <motion.div variants={itemVariants}>
        <label className="mb-2 block text-sm font-medium text-gray-300">Confirm Password</label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className={`w-full rounded-lg border bg-dark-800/50 px-4 py-3 pr-12 text-white placeholder-gray-500 transition-all duration-200 ${
              confirmPassword
                ? passwordsMatch
                  ? 'border-green-500 focus:ring-green-500'
                  : 'border-red-500 focus:ring-red-500'
                : 'border-dark-600 focus:border-primary-500 focus:ring-primary-500'
            } focus:ring-1`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-300"
          >
            {showConfirmPassword ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        </div>
        {confirmPassword && !passwordsMatch && (
          <p className="mt-1 text-sm text-red-400">Passwords do not match</p>
        )}
      </motion.div>

      {/* Submit Button */}
      <motion.div variants={itemVariants}>
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 py-3 font-medium text-white shadow-lg shadow-primary-500/25 transition-all duration-200 hover:scale-[1.02] hover:shadow-primary-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {isLoading ? (
            <>
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Resetting Password...
            </>
          ) : (
            <>
              Reset Password
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </>
          )}
        </button>
      </motion.div>

      {/* Back to Login */}
      <motion.div variants={itemVariants} className="text-center">
        <Link
          to="/login"
          className="text-sm text-gray-400 transition-colors hover:text-primary-400"
        >
          Remember your password? Sign in
        </Link>
      </motion.div>
    </motion.form>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-4">
      {/* Animated Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="bg-gradient-radial absolute -right-1/2 -top-1/2 h-full w-full rounded-full from-primary-500/10 to-transparent" />
        <div className="bg-gradient-radial absolute -bottom-1/2 -left-1/2 h-full w-full rounded-full from-purple-500/10 to-transparent" />
      </div>

      <GlassCard variant="frosted" className="relative z-10 w-full max-w-md" hover3D={false}>
        <div className="p-8">
          {state === 'validating' && renderValidating()}
          {state === 'expired' && renderExpired()}
          {state === 'error' && renderExpired()}
          {state === 'success' && renderSuccess()}
          {state === 'form' && renderForm()}
        </div>
      </GlassCard>
    </div>
  );
}

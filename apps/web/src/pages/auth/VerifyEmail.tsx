/**
 * Email Verification Page
 *
 * Handles email verification token processing.
 * Shows success/error states with appropriate actions.
 *
 * @version 1.0.0
 * @since v0.9.2
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuthStore } from '@/modules/auth/store';
import { GlassCard } from '@/shared/components/ui';

// =============================================================================
// TYPES
// =============================================================================

type VerificationState = 'verifying' | 'success' | 'expired' | 'error' | 'already-verified';

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { user, checkAuth } = useAuthStore();

  const [state, setState] = useState<VerificationState>('verifying');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Verify token on mount
  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setState('error');
        return;
      }

      try {
        const response = await api.post('/api/v1/auth/verify-email', { token });

        if (response.data.already_verified) {
          setState('already-verified');
        } else {
          setState('success');
          // Refresh user data to update email_verified status
          await checkAuth?.();
        }
      } catch (error: unknown) {
        const apiError = error as { response?: { status?: number } };
        if (apiError.response?.status === 410) {
          setState('expired');
        } else {
          setState('error');
        }
      }
    }

    verifyToken();
  }, [token, checkAuth]);

  // Resend verification email
  const handleResend = useCallback(async () => {
    if (!user?.email) return;

    setIsResending(true);
    try {
      await api.post('/api/v1/auth/resend-verification', {
        email: user.email,
      });
      setResendSuccess(true);
    } catch {
      // Silently fail - we don't want to reveal if email exists
    } finally {
      setIsResending(false);
    }
  }, [user?.email]);

  const renderContent = () => {
    switch (state) {
      case 'verifying':
        return (
          <div className="flex flex-col items-center py-12">
            <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
            <p className="text-gray-400">Verifying your email...</p>
          </div>
        );

      case 'success':
        return (
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
              className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-green-500/20 text-green-400"
            >
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </motion.div>

            <motion.h2 variants={itemVariants} className="mb-2 text-2xl font-bold text-white">
              Email Verified!
            </motion.h2>

            <motion.p variants={itemVariants} className="mb-8 text-gray-400">
              Your email has been successfully verified. You now have full access to all features.
            </motion.p>

            <motion.div variants={itemVariants} className="space-y-3">
              <button
                type="button"
                onClick={() => navigate('/messages')}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 py-3 font-medium text-white shadow-lg shadow-primary-500/25 transition-all hover:scale-[1.02] hover:shadow-primary-500/40"
              >
                Continue to App
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

      case 'already-verified':
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="py-8 text-center"
          >
            <motion.div
              variants={itemVariants}
              className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/20 text-blue-400"
            >
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </motion.div>

            <motion.h2 variants={itemVariants} className="mb-2 text-2xl font-bold text-white">
              Already Verified
            </motion.h2>

            <motion.p variants={itemVariants} className="mb-8 text-gray-400">
              Your email has already been verified. You&apos;re all set!
            </motion.p>

            <motion.button
              variants={itemVariants}
              onClick={() => navigate('/messages')}
              className="rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 px-8 py-3 font-medium text-white shadow-lg shadow-primary-500/25 transition-all hover:scale-[1.02] hover:shadow-primary-500/40"
            >
              Go to App
            </motion.button>
          </motion.div>
        );

      case 'expired':
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="py-8 text-center"
          >
            <motion.div
              variants={itemVariants}
              className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-400"
            >
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </motion.div>

            <motion.h2 variants={itemVariants} className="mb-2 text-2xl font-bold text-white">
              Link Expired
            </motion.h2>

            <motion.p variants={itemVariants} className="mb-8 text-gray-400">
              This verification link has expired. Request a new one to verify your email.
            </motion.p>

            <motion.div variants={itemVariants} className="space-y-3">
              {resendSuccess ? (
                <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-green-400">
                  <p className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    New verification email sent!
                  </p>
                  <p className="mt-1 text-sm text-green-400/70">
                    Check your inbox for the new link.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 py-3 font-medium text-white shadow-lg shadow-primary-500/25 transition-all hover:scale-[1.02] hover:shadow-primary-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isResending ? (
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
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-5 w-5"
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
                      Resend Verification Email
                    </>
                  )}
                </button>
              )}

              <Link
                to="/login"
                className="block py-2 text-gray-400 transition-colors hover:text-white"
              >
                Back to Login
              </Link>
            </motion.div>
          </motion.div>
        );

      case 'error':
      default:
        return (
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
              Verification Failed
            </motion.h2>

            <motion.p variants={itemVariants} className="mb-8 text-gray-400">
              We couldn&apos;t verify your email. The link may be invalid or corrupted.
            </motion.p>

            <motion.div variants={itemVariants} className="space-y-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-600"
              >
                Back to Login
              </Link>
            </motion.div>
          </motion.div>
        );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-4">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="bg-gradient-radial absolute -right-1/2 -top-1/2 h-full w-full rounded-full from-primary-500/10 to-transparent" />
        <div className="bg-gradient-radial absolute -bottom-1/2 -left-1/2 h-full w-full rounded-full from-purple-500/10 to-transparent" />
      </div>

      <GlassCard variant="frosted" className="relative z-10 w-full max-w-md" hover3D={false}>
        <div className="p-8">
          {/* Logo */}
          <div className="mb-6 text-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-purple-600">
                <span className="text-xl font-bold text-white">C</span>
              </div>
              <span className="text-xl font-bold text-white">CGraph</span>
            </Link>
          </div>

          {renderContent()}
        </div>
      </GlassCard>
    </div>
  );
}

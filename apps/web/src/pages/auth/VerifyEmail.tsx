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
import { useAuthStore } from '@/stores/authStore';
import GlassCard from '@/components/ui/GlassCard';

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
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent 
                          rounded-full animate-spin mb-4" />
            <p className="text-gray-400">Verifying your email...</p>
          </div>
        );

      case 'success':
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center py-8"
          >
            <motion.div
              variants={itemVariants}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              className="inline-flex items-center justify-center w-24 h-24 rounded-full 
                       bg-green-500/20 text-green-400 mb-6"
            >
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>

            <motion.h2 variants={itemVariants} className="text-2xl font-bold text-white mb-2">
              Email Verified!
            </motion.h2>

            <motion.p variants={itemVariants} className="text-gray-400 mb-8">
              Your email has been successfully verified. You now have full access to all features.
            </motion.p>

            <motion.div variants={itemVariants} className="space-y-3">
              <button
                type="button"
                onClick={() => navigate('/messages')}
                className="w-full py-3 bg-gradient-to-r from-primary-500 to-purple-600 
                         text-white font-medium rounded-xl shadow-lg shadow-primary-500/25
                         hover:shadow-primary-500/40 hover:scale-[1.02] transition-all
                         flex items-center justify-center gap-2"
              >
                Continue to App
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
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
            className="text-center py-8"
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full 
                       bg-blue-500/20 text-blue-400 mb-6"
            >
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.div>

            <motion.h2 variants={itemVariants} className="text-2xl font-bold text-white mb-2">
              Already Verified
            </motion.h2>

            <motion.p variants={itemVariants} className="text-gray-400 mb-8">
              Your email has already been verified. You&apos;re all set!
            </motion.p>

            <motion.button
              variants={itemVariants}
              onClick={() => navigate('/messages')}
              className="px-8 py-3 bg-gradient-to-r from-primary-500 to-purple-600 
                       text-white font-medium rounded-xl shadow-lg shadow-primary-500/25
                       hover:shadow-primary-500/40 hover:scale-[1.02] transition-all"
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
            className="text-center py-8"
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full 
                       bg-yellow-500/20 text-yellow-400 mb-6"
            >
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.div>

            <motion.h2 variants={itemVariants} className="text-2xl font-bold text-white mb-2">
              Link Expired
            </motion.h2>

            <motion.p variants={itemVariants} className="text-gray-400 mb-8">
              This verification link has expired. Request a new one to verify your email.
            </motion.p>

            <motion.div variants={itemVariants} className="space-y-3">
              {resendSuccess ? (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400">
                  <p className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    New verification email sent!
                  </p>
                  <p className="text-sm text-green-400/70 mt-1">
                    Check your inbox for the new link.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="w-full py-3 bg-gradient-to-r from-primary-500 to-purple-600 
                           text-white font-medium rounded-xl shadow-lg shadow-primary-500/25
                           hover:shadow-primary-500/40 hover:scale-[1.02] transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
                >
                  {isResending ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Resend Verification Email
                    </>
                  )}
                </button>
              )}

              <Link
                to="/login"
                className="block py-2 text-gray-400 hover:text-white transition-colors"
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
            className="text-center py-8"
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full 
                       bg-red-500/20 text-red-400 mb-6"
            >
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.div>

            <motion.h2 variants={itemVariants} className="text-2xl font-bold text-white mb-2">
              Verification Failed
            </motion.h2>

            <motion.p variants={itemVariants} className="text-gray-400 mb-8">
              We couldn&apos;t verify your email. The link may be invalid or corrupted.
            </motion.p>

            <motion.div variants={itemVariants} className="space-y-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 
                         text-white font-medium rounded-xl hover:bg-primary-600 transition-colors"
              >
                Back to Login
              </Link>
            </motion.div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 
                  flex items-center justify-center p-4">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full 
                      bg-gradient-radial from-primary-500/10 to-transparent rounded-full" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full 
                      bg-gradient-radial from-purple-500/10 to-transparent rounded-full" />
      </div>

      <GlassCard variant="frosted" className="w-full max-w-md relative z-10" hover3D={false}>
        <div className="p-8">
          {/* Logo */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 
                            flex items-center justify-center">
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

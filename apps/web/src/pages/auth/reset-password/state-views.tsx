/**
 * Reset Password State Views
 *
 * Different UI states for the password reset flow.
 */

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { containerVariants, itemVariants } from './utils';
import { springs } from '@/lib/animation-presets/presets';

/**
 * Validating spinner while checking token
 */
export function ValidatingView() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center py-8"
    >
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      <p className="mt-4 text-gray-400">Validating your reset link...</p>
    </motion.div>
  );
}

/**
 * Expired or invalid token view
 */
export function ExpiredView() {
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
}

interface SuccessViewProps {
  onContinue: () => void;
}

/**
 * Successful password reset view
 */
export function SuccessView({ onContinue }: SuccessViewProps) {
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
        transition={{ ...springs.wobbly, delay: 0.2 }}
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
          onClick={onContinue}
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
}

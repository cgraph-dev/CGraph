/**
 * Animated error alert for auth pages.
 *
 * @module pages/auth/register/AuthErrorAlert
 */

import { motion } from 'motion/react';

interface AuthErrorAlertProps {
  error: string | { message?: string } | null;
}

/**
 * unknown for the auth module.
 */
/**
 * Auth Error Alert — fallback UI for error states.
 */
export function AuthErrorAlert({ error }: AuthErrorAlertProps) {
  if (!error) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 shadow-lg shadow-red-500/10 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2">
        <svg
          className="h-5 w-5 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {typeof error === 'string' ? error : error?.message || 'An error occurred'}
      </div>
    </motion.div>
  );
}

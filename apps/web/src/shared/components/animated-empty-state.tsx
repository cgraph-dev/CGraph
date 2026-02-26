/**
 * AnimatedEmptyState & AnimatedErrorState
 *
 * Reusable animated states for empty lists, search results, and error screens.
 * Uses framer-motion for fade-in + spring illustrations.
 *
 * @module shared/components/AnimatedEmptyState
 */

import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { springs } from '@/lib/animation-presets';
import type { ReactNode } from 'react';

// ── Animation Variants ─────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const fadeUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.default,
  },
};

const illustrationVariant = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springs.smooth,
  },
};

const shakeVariant: Variants = {
  hidden: { opacity: 0, x: 0 },
  visible: {
    opacity: 1,
    x: [0, -8, 8, -6, 6, -3, 3, 0],
    transition: { duration: 0.6, ease: 'easeOut' as const },
  },
};

// ── Built-in Icons ─────────────────────────────────────────────────────

function EmptyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="2" opacity="0.2" />
      <path
        d="M28 44c0-6.627 5.373-12 12-12s12 5.373 12 12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <circle cx="32" cy="34" r="2.5" fill="currentColor" opacity="0.4" />
      <circle cx="48" cy="34" r="2.5" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="2" opacity="0.2" />
      <path
        d="M40 24v20"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />
      <circle cx="40" cy="52" r="2.5" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="36" cy="36" r="18" stroke="currentColor" strokeWidth="2.5" opacity="0.3" />
      <path
        d="M49 49l12 12"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.3"
      />
      <path
        d="M30 36h12M36 30v12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.15"
      />
    </svg>
  );
}

// ── Types ──────────────────────────────────────────────────────────────

type EmptyVariant = 'default' | 'search' | 'list' | 'inbox';

interface AnimatedEmptyStateProps {
  /** Main heading */
  title: string;
  /** Supporting description */
  description?: string;
  /** Visual variant */
  variant?: EmptyVariant;
  /** Custom icon/illustration */
  icon?: ReactNode;
  /** Optional action */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Extra CSS class */
  className?: string;
}

interface AnimatedErrorStateProps {
  /** Error heading */
  title?: string;
  /** Error description */
  description?: string;
  /** Retry callback */
  onRetry?: () => void;
  /** Custom icon */
  icon?: ReactNode;
  /** Extra CSS class */
  className?: string;
}

// ── AnimatedEmptyState ─────────────────────────────────────────────────

/**
 * unknown for the animated-empty-state.tsx module.
 */
/**
 * Animated Empty State — fallback UI for empty data states.
 */
export function AnimatedEmptyState({
  title,
  description,
  variant = 'default',
  icon,
  action,
  className = '',
}: AnimatedEmptyStateProps) {
  const defaultIcon =
    variant === 'search' ? (
      <SearchIcon className="h-20 w-20 text-gray-500" />
    ) : (
      <EmptyIcon className="h-20 w-20 text-gray-500" />
    );

  return (
    <motion.div
      className={`flex flex-col items-center justify-center px-6 py-16 text-center ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={illustrationVariant} className="mb-4">
        {icon || defaultIcon}
      </motion.div>

      <motion.h3 variants={fadeUpVariant} className="mb-1 text-lg font-semibold text-gray-200">
        {title}
      </motion.h3>

      {description && (
        <motion.p variants={fadeUpVariant} className="mb-4 max-w-sm text-sm text-gray-400">
          {description}
        </motion.p>
      )}

      {action && (
        <motion.button
          variants={fadeUpVariant}
          onClick={action.onClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}

// ── AnimatedErrorState ─────────────────────────────────────────────────

/**
 * unknown for the animated-empty-state.tsx module.
 */
/**
 * Animated Error State — fallback UI for error states.
 */
export function AnimatedErrorState({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  onRetry,
  icon,
  className = '',
}: AnimatedErrorStateProps) {
  return (
    <motion.div
      className={`flex flex-col items-center justify-center px-6 py-16 text-center ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={shakeVariant} className="mb-4">
        {icon || <ErrorIcon className="h-20 w-20 text-red-400" />}
      </motion.div>

      <motion.h3 variants={fadeUpVariant} className="mb-1 text-lg font-semibold text-gray-200">
        {title}
      </motion.h3>

      <motion.p variants={fadeUpVariant} className="mb-4 max-w-sm text-sm text-gray-400">
        {description}
      </motion.p>

      {onRetry && (
        <motion.button
          variants={fadeUpVariant}
          onClick={onRetry}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          Try Again
        </motion.button>
      )}
    </motion.div>
  );
}

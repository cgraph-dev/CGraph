/**
 * Error state display component.
 * @module
 */
import { motion } from 'framer-motion';
import { staggerConfigs } from '@/lib/animation-presets/presets';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: staggerConfigs.standard.staggerChildren },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const errorIconVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: {
    opacity: 1,
    scale: 1,
    x: [0, -5, 5, -3, 3, 0],
    transition: { x: { duration: 0.4, delay: 0.3 }, scale: { duration: 0.3 } },
  },
};

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export default function ErrorState({
  title = 'Something went wrong',
  message = 'An error occurred while loading content. Please try again.',
  onRetry,
  retryLabel = 'Try Again',
  icon,
  className = '',
}: ErrorStateProps) {
  return (
    <motion.div
      role="alert"
      aria-live="polite"
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={errorIconVariants} className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
        {icon || <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />}
      </motion.div>
      <motion.h3 variants={itemVariants} className="text-lg font-semibold text-white mb-2">{title}</motion.h3>
      <motion.p variants={itemVariants} className="text-gray-400 text-sm max-w-md mb-6">{message}</motion.p>
      {onRetry && (
        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900"
          aria-label={retryLabel}
        >
          <ArrowPathIcon className="h-4 w-4" />
          <span>{retryLabel}</span>
        </motion.button>
      )}
    </motion.div>
  );
}

// Common error variants
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Network Error"
      message="Unable to connect to the server. Please check your internet connection."
      onRetry={onRetry}
    />
  );
}

export function NotFoundError({ type = 'Content' }: { type?: string }) {
  return (
    <ErrorState
      title={`${type} Not Found`}
      message={`The ${type.toLowerCase()} you're looking for doesn't exist or has been removed.`}
    />
  );
}

export function PermissionError() {
  return (
    <ErrorState
      title="Access Denied"
      message="You don't have permission to view this content."
    />
  );
}

export function RateLimitError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Rate Limited"
      message="You're making too many requests. Please wait a moment and try again."
      onRetry={onRetry}
      retryLabel="Try Again Later"
    />
  );
}

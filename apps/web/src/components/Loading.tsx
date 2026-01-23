/**
 * Loading Components
 *
 * For full-page loading states, use the LoadingSpinner component instead:
 * import { LoadingSpinner } from '@/components/LoadingSpinner';
 *
 * @since v0.9.5
 */

interface LoadingOverlayProps {
  message?: string;
}

/**
 * Overlay loading state for async operations.
 */
export function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <div className="animate-fadeIn absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
      <div className="animate-scaleIn text-center">
        <svg
          className="mx-auto mb-2 h-8 w-8 animate-spin text-indigo-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
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
        {message && <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>}
      </div>
    </div>
  );
}

/**
 * Skeleton loader for text content.
 */
export function SkeletonText({
  lines = 1,
  className = '',
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
          style={{ width: i === lines - 1 && lines > 1 ? '70%' : '100%' }}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton loader for avatars.
 */
export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={`${sizeClasses[size]} animate-pulse rounded-full bg-gray-200 dark:bg-gray-700`}
    />
  );
}

/**
 * Skeleton loader for message items in a list.
 */
export function SkeletonMessage() {
  return (
    <div className="flex items-start gap-3 p-4">
      <SkeletonAvatar />
      <div className="flex-1">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <SkeletonText lines={2} />
      </div>
    </div>
  );
}

/**
 * Skeleton loader for conversation list items.
 */
export function SkeletonConversation() {
  return (
    <div className="flex items-center gap-3 p-3">
      <SkeletonAvatar />
      <div className="min-w-0 flex-1">
        <div className="mb-2 h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="h-3 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

export default LoadingOverlay;

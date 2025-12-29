

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
}

/**
 * Reusable loading spinner component with multiple size and color variants.
 */
export function LoadingSpinner({ 
  size = 'md', 
  color = 'primary',
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const colorClasses = {
    primary: 'text-indigo-600',
    white: 'text-white',
    gray: 'text-gray-400',
  };

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
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
  );
}

interface LoadingScreenProps {
  message?: string;
}

/**
 * Full-screen loading state for initial app load or page transitions.
 */
export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400 text-sm">{message}</p>
      </div>
    </div>
  );
}

interface LoadingOverlayProps {
  message?: string;
}

/**
 * Overlay loading state for async operations.
 */
export function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-50">
      <div className="text-center">
        <LoadingSpinner size="md" className="mx-auto mb-2" />
        {message && (
          <p className="text-gray-600 dark:text-gray-400 text-sm">{message}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Skeleton loader for text content.
 */
export function SkeletonText({ 
  lines = 1, 
  className = '' 
}: { 
  lines?: number; 
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
          style={{ width: i === lines - 1 && lines > 1 ? '70%' : '100%' }}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton loader for avatars.
 */
export function SkeletonAvatar({ 
  size = 'md' 
}: { 
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse`} 
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
        <div className="flex items-center gap-2 mb-2">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
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
      <div className="flex-1 min-w-0">
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
        <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
      <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    </div>
  );
}

export default LoadingSpinner;

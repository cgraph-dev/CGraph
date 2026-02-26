/**
 * LoadingState component
 * @module modules/admin/components/forum-ordering-admin
 */

interface LoadingStateProps {
  className?: string;
}

/**
 * unknown for the admin module.
 */
/**
 * Loading State — loading placeholder.
 */
export function LoadingState({ className = '' }: LoadingStateProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
      ))}
    </div>
  );
}

/**
 * UserCardSkeleton - Loading placeholder for user cards / member lists.
 *
 * Renders a shimmer block mimicking avatar + name + status.
 * Use in friend lists, member panels, and user search results.
 *
 * @module components/ui/skeletons
 */

interface UserCardSkeletonProps {
  /** Number of skeleton cards to show */
  count?: number;
  /** Compact (inline) or full card variant */
  variant?: 'compact' | 'card';
  className?: string;
}

function SingleUserCardSkeleton({ variant = 'compact' }: { variant?: 'compact' | 'card' }) {
  if (variant === 'card') {
    return (
      <div className="animate-pulse rounded-xl border border-dark-700 bg-dark-800 p-4">
        {/* Banner */}
        <div className="mb-3 h-16 w-full rounded-lg bg-dark-700" />

        {/* Avatar */}
        <div className="-mt-8 ml-3 h-14 w-14 rounded-full border-4 border-dark-800 bg-dark-700" />

        {/* Name + role */}
        <div className="mt-2 space-y-1.5">
          <div className="h-4 w-28 rounded bg-dark-700" />
          <div className="h-3 w-20 rounded bg-dark-700" />
        </div>

        {/* Status */}
        <div className="mt-3 flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-dark-700" />
          <div className="h-3 w-16 rounded bg-dark-700" />
        </div>
      </div>
    );
  }

  // Compact (list row)
  return (
    <div className="flex animate-pulse items-center gap-3 px-3 py-2">
      {/* Avatar + status dot */}
      <div className="relative flex-shrink-0">
        <div className="h-9 w-9 rounded-full bg-dark-700" />
        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-dark-800 bg-dark-700" />
      </div>

      {/* Name + meta */}
      <div className="min-w-0 flex-1">
        <div className="h-3.5 w-24 rounded bg-dark-700" />
        <div className="mt-1 h-3 w-16 rounded bg-dark-700" />
      </div>
    </div>
  );
}

export function UserCardSkeleton({
  count = 5,
  variant = 'compact',
  className = '',
}: UserCardSkeletonProps) {
  return (
    <div className={variant === 'card' ? `grid grid-cols-2 gap-3 ${className}` : `space-y-1 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SingleUserCardSkeleton key={i} variant={variant} />
      ))}
    </div>
  );
}

export default UserCardSkeleton;

/**
 * LoadingSkeleton Component
 *
 * Animated loading placeholder for leaderboard list.
 */

/**
 * unknown for the community module.
 */
/**
 * Loading Skeleton — loading placeholder.
 */
export function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-4 rounded-lg bg-dark-700 p-4">
          <div className="h-8 w-8 rounded-full bg-dark-600"></div>
          <div className="h-10 w-10 rounded-full bg-dark-600"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-dark-600"></div>
            <div className="h-3 w-20 rounded bg-dark-600"></div>
          </div>
          <div className="h-6 w-16 rounded bg-dark-600"></div>
        </div>
      ))}
    </div>
  );
}

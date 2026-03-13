/**
 * ExploreSkeleton
 *
 * Loading placeholder for the explore/discover communities page.
 * Search bar + grid of community cards.
 *
 * @module components/ui/skeletons/ExploreSkeleton
 */

interface ExploreSkeletonProps {
  /** Number of community card skeletons */
  cardCount?: number;
  className?: string;
}

function CommunityCardSkeleton() {
  return (
    <div className="space-y-3 rounded-lg border border-dark-600 p-4">
      {/* Banner */}
      <div className="h-24 w-full animate-pulse rounded-lg bg-white/[0.06]" />
      {/* Avatar + name */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-full bg-white/[0.06]" />
        <div className="space-y-1.5">
          <div className="h-4 w-32 animate-pulse rounded bg-white/[0.06]" />
          <div className="h-3 w-20 animate-pulse rounded bg-white/[0.06]" />
        </div>
      </div>
      {/* Description */}
      <div className="space-y-1">
        <div className="h-3 w-full animate-pulse rounded bg-white/[0.06]" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-white/[0.06]" />
      </div>
      {/* Stats */}
      <div className="flex gap-4">
        <div className="h-3 w-16 animate-pulse rounded bg-white/[0.06]" />
        <div className="h-3 w-16 animate-pulse rounded bg-white/[0.06]" />
      </div>
    </div>
  );
}

/**
 * Skeleton for the explore/discover page.
 */
export function ExploreSkeleton({ cardCount = 6, className = '' }: ExploreSkeletonProps) {
  return (
    <div className={className}>
      {/* Header + search */}
      <div className="space-y-4 p-4">
        <div className="h-7 w-40 animate-pulse rounded bg-white/[0.06]" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-white/[0.06]" />
        {/* Category pills */}
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-7 w-20 animate-pulse rounded-full bg-white/[0.06]" />
          ))}
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cardCount }).map((_, i) => (
          <CommunityCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default ExploreSkeleton;

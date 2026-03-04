/**
 * ForumSkeleton
 *
 * Loading placeholder for forum board and thread list views.
 * Board header + repeating thread rows with title, stats, and meta.
 *
 * @module components/ui/skeletons/ForumSkeleton
 */

interface ForumSkeletonProps {
  threadCount?: number;
  className?: string;
}

function ThreadRowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-dark-600 px-4 py-3">
      <div className="h-9 w-9 flex-shrink-0 animate-pulse rounded-full bg-white/[0.06]" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-64 animate-pulse rounded bg-white/[0.06]" />
        <div className="flex gap-4">
          <div className="h-3 w-20 animate-pulse rounded bg-white/[0.06]" />
          <div className="h-3 w-16 animate-pulse rounded bg-white/[0.06]" />
          <div className="h-3 w-24 animate-pulse rounded bg-white/[0.06]" />
        </div>
      </div>
      <div className="flex gap-6">
        <div className="h-4 w-8 animate-pulse rounded bg-white/[0.06]" />
        <div className="h-4 w-8 animate-pulse rounded bg-white/[0.06]" />
      </div>
    </div>
  );
}

/**
 * Skeleton for the forum board / thread list page.
 */
export function ForumSkeleton({ threadCount = 6, className = '' }: ForumSkeletonProps) {
  return (
    <div className={className}>
      <div className="space-y-3 border-b border-dark-600 px-4 py-4">
        <div className="h-6 w-48 animate-pulse rounded bg-white/[0.06]" />
        <div className="h-3 w-80 animate-pulse rounded bg-white/[0.06]" />
        <div className="flex gap-2">
          <div className="h-7 w-24 animate-pulse rounded-full bg-white/[0.06]" />
          <div className="h-7 w-28 animate-pulse rounded-full bg-white/[0.06]" />
          <div className="h-7 w-20 animate-pulse rounded-full bg-white/[0.06]" />
        </div>
      </div>
      {Array.from({ length: threadCount }).map((_, i) => (
        <ThreadRowSkeleton key={i} />
      ))}
    </div>
  );
}

export default ForumSkeleton;

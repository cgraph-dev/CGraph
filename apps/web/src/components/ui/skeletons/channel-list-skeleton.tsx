/**
 * ChannelListSkeleton
 *
 * Loading placeholder for the channel/conversation list sidebar.
 * Renders repeating rows: avatar circle + name/message text lines.
 *
 * @module components/ui/skeletons/ChannelListSkeleton
 */

interface ChannelListSkeletonProps {
  /** Number of skeleton items to show */
  count?: number;
  className?: string;
}

function ChannelItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="h-10 w-10 flex-shrink-0 animate-pulse rounded-full bg-dark-700" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-28 animate-pulse rounded bg-dark-700" />
        <div className="h-3 w-44 animate-pulse rounded bg-dark-700" />
      </div>
      <div className="h-3 w-10 animate-pulse rounded bg-dark-700" />
    </div>
  );
}

/**
 * Skeleton placeholder for the channel list / sidebar.
 */
export function ChannelListSkeleton({
  count = 10,
  className = '',
}: ChannelListSkeletonProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="h-5 w-24 animate-pulse rounded bg-dark-700" />
        <div className="h-5 w-5 animate-pulse rounded bg-dark-700" />
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <ChannelItemSkeleton key={i} />
      ))}
    </div>
  );
}

export default ChannelListSkeleton;

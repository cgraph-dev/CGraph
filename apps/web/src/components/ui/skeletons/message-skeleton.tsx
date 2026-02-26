/**
 * MessageSkeleton - Loading placeholder for chat messages.
 *
 * Renders a shimmer block mimicking avatar + message bubble.
 * Use in MessageList during initial load or pagination.
 *
 * @module components/ui/skeletons
 */

interface MessageSkeletonProps {
  /** Number of skeleton messages to show */
  count?: number;
  /** If true, randomly alternate left/right alignment */
  alternating?: boolean;
  className?: string;
}

function SingleMessageSkeleton({ isOwn = false }: { isOwn?: boolean }) {
  return (
    <div className={`flex gap-3 px-4 py-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className="h-9 w-9 flex-shrink-0 animate-pulse rounded-full bg-dark-700" />

      {/* Bubble */}
      <div className={`flex max-w-[65%] flex-col gap-1.5 ${isOwn ? 'items-end' : ''}`}>
        {/* Username + timestamp */}
        <div className="flex items-center gap-2">
          <div className="h-3 w-20 animate-pulse rounded bg-dark-700" />
          <div className="h-3 w-12 animate-pulse rounded bg-dark-700" />
        </div>

        {/* Text lines */}
        <div className="space-y-1.5">
          <div className="h-3.5 w-48 animate-pulse rounded bg-dark-700" />
          <div className="h-3.5 w-36 animate-pulse rounded bg-dark-700" />
        </div>
      </div>
    </div>
  );
}

/**
 * unknown for the ui module.
 */
/**
 * Message Skeleton — loading placeholder.
 */
export function MessageSkeleton({
  count = 6,
  alternating = true,
  className = '',
}: MessageSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SingleMessageSkeleton key={i} isOwn={alternating && i % 3 === 1} />
      ))}
    </div>
  );
}

/** Convenience alias for list-level loading */
export function MessageListSkeleton({ count = 10 }: { count?: number }) {
  return <MessageSkeleton count={count} className="py-4" />;
}

export default MessageSkeleton;

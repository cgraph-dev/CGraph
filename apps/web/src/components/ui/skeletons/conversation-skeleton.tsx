/**
 * ConversationSkeleton
 *
 * Loading placeholder for the conversation/chat view.
 * Header bar + alternating message bubbles + input bar.
 *
 * @module components/ui/skeletons/ConversationSkeleton
 */

interface ConversationSkeletonProps {
  messageCount?: number;
  className?: string;
}

function MessageBubbleSkeleton({ isOwn = false }: { isOwn?: boolean }) {
  const widths = isOwn ? ['w-40', 'w-32'] : ['w-48', 'w-36'];
  return (
    <div className={`flex gap-3 px-4 py-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
      <div className="h-8 w-8 flex-shrink-0 animate-pulse rounded-full bg-dark-700" />
      <div className={`flex max-w-[65%] flex-col gap-1.5 ${isOwn ? 'items-end' : ''}`}>
        <div className="flex items-center gap-2">
          <div className="h-3 w-20 animate-pulse rounded bg-dark-700" />
          <div className="h-3 w-10 animate-pulse rounded bg-dark-700" />
        </div>
        <div className="space-y-1">
          <div className={`h-3.5 ${widths[0]} animate-pulse rounded bg-dark-700`} />
          <div className={`h-3.5 ${widths[1]} animate-pulse rounded bg-dark-700`} />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for the full conversation view: header, messages, input.
 */
export function ConversationSkeleton({
  messageCount = 8,
  className = '',
}: ConversationSkeletonProps) {
  return (
    <div className={`flex h-full flex-col ${className}`}>
      <div className="flex items-center gap-3 border-b border-dark-600 px-4 py-3">
        <div className="h-9 w-9 animate-pulse rounded-full bg-dark-700" />
        <div className="space-y-1.5">
          <div className="h-4 w-32 animate-pulse rounded bg-dark-700" />
          <div className="h-3 w-20 animate-pulse rounded bg-dark-700" />
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-hidden py-4">
        {Array.from({ length: messageCount }).map((_, i) => (
          <MessageBubbleSkeleton key={i} isOwn={i % 3 === 1} />
        ))}
      </div>
      <div className="border-t border-dark-600 px-4 py-3">
        <div className="h-10 w-full animate-pulse rounded-lg bg-dark-700" />
      </div>
    </div>
  );
}

export default ConversationSkeleton;

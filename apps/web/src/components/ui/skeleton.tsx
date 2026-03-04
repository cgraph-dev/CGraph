/**
 * Skeleton loading placeholder component.
 * @module
 */
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

/**
 * Skeleton - A loading placeholder component with shimmer animation.
 * 
 * Use for loading states to improve perceived performance.
 */
export default function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  lines = 1,
}: SkeletonProps) {
  const baseStyles = 'bg-white/[0.06] animate-pulse';

  const variantStyles = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {
    width: width || (variant === 'circular' ? height : '100%'),
    height: height || (variant === 'text' ? '1rem' : variant === 'circular' ? width : '100%'),
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseStyles} ${variantStyles[variant]}`}
            style={{
              ...style,
              width: i === lines - 1 ? '75%' : '100%',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={style}
    />
  );
}

// Post card skeleton
/**
 * unknown for the ui module.
 */
/**
 * Post Card Skeleton display component.
 */
export function PostCardSkeleton() {
  return (
    <div className="bg-white/[0.04] border border-white/[0.06] rounded-lg p-4 animate-pulse">
      <div className="flex gap-3">
        {/* Vote buttons skeleton */}
        <div className="flex flex-col items-center gap-1">
          <div className="h-6 w-6 bg-white/[0.06] rounded" />
          <div className="h-4 w-8 bg-white/[0.06] rounded" />
          <div className="h-6 w-6 bg-white/[0.06] rounded" />
        </div>
        
        {/* Content skeleton */}
        <div className="flex-1">
          {/* Meta */}
          <div className="flex items-center gap-2 mb-2">
            <div className="h-5 w-5 bg-white/[0.06] rounded-full" />
            <div className="h-4 w-24 bg-white/[0.06] rounded" />
            <div className="h-4 w-32 bg-white/[0.06] rounded" />
          </div>
          
          {/* Title */}
          <div className="h-6 w-3/4 bg-white/[0.06] rounded mb-2" />
          
          {/* Content preview */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-white/[0.06] rounded" />
            <div className="h-4 w-5/6 bg-white/[0.06] rounded" />
          </div>
          
          {/* Actions */}
          <div className="flex gap-4 mt-3">
            <div className="h-6 w-24 bg-white/[0.06] rounded" />
            <div className="h-6 w-16 bg-white/[0.06] rounded" />
            <div className="h-6 w-16 bg-white/[0.06] rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Forum card skeleton
/**
 * unknown for the ui module.
 */
/**
 * Forum Card Skeleton display component.
 */
export function ForumCardSkeleton() {
  return (
    <div className="bg-white/[0.04] border border-white/[0.06] rounded-lg p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 bg-white/[0.06] rounded-full" />
        <div className="flex-1">
          <div className="h-5 w-32 bg-white/[0.06] rounded mb-1" />
          <div className="h-4 w-48 bg-white/[0.06] rounded" />
        </div>
        <div className="h-8 w-20 bg-white/[0.06] rounded-full" />
      </div>
    </div>
  );
}

// Comment skeleton
/**
 * unknown for the ui module.
 */
/**
 * Comment Skeleton — loading placeholder.
 */
export function CommentSkeleton({ depth = 0 }: { depth?: number }) {
  return (
    <div className="animate-pulse" style={{ marginLeft: depth * 24 }}>
      <div className="flex gap-3">
        <div className="h-8 w-8 bg-white/[0.06] rounded-full" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-4 w-24 bg-white/[0.06] rounded" />
            <div className="h-4 w-20 bg-white/[0.06] rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-white/[0.06] rounded" />
            <div className="h-4 w-2/3 bg-white/[0.06] rounded" />
          </div>
          <div className="flex gap-4 mt-2">
            <div className="h-5 w-16 bg-white/[0.06] rounded" />
            <div className="h-5 w-12 bg-white/[0.06] rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Message bubble skeleton — mimics chat message layout
/**
 * unknown for the ui module.
 */
/**
 * Message Skeleton — loading placeholder.
 */
export function MessageSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex gap-3 px-4 py-2 animate-pulse">
      {!compact && <div className="h-10 w-10 shrink-0 bg-white/[0.06] rounded-full" />}
      <div className="flex-1 space-y-1.5">
        {!compact && (
          <div className="flex items-center gap-2">
            <div className="h-4 w-24 bg-white/[0.06] rounded" />
            <div className="h-3 w-16 bg-white/[0.04] rounded" />
          </div>
        )}
        <div className="space-y-1.5">
          <div className="h-4 w-full max-w-[320px] bg-white/[0.06] rounded" />
          <div className="h-4 w-3/4 max-w-[240px] bg-white/[0.06] rounded" />
        </div>
      </div>
    </div>
  );
}

// Multiple message skeletons for chat loading state
/**
 * unknown for the ui module.
 */
/**
 * Message List Skeleton component.
 */
export function MessageListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <MessageSkeleton key={i} compact={i > 0 && i % 3 !== 0} />
      ))}
    </div>
  );
}

// User card skeleton — for friend lists, member lists, search results
/**
 * unknown for the ui module.
 */
/**
 * User Card Skeleton display component.
 */
export function UserCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 animate-pulse">
      <div className="h-10 w-10 shrink-0 bg-white/[0.06] rounded-full" />
      <div className="flex-1 min-w-0">
        <div className="h-4 w-28 bg-white/[0.06] rounded mb-1" />
        <div className="h-3 w-20 bg-white/[0.04] rounded" />
      </div>
      <div className="h-2 w-2 bg-white/[0.06] rounded-full" />
    </div>
  );
}

// User card list skeleton
/**
 * unknown for the ui module.
 */
/**
 * User Card List Skeleton display component.
 */
export function UserCardListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <UserCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Conversation list item skeleton
/**
 * unknown for the ui module.
 */
/**
 * Conversation Item Skeleton — loading placeholder.
 */
export function ConversationItemSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-3 animate-pulse">
      <div className="h-12 w-12 shrink-0 bg-white/[0.06] rounded-full" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="h-4 w-32 bg-white/[0.06] rounded" />
          <div className="h-3 w-10 bg-white/[0.04] rounded" />
        </div>
        <div className="h-3.5 w-48 bg-white/[0.04] rounded" />
      </div>
    </div>
  );
}

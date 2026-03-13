/**
 * Skeleton loading placeholder component with shimmer animation.
 * @module
 */
import { cn } from '@/lib/utils';

type SkeletonShape = 'text' | 'avatar' | 'card' | 'message' | 'thumbnail';

interface SkeletonProps {
  className?: string;
  /** Legacy variant API — still supported */
  variant?: 'text' | 'circular' | 'rectangular';
  /** New shape API — Discord/Instagram patterns */
  shape?: SkeletonShape;
  width?: string | number;
  height?: string | number;
  lines?: number;
  /** Repeat count for shape-based skeletons */
  count?: number;
}

const shimmerClass =
  'relative overflow-hidden bg-white/[0.06] before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.04] before:to-transparent';

/**
 * Skeleton — loading placeholder with shimmer animation.
 */
export default function Skeleton({
  className = '',
  variant,
  shape,
  width,
  height,
  lines = 1,
  count = 1,
}: SkeletonProps) {
  // --- Shape-based API ---
  if (shape) {
    const items = Array.from({ length: count });
    return (
      <div className={cn('space-y-3', className)}>
        {items.map((_, i) => (
          <SkeletonShape key={i} shape={shape} />
        ))}
      </div>
    );
  }

  // --- Legacy variant API ---
  const variantStyles = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };
  const v = variant ?? 'rectangular';

  const style: React.CSSProperties = {
    width: width ?? (v === 'circular' ? height : '100%'),
    height: height ?? (v === 'text' ? '1rem' : v === 'circular' ? width : '100%'),
  };

  if (v === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(shimmerClass, variantStyles[v])}
            style={{ ...style, width: i === lines - 1 ? '75%' : '100%' }}
          />
        ))}
      </div>
    );
  }

  return <div className={cn(shimmerClass, variantStyles[v], className)} style={style} />;
}

function SkeletonShape({ shape }: { shape: SkeletonShape }) {
  switch (shape) {
    case 'text':
      return (
        <div className="space-y-1.5">
          <div className={cn(shimmerClass, 'h-3.5 w-full rounded')} />
          <div className={cn(shimmerClass, 'h-3.5 w-4/5 rounded')} />
          <div className={cn(shimmerClass, 'h-3.5 w-3/5 rounded')} />
        </div>
      );
    case 'avatar':
      return <div className={cn(shimmerClass, 'h-10 w-10 rounded-full')} />;
    case 'card':
      return <div className={cn(shimmerClass, 'h-24 w-full rounded-lg')} />;
    case 'message':
      return (
        <div className="flex gap-3 py-2">
          <div className={cn(shimmerClass, 'h-10 w-10 shrink-0 rounded-full')} />
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className={cn(shimmerClass, 'h-3.5 w-24 rounded')} />
              <div className={cn(shimmerClass, 'h-3 w-14 rounded')} />
            </div>
            <div className={cn(shimmerClass, 'h-3.5 w-full max-w-xs rounded')} />
            <div className={cn(shimmerClass, 'h-3.5 w-3/4 max-w-[200px] rounded')} />
          </div>
        </div>
      );
    case 'thumbnail':
      return <div className={cn(shimmerClass, 'aspect-video w-full rounded-lg')} />;
  }
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
    <div className="animate-pulse rounded-lg border border-white/[0.06] bg-white/[0.04] p-4">
      <div className="flex gap-3">
        {/* Vote buttons skeleton */}
        <div className="flex flex-col items-center gap-1">
          <div className="h-6 w-6 rounded bg-white/[0.06]" />
          <div className="h-4 w-8 rounded bg-white/[0.06]" />
          <div className="h-6 w-6 rounded bg-white/[0.06]" />
        </div>

        {/* Content skeleton */}
        <div className="flex-1">
          {/* Meta */}
          <div className="mb-2 flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-white/[0.06]" />
            <div className="h-4 w-24 rounded bg-white/[0.06]" />
            <div className="h-4 w-32 rounded bg-white/[0.06]" />
          </div>

          {/* Title */}
          <div className="mb-2 h-6 w-3/4 rounded bg-white/[0.06]" />

          {/* Content preview */}
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-white/[0.06]" />
            <div className="h-4 w-5/6 rounded bg-white/[0.06]" />
          </div>

          {/* Actions */}
          <div className="mt-3 flex gap-4">
            <div className="h-6 w-24 rounded bg-white/[0.06]" />
            <div className="h-6 w-16 rounded bg-white/[0.06]" />
            <div className="h-6 w-16 rounded bg-white/[0.06]" />
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
    <div className="animate-pulse rounded-lg border border-white/[0.06] bg-white/[0.04] p-4">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-white/[0.06]" />
        <div className="flex-1">
          <div className="mb-1 h-5 w-32 rounded bg-white/[0.06]" />
          <div className="h-4 w-48 rounded bg-white/[0.06]" />
        </div>
        <div className="h-8 w-20 rounded-full bg-white/[0.06]" />
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
        <div className="h-8 w-8 rounded-full bg-white/[0.06]" />
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-4 w-24 rounded bg-white/[0.06]" />
            <div className="h-4 w-20 rounded bg-white/[0.06]" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-white/[0.06]" />
            <div className="h-4 w-2/3 rounded bg-white/[0.06]" />
          </div>
          <div className="mt-2 flex gap-4">
            <div className="h-5 w-16 rounded bg-white/[0.06]" />
            <div className="h-5 w-12 rounded bg-white/[0.06]" />
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
    <div className="flex animate-pulse gap-3 px-4 py-2">
      {!compact && <div className="h-10 w-10 shrink-0 rounded-full bg-white/[0.06]" />}
      <div className="flex-1 space-y-1.5">
        {!compact && (
          <div className="flex items-center gap-2">
            <div className="h-4 w-24 rounded bg-white/[0.06]" />
            <div className="h-3 w-16 rounded bg-white/[0.04]" />
          </div>
        )}
        <div className="space-y-1.5">
          <div className="h-4 w-full max-w-[320px] rounded bg-white/[0.06]" />
          <div className="h-4 w-3/4 max-w-[240px] rounded bg-white/[0.06]" />
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
    <div className="flex animate-pulse items-center gap-3 rounded-lg px-3 py-2.5">
      <div className="h-10 w-10 shrink-0 rounded-full bg-white/[0.06]" />
      <div className="min-w-0 flex-1">
        <div className="mb-1 h-4 w-28 rounded bg-white/[0.06]" />
        <div className="h-3 w-20 rounded bg-white/[0.04]" />
      </div>
      <div className="h-2 w-2 rounded-full bg-white/[0.06]" />
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
    <div className="flex animate-pulse items-center gap-3 rounded-lg px-3 py-3">
      <div className="h-12 w-12 shrink-0 rounded-full bg-white/[0.06]" />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between">
          <div className="h-4 w-32 rounded bg-white/[0.06]" />
          <div className="h-3 w-10 rounded bg-white/[0.04]" />
        </div>
        <div className="h-3.5 w-48 rounded bg-white/[0.04]" />
      </div>
    </div>
  );
}

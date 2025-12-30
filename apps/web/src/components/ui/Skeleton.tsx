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
  const baseStyles = 'bg-dark-700 animate-pulse';

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
export function PostCardSkeleton() {
  return (
    <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 animate-pulse">
      <div className="flex gap-3">
        {/* Vote buttons skeleton */}
        <div className="flex flex-col items-center gap-1">
          <div className="h-6 w-6 bg-dark-700 rounded" />
          <div className="h-4 w-8 bg-dark-700 rounded" />
          <div className="h-6 w-6 bg-dark-700 rounded" />
        </div>
        
        {/* Content skeleton */}
        <div className="flex-1">
          {/* Meta */}
          <div className="flex items-center gap-2 mb-2">
            <div className="h-5 w-5 bg-dark-700 rounded-full" />
            <div className="h-4 w-24 bg-dark-700 rounded" />
            <div className="h-4 w-32 bg-dark-700 rounded" />
          </div>
          
          {/* Title */}
          <div className="h-6 w-3/4 bg-dark-700 rounded mb-2" />
          
          {/* Content preview */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-dark-700 rounded" />
            <div className="h-4 w-5/6 bg-dark-700 rounded" />
          </div>
          
          {/* Actions */}
          <div className="flex gap-4 mt-3">
            <div className="h-6 w-24 bg-dark-700 rounded" />
            <div className="h-6 w-16 bg-dark-700 rounded" />
            <div className="h-6 w-16 bg-dark-700 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Forum card skeleton
export function ForumCardSkeleton() {
  return (
    <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 bg-dark-700 rounded-full" />
        <div className="flex-1">
          <div className="h-5 w-32 bg-dark-700 rounded mb-1" />
          <div className="h-4 w-48 bg-dark-700 rounded" />
        </div>
        <div className="h-8 w-20 bg-dark-700 rounded-full" />
      </div>
    </div>
  );
}

// Comment skeleton
export function CommentSkeleton({ depth = 0 }: { depth?: number }) {
  return (
    <div className="animate-pulse" style={{ marginLeft: depth * 24 }}>
      <div className="flex gap-3">
        <div className="h-8 w-8 bg-dark-700 rounded-full" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-4 w-24 bg-dark-700 rounded" />
            <div className="h-4 w-20 bg-dark-700 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-dark-700 rounded" />
            <div className="h-4 w-2/3 bg-dark-700 rounded" />
          </div>
          <div className="flex gap-4 mt-2">
            <div className="h-5 w-16 bg-dark-700 rounded" />
            <div className="h-5 w-12 bg-dark-700 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

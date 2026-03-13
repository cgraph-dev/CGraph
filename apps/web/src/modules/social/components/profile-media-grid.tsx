/**
 * ProfileMediaGrid — Instagram-style 3-column media grid.
 * @module modules/social/components/profile-media-grid
 */
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui';

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  thumbnailUrl: string;
  url: string;
}

interface ProfileMediaGridProps {
  items: MediaItem[];
  isLoading?: boolean;
  hasMore?: boolean;
  onItemClick?: (item: MediaItem) => void;
  onLoadMore?: () => void;
  className?: string;
}

/**
 * 3-column Instagram grid with square thumbnails, hover zoom, play icon for video.
 */
export function ProfileMediaGrid({
  items,
  isLoading = false,
  hasMore = false,
  onItemClick,
  onLoadMore,
  className,
}: ProfileMediaGridProps) {
  if (!isLoading && items.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="mb-3 text-white/10"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <p className="text-sm text-white/30">No media shared yet</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-0.5', className)}>
      <div className="grid grid-cols-3 gap-0.5">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onItemClick?.(item)}
            className="group relative aspect-square overflow-hidden bg-white/[0.04]"
          >
            <img
              src={item.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
            />
            {/* Video play icon overlay */}
            {item.type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-black/50 p-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
              </div>
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                className="opacity-0 transition-opacity group-hover:opacity-80"
              >
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </div>
          </button>
        ))}

        {/* Skeleton loading */}
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} shape="thumbnail" className="aspect-square" />
          ))}
      </div>

      {/* Load more */}
      {hasMore && !isLoading && (
        <button
          type="button"
          onClick={onLoadMore}
          className="w-full py-3 text-center text-xs font-medium text-white/30 hover:text-white/50"
        >
          Load more
        </button>
      )}
    </div>
  );
}

export default ProfileMediaGrid;

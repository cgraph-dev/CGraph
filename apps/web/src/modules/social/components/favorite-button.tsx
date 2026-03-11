/**
 * FavoriteButton — star toggle for marking friends as favorites.
 * @module modules/social/components/favorite-button
 */
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui';

interface FavoriteButtonProps {
  readonly friendId: string;
  readonly isFavorited: boolean;
  readonly onToggle: (friendId: string, favorited: boolean) => void;
  readonly className?: string;
}

/**
 * Star button to toggle friend favorite status.
 */
export function FavoriteButton({
  friendId,
  isFavorited,
  onToggle,
  className,
}: FavoriteButtonProps) {
  return (
    <Tooltip content={isFavorited ? 'Remove from favorites' : 'Add to favorites'} side="top">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(friendId, !isFavorited);
        }}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
          isFavorited
            ? 'text-yellow-400 hover:bg-yellow-400/20'
            : 'text-white/30 hover:bg-white/[0.08] hover:text-yellow-400/60',
          className
        )}
        aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={isFavorited ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </button>
    </Tooltip>
  );
}

export default FavoriteButton;

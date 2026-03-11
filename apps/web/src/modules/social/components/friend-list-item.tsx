/**
 * FriendListItem — rich friend row with status, mutual friends, hover actions.
 * @module modules/social/components/friend-list-item
 */
import { cn } from '@/lib/utils';
import { Avatar, Tooltip } from '@/components/ui';
import { FavoriteButton } from './favorite-button';
import { NicknameEditor } from './nickname-editor';

interface FriendListItemProps {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: string;
  mutualFriends?: number;
  nickname?: string;
  isFavorited?: boolean;
  onMessage?: () => void;
  onCall?: () => void;
  onRemove?: () => void;
  onToggleFavorite?: (friendId: string, favorited: boolean) => void;
  onSaveNickname?: (friendId: string, nickname: string) => void;
  onClick?: () => void;
  className?: string;
}

/**
 * Friend list row — avatar with status, name, custom status, hover action buttons.
 */
export function FriendListItem({
  id,
  name,
  username,
  avatarUrl,
  status,
  customStatus,
  mutualFriends,
  nickname,
  isFavorited = false,
  onMessage,
  onCall,
  onRemove,
  onToggleFavorite,
  onSaveNickname,
  onClick,
  className,
}: FriendListItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-2',
        'cursor-pointer transition-colors hover:bg-white/[0.04]',
        className
      )}
    >
      <Avatar size="md" name={name} src={avatarUrl} status={status} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-white/90">{name}</span>
          <span className="text-xs text-white/30">@{username}</span>
        </div>
        {customStatus && <p className="truncate text-xs text-white/40">{customStatus}</p>}
      </div>

      {/* Mutual friends badge */}
      {mutualFriends !== undefined && mutualFriends > 0 && (
        <Tooltip
          content={`${mutualFriends} mutual friend${mutualFriends > 1 ? 's' : ''}`}
          side="top"
        >
          <span className="mr-2 rounded-full bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/30">
            {mutualFriends} mutual
          </span>
        </Tooltip>
      )}

      {/* Favorite + Nickname */}
      <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        {onToggleFavorite && (
          <FavoriteButton friendId={id} isFavorited={isFavorited} onToggle={onToggleFavorite} />
        )}
        {onSaveNickname && (
          <NicknameEditor friendId={id} currentNickname={nickname} onSave={onSaveNickname} />
        )}
      </div>

      {/* Hover actions */}
      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <IconButton icon="message" onClick={onMessage} tooltip="Message" />
        <IconButton icon="call" onClick={onCall} tooltip="Call" />
        <IconButton icon="remove" onClick={onRemove} tooltip="Remove Friend" destructive />
      </div>
    </div>
  );
}

function IconButton({
  icon,
  onClick,
  tooltip,
  destructive = false,
}: {
  icon: 'message' | 'call' | 'remove';
  onClick?: () => void;
  tooltip: string;
  destructive?: boolean;
}) {
  const iconPaths: Record<string, string> = {
    message: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
    call: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z',
    remove: 'M18 6L6 18M6 6l12 12',
  };

  return (
    <Tooltip content={tooltip} side="top">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full',
          'transition-colors',
          destructive
            ? 'text-white/30 hover:bg-red-500/20 hover:text-red-400'
            : 'text-white/30 hover:bg-white/[0.08] hover:text-white/60'
        )}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={iconPaths[icon]} />
        </svg>
      </button>
    </Tooltip>
  );
}

export default FriendListItem;

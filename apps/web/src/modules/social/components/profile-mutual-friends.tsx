/**
 * ProfileMutualFriends — grid of mutual friend cards.
 * @module modules/social/components/profile-mutual-friends
 */
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui';

interface MutualFriend {
  id: string;
  name: string;
  avatarUrl?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
}

interface ProfileMutualFriendsProps {
  friends: MutualFriend[];
  totalCount: number;
  maxVisible?: number;
  onFriendClick?: (id: string) => void;
  onViewAll?: () => void;
  className?: string;
}

/**
 * Grid of mutual friend cards (avatar + name + status) with view all link.
 */
export function ProfileMutualFriends({
  friends,
  totalCount,
  maxVisible = 12,
  onFriendClick,
  onViewAll,
  className,
}: ProfileMutualFriendsProps) {
  if (friends.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-white/30">No mutual friends</p>
      </div>
    );
  }

  const visible = friends.slice(0, maxVisible);

  return (
    <div className={cn('px-6 py-4', className)}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((friend, i) => (
          <motion.button
            key={friend.id}
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => onFriendClick?.(friend.id)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2',
              'bg-white/[0.03] transition-colors hover:bg-white/[0.06]'
            )}
          >
            <Avatar size="sm" name={friend.name} src={friend.avatarUrl} status={friend.status} />
            <span className="min-w-0 truncate text-xs text-white/80">{friend.name}</span>
          </motion.button>
        ))}
      </div>

      {totalCount > maxVisible && (
        <button
          type="button"
          onClick={onViewAll}
          className="mt-3 w-full text-center text-xs font-medium text-[#00AFF4] hover:underline"
        >
          View all {totalCount} mutual friends
        </button>
      )}
    </div>
  );
}

export default ProfileMutualFriends;

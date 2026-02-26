/**
 * MutualFriendsList - display mutual friends with avatars
 */

import { motion } from 'framer-motion';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import type { MutualFriend } from './types';

interface MutualFriendsListProps {
  friends: MutualFriend[];
  onFriendClick: (friendId: string) => void;
}

/**
 * unknown for the chat module.
 */
/**
 * Mutual Friends List component.
 */
export function MutualFriendsList({ friends, onFriendClick }: MutualFriendsListProps) {
  if (friends.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
    >
      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-400">
        <UserGroupIcon className="h-4 w-4 text-primary-400" />
        Mutual Friends ({friends.length})
      </h4>
      <div className="flex -space-x-2">
        {friends.slice(0, 5).map((friend, index) => (
          <motion.div
            key={friend.id}
            initial={{ scale: 0, x: -20 }}
            animate={{ scale: 1, x: 0 }}
            transition={{ delay: 0.75 + index * 0.05 }}
            className="relative"
            title={friend.username}
          >
            {friend.avatarUrl ? (
              <div
                className="cursor-pointer rounded-full border-2 border-dark-900 transition-transform hover:scale-110"
                onClick={() => onFriendClick(friend.id)}
              >
                <ThemedAvatar
                  src={friend.avatarUrl}
                  alt={friend.username}
                  size="medium"
                  avatarBorderId={friend.avatarBorderId ?? friend.avatar_border_id ?? null}
                />
              </div>
            ) : (
              <div
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-dark-900 bg-gradient-to-br from-primary-600 to-purple-600 font-bold text-white transition-transform hover:scale-110"
                onClick={() => onFriendClick(friend.id)}
              >
                {friend.username.charAt(0).toUpperCase()}
              </div>
            )}
          </motion.div>
        ))}
        {friends.length > 5 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1 }}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dark-900 bg-dark-700 text-xs font-bold text-gray-400"
          >
            +{friends.length - 5}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

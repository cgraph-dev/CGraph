/**
 * ProfileSection - user avatar, name, status, level/XP
 */

import { motion } from 'framer-motion';
import { GlassCard } from '@/shared/components/ui';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { springs } from '@/lib/animations/transitions';
import { getAvatarBorderId } from '@/lib/utils';
import type { UserInfo } from './types';
import { tweens, loop } from '@/lib/animation-presets';

interface ProfileSectionProps {
  user: UserInfo;
}

/**
 * unknown for the chat module.
 */
/**
 * Profile Section section component.
 */
export function ProfileSection({ user }: ProfileSectionProps) {
  // Calculate XP progress
  const levelXpRequired = 1000 * (user.level || 1);
  const currentLevelXp = (user.xp || 0) % levelXpRequired;
  const xpProgress = (currentLevelXp / levelXpRequired) * 100;

  // Format last seen
  const formatLastSeen = () => {
    if (user.onlineStatus === 'online') return 'Online';
    if (user.onlineStatus === 'away') return 'Away';
    if (!user.lastSeenAt) return 'Offline';

    const lastSeen = new Date(user.lastSeenAt);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Last seen just now';
    if (diffMins < 60) return `Last seen ${diffMins}m ago`;
    if (diffHours < 24) return `Last seen ${diffHours}h ago`;
    if (diffDays === 1) return 'Last seen yesterday';
    if (diffDays < 7) return `Last seen ${diffDays}d ago`;
    return 'Last seen over a week ago';
  };

  return (
    <GlassCard variant="frosted" glow className="p-4 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ ...springs.bouncy, delay: 0.1 }}
        className="mb-3 flex justify-center"
      >
        <div className="relative">
          <ThemedAvatar
            src={user.avatarUrl}
            alt={user.displayName || user.username}
            size="large"
            userTheme={user.theme}
            avatarBorderId={getAvatarBorderId(user)}
            className="!h-24 !w-24"
          />
          {user.onlineStatus === 'online' && (
            <motion.div
              className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-dark-900 bg-green-500"
              animate={{
                boxShadow: ['0 0 0 0 rgba(34, 197, 94, 0.7)', '0 0 0 8px rgba(34, 197, 94, 0)'],
              }}
              transition={loop(tweens.ambient)}
            />
          )}
        </div>
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-1 text-xl font-bold text-white"
      >
        {user.displayName || user.username}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="mb-3 text-sm text-gray-400"
      >
        @{user.username}
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-3 text-xs text-gray-500"
      >
        {formatLastSeen()}
      </motion.p>

      {/* Level & XP */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.35 }}
        className="space-y-2"
      >
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Level {user.level || 1}</span>
          <span className="font-bold text-primary-400">
            {currentLevelXp.toLocaleString()} / {levelXpRequired.toLocaleString()} XP
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-dark-700">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress}%` }}
            transition={{ ...tweens.slow, delay: 0.4 }}
          />
        </div>
      </motion.div>
    </GlassCard>
  );
}

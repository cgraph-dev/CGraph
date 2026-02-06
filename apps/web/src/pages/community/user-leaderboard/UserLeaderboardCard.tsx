/**
 * UserLeaderboardCard Component
 *
 * Single user card in the leaderboard list.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { GlassCard } from '@/shared/components/ui';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { getRankBadge, formatKarma, getUserInitial } from './utils';
import type { UserLeaderboardCardProps } from './types';

export function UserLeaderboardCard({ user, index = 0 }: UserLeaderboardCardProps) {
  const isTopThree = user.rank <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: index * 0.03,
      }}
    >
      <motion.div whileHover={{ scale: 1.02, x: 4 }} whileTap={{ scale: 0.98 }}>
        <GlassCard
          variant={isTopThree ? 'holographic' : 'default'}
          glow={isTopThree}
          glowColor={isTopThree ? 'rgba(16, 185, 129, 0.3)' : undefined}
          className="group relative overflow-hidden"
        >
          <motion.div
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary-500/10 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100"
            transition={{ duration: 0.3 }}
          />
          <div className="relative z-10 flex items-center gap-4 p-4">
            {/* Rank Badge */}
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              {getRankBadge(user.rank)}
            </motion.div>

            {/* Avatar */}
            <Link
              to={`/u/${user.username}`}
              className="shrink-0"
              onClick={() => HapticFeedback.light()}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                {user.avatarUrl ? (
                  <div
                    className={`rounded-full bg-gradient-to-br from-primary-500 to-purple-600 p-0.5 ${
                      isTopThree ? 'ring-2 ring-primary-500/50' : ''
                    }`}
                  >
                    <ThemedAvatar
                      src={user.avatarUrl}
                      alt={user.displayName || user.username || 'User'}
                      size={isTopThree ? 'large' : 'medium'}
                      avatarBorderId={user.avatarBorderId}
                    />
                  </div>
                ) : (
                  <div
                    className={`flex items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 font-semibold text-white ${
                      isTopThree ? 'h-14 w-14 text-xl' : 'h-12 w-12 text-lg'
                    }`}
                  >
                    {getUserInitial(user.displayName, user.username)}
                  </div>
                )}
              </motion.div>
            </Link>

            {/* User Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link
                  to={`/u/${user.username}`}
                  className={`truncate font-semibold ${
                    isTopThree
                      ? 'bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-lg text-transparent'
                      : 'text-gray-200 transition-colors hover:text-primary-400'
                  }`}
                  onClick={() => HapticFeedback.light()}
                >
                  {user.displayName || user.username || 'Unknown'}
                </Link>
                {user.isVerified && (
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  >
                    <CheckBadgeIcon className="h-5 w-5 shrink-0 text-primary-400" />
                  </motion.div>
                )}
              </div>
              <p className="truncate text-sm text-gray-400">@{user.username}</p>
            </div>

            {/* Karma */}
            <div className="flex items-center gap-2 rounded-lg bg-dark-600/50 px-4 py-2 backdrop-blur-sm">
              <SparklesIcon
                className={`h-5 w-5 ${isTopThree ? 'text-yellow-400' : 'text-primary-400'}`}
              />
              <span
                className={`font-bold ${
                  isTopThree ? 'text-xl text-yellow-400' : 'text-lg text-white'
                }`}
              >
                {formatKarma(user.karma)}
              </span>
              <span className="text-sm text-gray-400">karma</span>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

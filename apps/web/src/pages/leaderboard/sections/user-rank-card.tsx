/**
 * Current user's rank display card
 * @module pages/leaderboard/sections
 */

import { motion } from 'framer-motion';

import { GlassCard, AnimatedAvatar } from '@/shared/components/ui';

import { formatValue, getRankChange } from '../utils';
import type { UserRankCardProps } from './types';
import { tweens, loopWithDelay } from '@/lib/animation-presets';

export function UserRankCard({ userRank, currentCategory }: UserRankCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="mb-6"
    >
      <GlassCard variant="neon" glow className="relative overflow-hidden p-5">
        {/* Animated background */}
        <div
          className={`absolute inset-0 bg-gradient-to-r ${currentCategory.gradient} opacity-5`}
        />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={loopWithDelay(tweens.decorative, 2)}
        />

        <div className="relative flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-4">
            <div className="rounded-xl border border-primary-500/30 bg-primary-500/20 px-4 py-2 text-center">
              <p className="mb-0.5 text-xs text-primary-300">Your Rank</p>
              <p className="text-3xl font-black text-primary-400">#{userRank.rank}</p>
            </div>
            <div className="hidden h-14 w-px bg-gradient-to-b from-transparent via-dark-600 to-transparent sm:block" />
            <div className="flex items-center gap-3">
              <AnimatedAvatar
                src={userRank.avatarUrl}
                alt={userRank.displayName || userRank.username}
                size="lg"
                showStatus={true}
                statusType="online"
              />
              <div>
                <p className="text-lg font-bold text-white">
                  {userRank.displayName || userRank.username}
                </p>
                <p className="text-sm text-gray-400">@{userRank.username}</p>
                {userRank.title && (
                  <span className="text-xs font-medium text-primary-400">{userRank.title}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {getRankChange(userRank.rank, userRank.previousRank)}
            <div className="text-center sm:text-right">
              <p className="mb-1 text-xs text-gray-400">{currentCategory.description}</p>
              <p
                className={`bg-gradient-to-r text-2xl font-black ${currentCategory.gradient} bg-clip-text text-transparent`}
              >
                {formatValue(userRank.value)}
              </p>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

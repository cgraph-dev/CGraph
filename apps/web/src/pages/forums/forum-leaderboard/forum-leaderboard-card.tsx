/**
 * Forum Leaderboard Card Component
 *
 * Individual forum card with voting controls and stats display.
 */

import { Link } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  SparklesIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import {
  ArrowUpIcon as ArrowUpIconSolid,
  ArrowDownIcon as ArrowDownIconSolid,
} from '@heroicons/react/24/solid';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { ForumLeaderboardCardProps } from './types';
import { getRankBadge } from './constants';
import { tweens, springs } from '@/lib/animation-presets';

/**
 * unknown for the forums module.
 */
/**
 * Forum Leaderboard Card display component.
 */
export function ForumLeaderboardCard({
  forum,
  rank,
  onVote,
  isAuthenticated,
}: ForumLeaderboardCardProps) {
  const badge = getRankBadge(rank);
  const [voteAnim, setVoteAnim] = useState<string | null>(null);

  const handleVote = useCallback((value: 1 | -1) => {
    if (!isAuthenticated) return;
    HapticFeedback.light();
    onVote(forum, value);
    setVoteAnim(value === 1 ? '+1' : '-1');
    setTimeout(() => setVoteAnim(null), 600);
  }, [isAuthenticated, onVote, forum]);

  return (
    <GlassCard variant="crystal" className="group relative overflow-hidden">
      {/* Hover gradient glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-transparent opacity-0 group-hover:opacity-100"
        transition={tweens.standard}
      />

      <div className="relative z-10 flex">
        {/* Voting Column - Enhanced */}
        <div className="relative flex w-16 flex-col items-center justify-center gap-1 bg-dark-800/50 p-2 backdrop-blur-sm">
          <motion.button
            onClick={() => handleVote(1)}
            disabled={!isAuthenticated}
            whileHover={isAuthenticated ? { scale: 1.1 } : {}}
            whileTap={isAuthenticated ? { scale: 0.9 } : {}}
            animate={forum.userVote === 1 ? { scale: [1, 1.3, 1], rotate: [0, -15, 0] } : {}}
            transition={springs.bouncy}
            className={`rounded p-1 transition-colors ${
              forum.userVote === 1 ? 'text-orange-500' : 'text-gray-500 hover:text-orange-400'
            } ${!isAuthenticated ? 'cursor-not-allowed opacity-50' : ''}`}
            style={{
              filter:
                forum.userVote === 1 ? 'drop-shadow(0 0 6px rgba(249, 115, 22, 0.6))' : 'none',
            }}
            title={isAuthenticated ? 'Upvote' : 'Login to vote'}
          >
            {forum.userVote === 1 ? (
              <ArrowUpIconSolid className="h-6 w-6" />
            ) : (
              <ArrowUpIcon className="h-6 w-6" />
            )}
          </motion.button>

          <motion.span
            key={forum.score}
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-lg font-bold ${
              forum.score > 0
                ? 'bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent'
                : forum.score < 0
                  ? 'bg-gradient-to-r from-blue-500 to-blue-400 bg-clip-text text-transparent'
                  : 'text-gray-400'
            }`}
          >
            {forum.score}
          </motion.span>

          <motion.button
            onClick={() => handleVote(-1)}
            disabled={!isAuthenticated}
            whileHover={isAuthenticated ? { scale: 1.1 } : {}}
            whileTap={isAuthenticated ? { scale: 0.9 } : {}}
            animate={forum.userVote === -1 ? { scale: [1, 1.3, 1], rotate: [0, 15, 0] } : {}}
            transition={springs.bouncy}
            className={`rounded p-1 transition-colors ${
              forum.userVote === -1 ? 'text-blue-500' : 'text-gray-500 hover:text-blue-400'
            } ${!isAuthenticated ? 'cursor-not-allowed opacity-50' : ''}`}
            style={{
              filter:
                forum.userVote === -1 ? 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.6))' : 'none',
            }}
            title={isAuthenticated ? 'Downvote' : 'Login to vote'}
          >
            {forum.userVote === -1 ? (
              <ArrowDownIconSolid className="h-6 w-6" />
            ) : (
              <ArrowDownIcon className="h-6 w-6" />
            )}
          </motion.button>

          {/* Floating +1/-1 indicator */}
          <AnimatePresence>
            {voteAnim && (
              <motion.span
                initial={{ opacity: 1, y: 0, scale: 0.8 }}
                animate={{ opacity: 0, y: -24, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={tweens.emphatic}
                className={`pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 text-xs font-bold ${
                  voteAnim === '+1' ? 'text-orange-400' : 'text-blue-400'
                }`}
              >
                {voteAnim}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Rank Badge - Enhanced */}
        <div className="flex items-center px-3">
          <motion.div
            className={`h-10 w-10 rounded-full ${badge.bg} flex items-center justify-center`}
            style={{ boxShadow: badge.glow }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={springs.snappy}
          >
            {badge.emoji ? (
              <span className="text-xl">{badge.emoji}</span>
            ) : (
              <span className={`font-bold ${badge.text}`}>{rank}</span>
            )}
          </motion.div>
        </div>

        {/* Forum Info */}
        <div className="flex-1 p-3">
          <Link to={`/forums/${forum.slug}`} className="flex items-center gap-3">
            {/* Forum Icon */}
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-600">
              {forum.iconUrl ? (
                <img src={forum.iconUrl} alt={forum.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-white">
                  {forum.name?.[0]?.toUpperCase() ?? 'F'}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white transition-colors group-hover:text-primary-400">
                  f/{forum.name}
                </h3>
                {forum.featured && (
                  <SparklesIcon className="h-4 w-4 text-yellow-500" title="Featured Forum" />
                )}
              </div>
              <p className="truncate text-sm text-gray-400">
                {forum.description || 'No description'}
              </p>
              <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <UsersIcon className="h-3.5 w-3.5" />
                  {(forum.memberCount ?? 0).toLocaleString()} members
                </span>
                <span className="flex items-center gap-1">
                  <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" />
                  {(forum.postCount ?? 0).toLocaleString()} posts
                </span>
                <span title="Weekly score">
                  📈 {forum.weeklyScore > 0 ? '+' : ''}
                  {forum.weeklyScore} this week
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Stats Column */}
        <div className="hidden flex-col items-end justify-center px-4 text-sm text-gray-400 md:flex">
          <div className="flex items-center gap-1 text-green-400">
            <ArrowUpIcon className="h-4 w-4" />
            <span>{forum.upvotes}</span>
          </div>
          <div className="flex items-center gap-1 text-red-400">
            <ArrowDownIcon className="h-4 w-4" />
            <span>{forum.downvotes}</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

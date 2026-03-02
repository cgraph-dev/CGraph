/**
 * LeaderboardEntryRow Component
 *
 * Single row in the leaderboard list.
 */

import { motion } from 'framer-motion';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/outline';
import { TrophyIcon as TrophyIconSolid } from '@heroicons/react/24/solid';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { RANK_COLORS, MEDAL_ICONS } from './constants';
import { getRankChange, formatScore, getScoreLabel } from './utils';
import type { LeaderboardEntryProps, LeaderboardEntry } from './types';

/**
 * unknown for the gamification module.
 */
/**
 * Leaderboard Entry Row component.
 */
export function LeaderboardEntryRow({
  entry,
  index,
  leaderboardType,
  primaryColor,
  onUserClick,
}: LeaderboardEntryProps) {
  const rankChange = getRankChange(entry);
  const isTop3 = entry.rank <= 3;

  return (
    <motion.div
      key={entry.userId}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => {
        HapticFeedback.light();
        onUserClick?.(entry.userId);
      }}
      className={`flex cursor-pointer items-center gap-4 rounded-lg p-3 transition-colors ${
        entry.isCurrentUser
          ? 'bg-primary-500/20 ring-1 ring-primary-500/50'
          : 'hover:bg-dark-700/50'
      }`}
    >
      {/* Rank */}
      <div className="w-8 flex-shrink-0 text-center">
        {isTop3 ? (
          <span className="mx-auto text-xl" title={`Rank #${entry.rank}`}>
            {MEDAL_ICONS[entry.rank] ?? ''}
          </span>
        ) : (
          <span className="text-lg font-bold text-gray-400">#{entry.rank}</span>
        )}
      </div>

      {/* Rank Change Indicator */}
      <div className="w-4 flex-shrink-0">
        {rankChange === 'up' && <ArrowUpIcon className="h-4 w-4 text-green-500" />}
        {rankChange === 'down' && <ArrowDownIcon className="h-4 w-4 text-red-500" />}
        {rankChange === 'none' && <MinusIcon className="h-4 w-4 text-gray-500" />}
      </div>

      {/* Avatar */}
      <ThemedAvatar
        src={entry.avatarUrl}
        alt={entry.displayName || entry.username}
        size="small"
        avatarBorderId={
          entry.avatarBorderId ??
           
          (entry as LeaderboardEntry & { avatar_border_id?: string | null }).avatar_border_id // type assertion: extending entry with optional field
        }
      />

      {/* User Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`truncate font-medium ${entry.isCurrentUser ? 'text-primary-400' : ''}`}>
            {entry.displayName || entry.username}
          </span>
          {entry.isCurrentUser && (
            <span className="rounded bg-primary-500/30 px-1.5 py-0.5 text-xs text-primary-400">
              You
            </span>
          )}
          {(entry as LeaderboardEntry & { equippedTitle?: string }).equippedTitle && (
            <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-xs text-yellow-400">
              {(entry as LeaderboardEntry & { equippedTitle?: string }).equippedTitle}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>Level {entry.level}</span>
          {entry.badges && entry.badges.length > 0 && (
            <div className="flex items-center gap-1">
              {entry.badges.slice(0, 3).map((badge, i) => (
                <span key={i} className="text-sm">
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Score */}
      <div className="text-right">
        <div
          className="font-bold"
          style={{ color: isTop3 ? RANK_COLORS[entry.rank] : primaryColor }}
        >
          {formatScore(entry.score)}
        </div>
        <div className="text-xs text-gray-400">{getScoreLabel(leaderboardType)}</div>
      </div>
    </motion.div>
  );
}

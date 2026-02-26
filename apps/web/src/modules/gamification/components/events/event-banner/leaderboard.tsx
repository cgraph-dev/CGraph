/**
 * Event Leaderboard component
 * @module modules/gamification/components/events/event-banner/leaderboard
 */

import { motion } from 'framer-motion';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import type { EventLeaderboardProps, LeaderboardEntry } from './types';

/**
 * Podium entry for top 3 positions
 */
function LeaderboardPodium({ entry, position }: { entry: LeaderboardEntry; position: 1 | 2 | 3 }) {
  const heights = { 1: 'h-32', 2: 'h-24', 3: 'h-20' };
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const colors = {
    1: 'from-yellow-500 to-amber-600',
    2: 'from-gray-300 to-gray-500',
    3: 'from-orange-600 to-orange-800',
  };

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: position * 0.1 }}
      className="text-center"
    >
      {/* Avatar */}
      <div className="relative mb-2">
        <div
          className={`rounded-full border-4 ${
            position === 1
              ? 'border-yellow-500'
              : position === 2
                ? 'border-gray-400'
                : 'border-orange-600'
          }`}
        >
          <ThemedAvatar
            src={entry.avatarUrl}
            alt={entry.displayName}
            size="large"
            avatarBorderId={entry.avatarBorderId ?? entry.avatar_border_id ?? null}
          />
        </div>
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-2xl">
          {medals[position]}
        </span>
      </div>

      {/* Name */}
      <p className="max-w-24 truncate text-sm font-medium text-white">{entry.displayName}</p>

      {/* Score */}
      <p className="text-xs text-gray-400">{entry.score.toLocaleString()}</p>

      {/* Podium */}
      <div
        className={`mt-2 ${heights[position]} w-20 bg-gradient-to-t ${colors[position]} rounded-t-lg`}
      />
    </motion.div>
  );
}

/**
 * unknown for the gamification module.
 */
/**
 * Event Leaderboard component.
 */
export function EventLeaderboard({
  entries,
  currentUserId,
  isLoading,
  onLoadMore,
  hasMore,
}: EventLeaderboardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-4">
        <h3 className="text-lg font-bold text-white">🏆 Leaderboard</h3>
      </div>

      {/* Top 3 Podium */}
      {entries.length >= 3 && entries[0] && entries[1] && entries[2] && (
        <div className="flex items-end justify-center gap-4 border-b border-white/10 p-6">
          {/* Second Place */}
          <LeaderboardPodium entry={entries[1]} position={2} />

          {/* First Place */}
          <LeaderboardPodium entry={entries[0]} position={1} />

          {/* Third Place */}
          <LeaderboardPodium entry={entries[2]} position={3} />
        </div>
      )}

      {/* Rest of Leaderboard */}
      <div className="divide-y divide-white/5">
        {entries.slice(3).map((entry) => (
          <motion.div
            key={entry.userId}
            layout
            className={`flex items-center gap-4 p-4 ${
              entry.userId === currentUserId ? 'bg-purple-500/10' : 'hover:bg-white/5'
            } transition-colors`}
          >
            {/* Rank */}
            <div className="w-8 text-center font-bold text-gray-500">#{entry.rank}</div>

            {/* Avatar */}
            <ThemedAvatar
              src={entry.avatarUrl}
              alt={entry.displayName}
              size="medium"
              avatarBorderId={entry.avatarBorderId ?? entry.avatar_border_id ?? null}
            />

            {/* Name */}
            <div className="flex-1">
              <p className="font-medium text-white">{entry.displayName}</p>
              <p className="text-xs text-gray-500">@{entry.username}</p>
            </div>

            {/* Score */}
            <div className="text-right">
              <p className="font-bold text-white">{entry.score.toLocaleString()}</p>
              {entry.change !== undefined && (
                <p
                  className={`text-xs ${entry.change > 0 ? 'text-green-400' : entry.change < 0 ? 'text-red-400' : 'text-gray-500'}`}
                >
                  {entry.change > 0 ? '▲' : entry.change < 0 ? '▼' : '–'} {Math.abs(entry.change)}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="border-t border-white/10 p-4">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="w-full py-2 text-gray-400 transition-colors hover:text-white disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}

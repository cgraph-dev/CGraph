/**
 * SidebarVariant Component
 *
 * Compact sidebar version of the leaderboard.
 */

import { motion } from 'framer-motion';
import { TrophyIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { RANK_COLORS } from './constants';
import { formatScore } from './utils';
import type { LeaderboardEntry, LeaderboardWidgetProps } from './types';

interface SidebarVariantProps {
  entries: LeaderboardEntry[];
  primaryColor: string;
  currentUserEntry?: LeaderboardEntry;
  onUserClick?: LeaderboardWidgetProps['onUserClick'];
  className?: string;
}

/**
 * unknown for the gamification module.
 */
/**
 * Sidebar Variant component.
 */
export function SidebarVariant({
  entries,
  primaryColor,
  currentUserEntry,
  onUserClick,
  className = '',
}: SidebarVariantProps) {
  return (
    <GlassCard variant="frosted" className={`p-4 ${className}`}>
      <div className="mb-4 flex items-center gap-2">
        <TrophyIcon className="h-5 w-5" style={{ color: primaryColor }} />
        <h3 className="font-semibold">Top Players</h3>
      </div>

      <div className="space-y-2">
        {entries.slice(0, 5).map((entry, index) => (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onUserClick?.(entry.userId)}
            className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-dark-700/50"
          >
            <span
              className="w-6 text-center font-bold"
              style={{ color: RANK_COLORS[entry.rank] || 'inherit' }}
            >
              {entry.rank}
            </span>
            <ThemedAvatar
              src={entry.avatarUrl}
              alt={entry.displayName || entry.username}
              size="xs"
              avatarBorderId={
                entry.avatarBorderId ??
                (entry as LeaderboardEntry & { avatar_border_id?: string | null }).avatar_border_id // type assertion: extending entry with optional field
              }
            />
            <span className="flex-1 truncate text-sm">{entry.displayName || entry.username}</span>
            <span className="text-sm font-medium" style={{ color: primaryColor }}>
              {formatScore(entry.score)}
            </span>
          </motion.div>
        ))}
      </div>

      {currentUserEntry && currentUserEntry.rank > 5 && (
        <div className="mt-4 border-t border-dark-700 pt-4">
          <div className="flex items-center gap-3 rounded-lg bg-primary-500/10 p-2">
            <span className="w-6 text-center font-bold">#{currentUserEntry.rank}</span>
            <ThemedAvatar
              src={currentUserEntry.avatarUrl}
              alt={currentUserEntry.displayName || currentUserEntry.username}
              size="xs"
              avatarBorderId={
                currentUserEntry.avatarBorderId ??
                (currentUserEntry as LeaderboardEntry & { avatar_border_id?: string | null }) // type assertion: extending entry with optional field
                  .avatar_border_id
              }
            />
            <span className="flex-1 truncate text-sm font-medium text-primary-400">You</span>
            <span className="text-sm font-medium" style={{ color: primaryColor }}>
              {formatScore(currentUserEntry.score)}
            </span>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

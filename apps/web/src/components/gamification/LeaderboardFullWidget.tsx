import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrophyIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  SparklesIcon,
  FireIcon,
  ClockIcon,
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { TrophyIcon as TrophyIconSolid, StarIcon } from '@heroicons/react/24/solid';
import GlassCard from '@/components/ui/GlassCard';
import ThemedAvatar from '@/components/ui/ThemedAvatar';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';

/**
 * LeaderboardWidget Component
 * 
 * Displays user rankings with:
 * - Multiple leaderboard types (XP, karma, messages, etc.)
 * - Time period filtering (daily, weekly, monthly, all-time)
 * - Current user highlight
 * - Rank change indicators
 * - Top 3 podium display
 * - Animated rank entries
 * - Pagination for large lists
 */

interface LeaderboardEntry {
  rank: number;
  previousRank?: number;
  userId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  level: number;
  score: number;
  badges?: string[];
  isCurrentUser?: boolean;
}

interface LeaderboardWidgetProps {
  entries: LeaderboardEntry[];
  leaderboardType?: 'xp' | 'karma' | 'messages' | 'posts' | 'achievements' | 'referrals';
  timePeriod?: 'daily' | 'weekly' | 'monthly' | 'allTime';
  onTimePeriodChange?: (period: 'daily' | 'weekly' | 'monthly' | 'allTime') => void;
  onTypeChange?: (type: string) => void;
  onUserClick?: (userId: string) => void;
  currentUserId?: string;
  showPodium?: boolean;
  showFilters?: boolean;
  pageSize?: number;
  isLoading?: boolean;
  variant?: 'default' | 'compact' | 'sidebar';
  className?: string;
}

const RANK_COLORS: Record<number, string> = {
  1: '#FFD700', // Gold
  2: '#C0C0C0', // Silver
  3: '#CD7F32', // Bronze
};

const LEADERBOARD_TYPES = [
  { value: 'xp', label: 'XP', icon: SparklesIcon },
  { value: 'karma', label: 'Karma', icon: StarIcon },
  { value: 'messages', label: 'Messages', icon: ChartBarIcon },
  { value: 'posts', label: 'Posts', icon: ChartBarIcon },
  { value: 'achievements', label: 'Achievements', icon: TrophyIcon },
  { value: 'referrals', label: 'Referrals', icon: UserGroupIcon },
];

const TIME_PERIODS = [
  { value: 'daily', label: 'Today' },
  { value: 'weekly', label: 'This Week' },
  { value: 'monthly', label: 'This Month' },
  { value: 'allTime', label: 'All Time' },
];

export function LeaderboardWidget({
  entries,
  leaderboardType = 'xp',
  timePeriod = 'weekly',
  onTimePeriodChange,
  onTypeChange,
  onUserClick,
  currentUserId,
  showPodium = true,
  showFilters = true,
  pageSize = 10,
  isLoading = false,
  variant = 'default',
  className = '',
}: LeaderboardWidgetProps) {
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const primaryColor = theme.colors.primary;
  
  const currentId = currentUserId || user?.id;
  const [currentPage, setCurrentPage] = useState(0);

  // Process entries to mark current user
  const processedEntries = useMemo(() => {
    return entries.map((entry) => ({
      ...entry,
      isCurrentUser: entry.userId === currentId,
    }));
  }, [entries, currentId]);

  // Paginate
  const paginatedEntries = useMemo(() => {
    const start = currentPage * pageSize;
    return processedEntries.slice(start, start + pageSize);
  }, [processedEntries, currentPage, pageSize]);

  const totalPages = Math.ceil(processedEntries.length / pageSize);

  // Find current user's position
  const currentUserEntry = useMemo(() => {
    return processedEntries.find((e) => e.isCurrentUser);
  }, [processedEntries]);

  const getRankChange = (entry: LeaderboardEntry) => {
    if (!entry.previousRank) return 'none';
    if (entry.rank < entry.previousRank) return 'up';
    if (entry.rank > entry.previousRank) return 'down';
    return 'none';
  };

  const formatScore = (score: number) => {
    if (score >= 1000000) return `${(score / 1000000).toFixed(1)}M`;
    if (score >= 1000) return `${(score / 1000).toFixed(1)}K`;
    return score.toString();
  };

  const renderPodium = () => {
    const top3 = processedEntries.slice(0, 3);
    if (top3.length < 3) return null;

    // Reorder for podium display: [2nd, 1st, 3rd]
    const podiumOrder = [top3[1], top3[0], top3[2]];
    const heights = ['h-24', 'h-32', 'h-20'];

    return (
      <div className="flex items-end justify-center gap-4 mb-6">
        {podiumOrder.map((entry, index) => {
          const actualRank = index === 0 ? 2 : index === 1 ? 1 : 3;
          return (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center"
              onClick={() => onUserClick?.(entry.userId)}
            >
              {/* Avatar */}
              <div className="relative mb-2 cursor-pointer">
                <ThemedAvatar
                  src={entry.avatarUrl}
                  alt={entry.displayName || entry.username}
                  size={index === 1 ? 'lg' : 'md'}
                  className="ring-2"
                  style={{ '--tw-ring-color': RANK_COLORS[actualRank] } as React.CSSProperties}
                />
                {actualRank === 1 && (
                  <motion.div
                    className="absolute -top-3 left-1/2 -translate-x-1/2"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <span className="text-2xl">👑</span>
                  </motion.div>
                )}
              </div>

              {/* Username */}
              <span className="text-sm font-medium truncate max-w-[80px]">
                {entry.displayName || entry.username}
              </span>
              <span className="text-xs text-gray-400">Lvl {entry.level}</span>

              {/* Podium */}
              <motion.div
                className={`w-20 ${heights[index]} rounded-t-lg mt-2 flex items-center justify-center`}
                style={{
                  background: `linear-gradient(180deg, ${RANK_COLORS[actualRank]}40 0%, ${RANK_COLORS[actualRank]}20 100%)`,
                  borderTop: `3px solid ${RANK_COLORS[actualRank]}`,
                }}
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: RANK_COLORS[actualRank] }}>
                    {actualRank}
                  </div>
                  <div className="text-sm font-medium">{formatScore(entry.score)}</div>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  const renderEntry = (entry: LeaderboardEntry, index: number) => {
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
        className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors ${
          entry.isCurrentUser
            ? 'bg-primary-500/20 ring-1 ring-primary-500/50'
            : 'hover:bg-dark-700/50'
        }`}
      >
        {/* Rank */}
        <div className="w-8 text-center flex-shrink-0">
          {isTop3 ? (
            <TrophyIconSolid
              className="h-6 w-6 mx-auto"
              style={{ color: RANK_COLORS[entry.rank] }}
            />
          ) : (
            <span className="text-lg font-bold text-gray-400">#{entry.rank}</span>
          )}
        </div>

        {/* Rank Change Indicator */}
        <div className="w-4 flex-shrink-0">
          {rankChange === 'up' && (
            <ArrowUpIcon className="h-4 w-4 text-green-500" />
          )}
          {rankChange === 'down' && (
            <ArrowDownIcon className="h-4 w-4 text-red-500" />
          )}
          {rankChange === 'none' && (
            <MinusIcon className="h-4 w-4 text-gray-500" />
          )}
        </div>

        {/* Avatar */}
        <ThemedAvatar
          src={entry.avatarUrl}
          alt={entry.displayName || entry.username}
          size="sm"
        />

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-medium truncate ${entry.isCurrentUser ? 'text-primary-400' : ''}`}>
              {entry.displayName || entry.username}
            </span>
            {entry.isCurrentUser && (
              <span className="text-xs px-1.5 py-0.5 bg-primary-500/30 rounded text-primary-400">
                You
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Level {entry.level}</span>
            {entry.badges && entry.badges.length > 0 && (
              <div className="flex items-center gap-1">
                {entry.badges.slice(0, 3).map((badge, i) => (
                  <span key={i} className="text-sm">{badge}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Score */}
        <div className="text-right">
          <div className="font-bold" style={{ color: isTop3 ? RANK_COLORS[entry.rank] : primaryColor }}>
            {formatScore(entry.score)}
          </div>
          <div className="text-xs text-gray-400">
            {leaderboardType === 'xp' && 'XP'}
            {leaderboardType === 'karma' && 'karma'}
            {leaderboardType === 'messages' && 'msgs'}
            {leaderboardType === 'posts' && 'posts'}
            {leaderboardType === 'achievements' && 'unlocked'}
            {leaderboardType === 'referrals' && 'referrals'}
          </div>
        </div>
      </motion.div>
    );
  };

  if (variant === 'sidebar') {
    return (
      <GlassCard variant="frosted" className={`p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <TrophyIcon className="h-5 w-5" style={{ color: primaryColor }} />
          <h3 className="font-semibold">Top Players</h3>
        </div>

        <div className="space-y-2">
          {processedEntries.slice(0, 5).map((entry, index) => (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onUserClick?.(entry.userId)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-700/50 cursor-pointer"
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
              />
              <span className="flex-1 truncate text-sm">
                {entry.displayName || entry.username}
              </span>
              <span className="text-sm font-medium" style={{ color: primaryColor }}>
                {formatScore(entry.score)}
              </span>
            </motion.div>
          ))}
        </div>

        {currentUserEntry && currentUserEntry.rank > 5 && (
          <div className="mt-4 pt-4 border-t border-dark-700">
            <div className="flex items-center gap-3 p-2 bg-primary-500/10 rounded-lg">
              <span className="w-6 text-center font-bold">#{currentUserEntry.rank}</span>
              <ThemedAvatar
                src={currentUserEntry.avatarUrl}
                alt={currentUserEntry.displayName || currentUserEntry.username}
                size="xs"
              />
              <span className="flex-1 truncate text-sm font-medium text-primary-400">
                You
              </span>
              <span className="text-sm font-medium" style={{ color: primaryColor }}>
                {formatScore(currentUserEntry.score)}
              </span>
            </div>
          </div>
        )}
      </GlassCard>
    );
  }

  return (
    <div className={className}>
      <GlassCard variant="frosted" className="overflow-hidden">
        {/* Header with Filters */}
        {showFilters && (
          <div className="p-4 border-b border-dark-700">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Type Selector */}
              <div className="flex items-center gap-2 overflow-x-auto">
                {LEADERBOARD_TYPES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => onTypeChange?.(value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                      leaderboardType === value
                        ? 'text-white'
                        : 'bg-dark-600 text-gray-400 hover:bg-dark-500'
                    }`}
                    style={leaderboardType === value ? { backgroundColor: primaryColor } : {}}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Time Period */}
              <div className="flex items-center gap-1 bg-dark-700 rounded-lg p-0.5">
                {TIME_PERIODS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => onTimePeriodChange?.(value as typeof timePeriod)}
                    className={`px-3 py-1.5 rounded text-sm transition-colors ${
                      timePeriod === value
                        ? 'bg-dark-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-8 h-8 bg-dark-700 rounded" />
                  <div className="h-10 w-10 bg-dark-700 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-dark-700 rounded mb-1" />
                    <div className="h-3 w-16 bg-dark-700 rounded" />
                  </div>
                  <div className="h-5 w-12 bg-dark-700 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Podium */}
              {showPodium && variant === 'default' && renderPodium()}

              {/* List */}
              <div className="space-y-2">
                {paginatedEntries.map((entry, index) => renderEntry(entry, index))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-dark-700">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="p-2 rounded-lg hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <span className="text-sm text-gray-400">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="p-2 rounded-lg hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
              )}

              {/* Current User Position (if not visible) */}
              {currentUserEntry && !paginatedEntries.find((e) => e.isCurrentUser) && (
                <div className="mt-4 pt-4 border-t border-dark-700">
                  <p className="text-xs text-gray-400 mb-2">Your Position</p>
                  {renderEntry(currentUserEntry, 0)}
                </div>
              )}
            </>
          )}

          {!isLoading && processedEntries.length === 0 && (
            <div className="text-center py-8">
              <TrophyIcon className="h-12 w-12 mx-auto text-gray-500 mb-3" />
              <p className="text-gray-400">No leaderboard data available</p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

export default LeaderboardWidget;

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

import { useState, useMemo } from 'react';
import { TrophyIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { useThemeStore, THEME_COLORS } from '@/stores/theme';
import { useAuthStore } from '@/modules/auth/store';
import { LEADERBOARD_TYPES, TIME_PERIODS } from './constants';
import { Podium } from './podium';
import { LeaderboardEntryRow } from './leaderboard-entry-row';
import { SidebarVariant } from './sidebar-variant';
import type { LeaderboardWidgetProps, TimePeriod } from './types';

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
  const primaryColor = THEME_COLORS[theme.colorPreset]?.primary || '#10B981';

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

  // Sidebar variant
  if (variant === 'sidebar') {
    return (
      <SidebarVariant
        entries={processedEntries}
        primaryColor={primaryColor}
        currentUserEntry={currentUserEntry}
        onUserClick={onUserClick}
        className={className}
      />
    );
  }

  return (
    <div className={className}>
      <GlassCard variant="frosted" className="overflow-hidden">
        {/* Header with Filters */}
        {showFilters && (
          <div className="border-b border-dark-700 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Type Selector */}
              <div className="flex items-center gap-2 overflow-x-auto">
                {LEADERBOARD_TYPES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => onTypeChange?.(value)}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-colors ${
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
              <div className="flex items-center gap-1 rounded-lg bg-dark-700 p-0.5">
                {TIME_PERIODS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => onTimePeriodChange?.(value as TimePeriod)} // type assertion: button value constrained to TimePeriod
                    className={`rounded px-3 py-1.5 text-sm transition-colors ${
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
                <div key={i} className="flex animate-pulse items-center gap-4">
                  <div className="h-8 w-8 rounded bg-dark-700" />
                  <div className="h-10 w-10 rounded-full bg-dark-700" />
                  <div className="flex-1">
                    <div className="mb-1 h-4 w-24 rounded bg-dark-700" />
                    <div className="h-3 w-16 rounded bg-dark-700" />
                  </div>
                  <div className="h-5 w-12 rounded bg-dark-700" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Podium */}
              {showPodium && variant === 'default' && (
                <Podium entries={processedEntries} onUserClick={onUserClick} />
              )}

              {/* List */}
              <div className="space-y-2">
                {paginatedEntries.map((entry, index) => (
                  <LeaderboardEntryRow
                    key={entry.userId}
                    entry={entry}
                    index={index}
                    leaderboardType={leaderboardType}
                    primaryColor={primaryColor}
                    onUserClick={onUserClick}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-4 border-t border-dark-700 pt-4">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="rounded-lg p-2 hover:bg-dark-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <span className="text-sm text-gray-400">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="rounded-lg p-2 hover:bg-dark-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
              )}

              {/* Current User Position (if not visible) */}
              {currentUserEntry && !paginatedEntries.find((e) => e.isCurrentUser) && (
                <div className="mt-4 border-t border-dark-700 pt-4">
                  <p className="mb-2 text-xs text-gray-400">Your Position</p>
                  <LeaderboardEntryRow
                    entry={currentUserEntry}
                    index={0}
                    leaderboardType={leaderboardType}
                    primaryColor={primaryColor}
                    onUserClick={onUserClick}
                  />
                </div>
              )}
            </>
          )}

          {!isLoading && processedEntries.length === 0 && (
            <div className="py-8 text-center">
              <TrophyIcon className="mx-auto mb-3 h-12 w-12 text-gray-500" />
              <p className="text-gray-400">No leaderboard data available</p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

export default LeaderboardWidget;

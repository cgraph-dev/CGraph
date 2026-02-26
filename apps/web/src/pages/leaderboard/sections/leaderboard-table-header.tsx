/**
 * Leaderboard table header with stats
 * @module pages/leaderboard/sections
 */

import { GlobeAltIcon, ClockIcon } from '@heroicons/react/24/outline';

import type { LeaderboardTableHeaderProps } from './types';

/**
 * unknown for the leaderboard module.
 */
/**
 * Leaderboard Table Header component.
 */
export function LeaderboardTableHeader({ totalCount, lastUpdated }: LeaderboardTableHeaderProps) {
  return (
    <div className="flex flex-col items-center justify-between border-b border-dark-700/50 bg-dark-900/50 p-4 sm:flex-row">
      <div className="mb-2 flex items-center gap-3 text-gray-400 sm:mb-0">
        <GlobeAltIcon className="h-5 w-5" />
        <span className="text-sm font-medium">
          {totalCount.toLocaleString()} participants competing
        </span>
      </div>
      <div className="flex items-center gap-2 text-gray-500">
        <ClockIcon className="h-4 w-4" />
        <span className="text-xs">Updated {new Date(lastUpdated).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}

/**
 * UserLeaderboard Utilities
 *
 * Helper functions and components for the leaderboard page.
 */

import React from 'react';
import { TrophyIcon as TrophyIconSolid } from '@heroicons/react/24/solid';
import type { LeaderboardApiUser, LeaderboardUser } from './types';

/**
 * Get rank badge component based on rank
 */
export function getRankBadge(rank: number): React.ReactNode {
  if (rank === 1) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/30">
        <TrophyIconSolid className="h-5 w-5 text-white" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gray-300 to-gray-500 shadow-lg shadow-gray-400/30">
        <span className="text-lg font-bold text-white">2</span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/30">
        <span className="text-lg font-bold text-white">3</span>
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08]">
      <span className="text-lg font-semibold text-gray-400">#{rank}</span>
    </div>
  );
}

/**
 * Format karma number for display
 */
export function formatKarma(karma: number): string {
  if (karma >= 1000000) {
    return `${(karma / 1000000).toFixed(1)}M`;
  }
  if (karma >= 1000) {
    return `${(karma / 1000).toFixed(1)}K`;
  }
  return karma.toString();
}

/**
 * Transform API response to display format
 */
export function transformApiUser(
  u: LeaderboardApiUser,
  index?: number,
  currentPage?: number
): LeaderboardUser {
  // Use API rank if available, otherwise calculate from index and page
  const rank =
    u.rank ||
    (currentPage !== undefined && index !== undefined
      ? (currentPage - 1) * 50 + index + 1
      : index !== undefined
        ? index + 1
        : 0);

  return {
    rank,
    id: u.id,
    username: u.username,
    displayName: u.display_name ?? null,
    avatarUrl: u.avatar_url ?? null,
    avatarBorderId: u.avatar_border_id ?? u.avatarBorderId ?? null,
    karma: u.karma,
    isVerified: u.is_verified ?? false,
  };
}

/**
 * Get user initial for avatar fallback
 */
export function getUserInitial(displayName?: string | null, username?: string | null): string {
  return (displayName || username || '?').charAt(0).toUpperCase();
}

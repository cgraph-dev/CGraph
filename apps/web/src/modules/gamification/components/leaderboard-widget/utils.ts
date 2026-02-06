/**
 * LeaderboardWidget Utilities
 *
 * Helper functions for the leaderboard widget.
 */

import type { LeaderboardEntry, LeaderboardType } from './types';

/**
 * Get rank change direction
 */
export function getRankChange(entry: LeaderboardEntry): 'up' | 'down' | 'none' {
  if (!entry.previousRank) return 'none';
  if (entry.rank < entry.previousRank) return 'up';
  if (entry.rank > entry.previousRank) return 'down';
  return 'none';
}

/**
 * Format score for display
 */
export function formatScore(score: number): string {
  if (score >= 1000000) return `${(score / 1000000).toFixed(1)}M`;
  if (score >= 1000) return `${(score / 1000).toFixed(1)}K`;
  return score.toString();
}

/**
 * Get score label for leaderboard type
 */
export function getScoreLabel(leaderboardType: LeaderboardType): string {
  switch (leaderboardType) {
    case 'xp':
      return 'XP';
    case 'karma':
      return 'karma';
    case 'messages':
      return 'msgs';
    case 'posts':
      return 'posts';
    case 'achievements':
      return 'unlocked';
    case 'referrals':
      return 'referrals';
    default:
      return '';
  }
}

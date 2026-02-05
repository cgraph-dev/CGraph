/**
 * Type definitions for LeaderboardPage
 * @module pages/leaderboard
 */

export interface LeaderboardEntry {
  rank: number;
  previousRank: number;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  level: number;
  value: number;
  isOnline: boolean;
  isPremium: boolean;
  isVerified: boolean;
  title?: string;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  totalCount: number;
  userRank: LeaderboardEntry | null;
  lastUpdated: string;
}

export type LeaderboardCategory = 'xp' | 'karma' | 'streak' | 'messages' | 'posts' | 'friends';
export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'alltime';

export interface CategoryConfig {
  id: LeaderboardCategory;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  gradient: string;
}

export interface TimePeriodConfig {
  id: TimePeriod;
  name: string;
  icon: React.ReactNode;
}

export interface RankConfig {
  bg: string;
  border: string;
  text: string;
  glow: string;
  glowColor: string;
  medal: string;
  crown: boolean;
}

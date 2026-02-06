/**
 * Type definitions for leaderboard section components
 * @module pages/leaderboard/sections
 */

import type { LeaderboardEntry, LeaderboardCategory, TimePeriod, CategoryConfig } from '../types';

export interface HeaderProps {
  className?: string;
}

export interface CategoryTabsProps {
  category: LeaderboardCategory;
  onCategoryChange: (category: LeaderboardCategory) => void;
}

export interface FiltersRowProps {
  timePeriod: TimePeriod;
  onTimePeriodChange: (period: TimePeriod) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  currentCategory: CategoryConfig;
}

export interface UserRankCardProps {
  userRank: LeaderboardEntry;
  currentCategory: CategoryConfig;
}

export interface LeaderboardTableHeaderProps {
  totalCount: number;
  lastUpdated: string;
}

export interface LoadingStateProps {
  currentCategory: CategoryConfig;
}

export interface PodiumProps {
  entries: LeaderboardEntry[];
}

export interface RankingsListProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  currentCategory: CategoryConfig;
  page: number;
}

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  currentCategory: CategoryConfig;
}

// Re-export parent types for convenience
export type { LeaderboardEntry, LeaderboardCategory, TimePeriod, CategoryConfig };

/**
 * Leaderboard sections barrel export
 * @module pages/leaderboard/sections
 */

export { LeaderboardHeader } from './leaderboard-header';
export { CategoryTabs } from './category-tabs';
export { FiltersRow } from './filters-row';
export { UserRankCard } from './user-rank-card';
export { LeaderboardTableHeader } from './leaderboard-table-header';
export { LoadingState } from './loading-state';
export { TopPodium } from './top-podium';
export { RankingsList } from './rankings-list';
export { Pagination } from './pagination';

// Re-export types
export type {
  HeaderProps,
  CategoryTabsProps,
  FiltersRowProps,
  UserRankCardProps,
  LeaderboardTableHeaderProps,
  LoadingStateProps,
  PodiumProps,
  RankingsListProps,
  PaginationProps,
} from './types';

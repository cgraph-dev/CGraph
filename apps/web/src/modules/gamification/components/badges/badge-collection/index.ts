/**
 * BadgeCollection module - achievement gallery with filtering
 */

export { BadgeCollection, BadgeCollection as default } from './BadgeCollection';
export { CollectionHeader } from './CollectionHeader';
export { FilterControls } from './FilterControls';
export { CategoryTabs } from './CategoryTabs';
export { AchievementCard } from './AchievementCard';
export { EmptyState } from './EmptyState';
export { useBadgeCollection } from './useBadgeCollection';
export { CATEGORY_ICONS, CATEGORY_LABELS, RARITY_ORDER, INITIAL_FILTER_STATE } from './constants';
export type {
  BadgeCollectionProps,
  FilterState,
  SortOption,
  CategoryCount,
  CollectionStats,
} from './types';

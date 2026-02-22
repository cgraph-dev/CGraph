/**
 * BadgeCollection module - achievement gallery with filtering
 */

export { BadgeCollection, BadgeCollection as default } from './badge-collection';
export { CollectionHeader } from './collection-header';
export { FilterControls } from './filter-controls';
export { CategoryTabs } from './category-tabs';
export { AchievementCard } from './achievement-card';
export { EmptyState } from './empty-state';
export { useBadgeCollection } from './useBadgeCollection';
export { CATEGORY_ICONS, CATEGORY_LABELS, RARITY_ORDER, INITIAL_FILTER_STATE } from './constants';
export type {
  BadgeCollectionProps,
  FilterState,
  SortOption,
  CategoryCount,
  CollectionStats,
} from './types';

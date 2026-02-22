/**
 * BadgeCollection Component
 *
 * Re-exports from modular badge-collection directory.
 * @see ./badge-collection for implementation
 */

export {
  BadgeCollection,
  BadgeCollection as default,
  CollectionHeader,
  FilterControls,
  CategoryTabs,
  AchievementCard,
  EmptyState,
  useBadgeCollection,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  RARITY_ORDER,
  INITIAL_FILTER_STATE,
} from './badge-collection/index';

export type {
  BadgeCollectionProps,
  FilterState,
  SortOption,
  CategoryCount,
  CollectionStats,
} from './badge-collection/index';

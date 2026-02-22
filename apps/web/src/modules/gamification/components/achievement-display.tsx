/**
 * AchievementDisplay Component
 *
 * Re-exports from modular achievement-display directory.
 * @see ./achievement-display for implementation
 */

export {
  AchievementDisplay,
  AchievementDisplay as default,
  StatsHeader,
  FilterBar,
  AchievementCard,
  AchievementListItem,
  AchievementModal,
  useAchievementDisplay,
  RARITY_COLORS,
  RARITY_GRADIENTS,
  CATEGORY_ICONS,
  RARITY_ORDER,
  CATEGORIES,
} from './achievement-display/index';

export type { AchievementDisplayProps, AchievementStats, SortOption } from './achievement-display/index';

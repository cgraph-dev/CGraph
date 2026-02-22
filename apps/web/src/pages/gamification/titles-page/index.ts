/**
 * titles-page barrel exports
 *
 * Modularized TitlesPage component following Google/Meta coding standards
 */

// Main component
export { TitlesPage, TitlesPage as default } from './titles-page';

// Sub-components
export { TitleCard } from './title-card';
export { TitlesHeader } from './titles-header';
export { RarityStats } from './rarity-stats';
export { TabsFilter } from './tabs-filter';
export { TitlesGrid } from './titles-grid';

// Hooks
export { useTitlesData } from './hooks';

// Types
export type {
  OwnedTitle,
  TitleTab,
  TabConfig,
  TitleCardProps,
  RarityStyle,
  TitleStats,
  TitlesHeaderProps,
  RarityStatsProps,
  TabsFilterProps,
  TitlesGridProps,
} from './types';

// Constants
export { TABS, RARITY_ORDER, RARITY_STYLES } from './constants';

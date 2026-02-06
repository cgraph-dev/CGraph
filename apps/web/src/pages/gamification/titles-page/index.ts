/**
 * titles-page barrel exports
 *
 * Modularized TitlesPage component following Google/Meta coding standards
 */

// Main component
export { TitlesPage, TitlesPage as default } from './TitlesPage';

// Sub-components
export { TitleCard } from './TitleCard';
export { TitlesHeader } from './TitlesHeader';
export { RarityStats } from './RarityStats';
export { TabsFilter } from './TabsFilter';
export { TitlesGrid } from './TitlesGrid';

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

/**
 * TitlesPage Types
 *
 * Type definitions for the titles page module
 */

import { type Title, type TitleRarity } from '@/data/titles';

/**
 * Represents an owned title from the API
 */
export interface OwnedTitle {
  id: string;
  title_id: string;
  acquired_at: string;
}

/**
 * Tab type for filtering titles
 */
export type TitleTab = 'owned' | 'all' | 'purchasable';

/**
 * Tab configuration for the tabs filter
 */
export interface TabConfig {
  id: TitleTab;
  label: string;
  icon: React.ReactNode;
}

/**
 * Props for TitleCard component
 */
export interface TitleCardProps {
  title: Title;
  isOwned: boolean;
  isEquipped: boolean;
  actionLoading: string | null;
  onEquip: (titleId: string) => void;
  onUnequip: () => void;
  onPurchase: (titleId: string) => void;
}

/**
 * Rarity style configuration
 */
export interface RarityStyle {
  gradient: string;
  text: string;
  bg: string;
}

/**
 * Stats for titles collection
 */
export interface TitleStats {
  owned: number;
  total: number;
  byRarity: Record<TitleRarity, { owned: number; total: number }>;
}

/**
 * Props for TitlesHeader component
 */
export interface TitlesHeaderProps {
  stats: TitleStats;
  equippedTitleId: string | null;
}

/**
 * Props for RarityStats component
 */
export interface RarityStatsProps {
  stats: TitleStats;
  selectedRarity: TitleRarity | 'all';
  onRaritySelect: (rarity: TitleRarity | 'all') => void;
}

/**
 * Props for TabsFilter component
 */
export interface TabsFilterProps {
  selectedTab: TitleTab;
  onTabSelect: (tab: TitleTab) => void;
}

/**
 * Props for TitlesGrid component
 */
export interface TitlesGridProps {
  titles: Title[];
  isLoading: boolean;
  actionLoading: string | null;
  equippedTitleId: string | null;
  selectedTab: TitleTab;
  isOwned: (titleId: string) => boolean;
  onEquip: (titleId: string) => void;
  onUnequip: () => void;
  onPurchase: (titleId: string) => void;
}

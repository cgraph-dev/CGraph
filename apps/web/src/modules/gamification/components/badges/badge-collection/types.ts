/**
 * Type definitions for BadgeCollection module
 */

import type {
  Achievement,
  AchievementCategory,
  AchievementRarity,
} from '@/stores/gamificationStore';

export interface BadgeCollectionProps {
  /** All achievements */
  achievements: Achievement[];
  /** Callback when achievement is clicked */
  onAchievementClick?: (achievement: Achievement) => void;
  /** Callback to equip a badge */
  onEquipBadge?: (achievement: Achievement) => void;
  /** Currently equipped badge IDs */
  equippedBadgeIds?: string[];
  /** Show search bar */
  showSearch?: boolean;
  /** Show filters */
  showFilters?: boolean;
  /** Layout mode */
  layout?: 'grid' | 'list';
  /** Additional className */
  className?: string;
}

export type SortOption = 'name' | 'rarity' | 'progress' | 'unlocked';

export interface FilterState {
  category: AchievementCategory | 'all';
  rarity: AchievementRarity | 'all';
  status: 'all' | 'unlocked' | 'locked' | 'in-progress';
  sort: SortOption;
  search: string;
}

export interface CategoryCount {
  total: number;
  unlocked: number;
}

export interface CollectionStats {
  total: number;
  unlocked: number;
  percentage: number;
}

export type { Achievement, AchievementCategory, AchievementRarity };

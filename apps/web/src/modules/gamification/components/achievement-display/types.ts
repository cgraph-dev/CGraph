/**
 * Type definitions for AchievementDisplay module
 */

import type {
  Achievement,
  AchievementCategory,
  AchievementRarity,
} from '@/modules/gamification/store/types';

export interface AchievementDisplayProps {
  achievements: Achievement[];
  unlockedIds?: string[];
  onAchievementClick?: (achievement: Achievement) => void;
  variant?: 'grid' | 'list' | 'compact';
  showLocked?: boolean;
  showProgress?: boolean;
  maxDisplay?: number;
  className?: string;
}

export interface AchievementStats {
  total: number;
  unlocked: number;
  byRarity: Record<AchievementRarity, { total: number; unlocked: number }>;
}

export type SortOption = 'rarity' | 'recent' | 'progress';

export type { Achievement, AchievementCategory, AchievementRarity };

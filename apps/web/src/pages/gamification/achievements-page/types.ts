import type {
  AchievementCategory,
  AchievementRarity,
  Achievement,
} from '@/modules/gamification/store';

export interface AchievementCardProps {
  achievement: Achievement;
  onClick?: () => void;
}

export interface CategoryFilter {
  id: AchievementCategory | 'all';
  name: string;
  icon: React.ReactNode;
  color: string;
}

export interface RarityColors {
  bg: string;
  border: string;
  text: string;
  glow: string;
}

export type { Achievement, AchievementCategory, AchievementRarity };

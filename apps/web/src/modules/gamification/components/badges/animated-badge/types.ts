/**
 * Type definitions for AnimatedBadge module
 */

import type { Achievement, AchievementRarity } from '@/modules/gamification/store';

export interface AnimatedBadgeProps {
  /** Achievement data */
  achievement: Achievement;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Show animation effects */
  animated?: boolean;
  /** Show progress bar for incomplete achievements */
  showProgress?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Whether the badge is equipped in showcase */
  isEquipped?: boolean;
  /** Additional className */
  className?: string;
}

export interface AnimatedBadgeWithTooltipProps extends AnimatedBadgeProps {
  /** Show tooltip on hover */
  showTooltip?: boolean;
}

export interface RarityColorConfig {
  primary: string;
  secondary: string;
  glow: string;
  gradient: string;
  particle: string;
  bg: string;
}

export interface SizeConfig {
  badge: number;
  icon: number;
  ring: number;
  particles: number;
}

export interface ParticleProps {
  index: number;
  total: number;
  radius: number;
  color: string;
  reverse?: boolean;
  delay?: number;
}

export type { Achievement, AchievementRarity };

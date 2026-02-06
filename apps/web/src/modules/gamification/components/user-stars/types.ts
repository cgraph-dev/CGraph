/**
 * UserStars Types
 *
 * Type definitions for the user stars tier system.
 */

/**
 * User tier configuration
 */
export interface UserStarsTier {
  name: string;
  minPosts: number;
  maxPosts: number | null;
  stars: number;
  isGold: boolean;
  hasCrown: boolean;
  color: string;
  glowColor: string;
  description: string;
}

/**
 * UserStars component props
 */
export interface UserStarsProps {
  /** Total number of posts/contributions by the user */
  postCount: number;
  /** Whether to show the tier name label */
  showLabel?: boolean;
  /** Whether to show the exact post count */
  showCount?: boolean;
  /** Size variant */
  size?: UserStarsSize;
  /** Whether to animate the stars */
  animated?: boolean;
  /** Custom class name */
  className?: string;
  /** Compact mode - just stars, no tooltip */
  compact?: boolean;
}

/**
 * UserStarsBadge component props
 */
export interface UserStarsBadgeProps {
  postCount: number;
  size?: 'xs' | 'sm' | 'md';
}

/**
 * Size variant type
 */
export type UserStarsSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Size configuration
 */
export interface SizeConfig {
  star: string;
  crown: string;
  gap: string;
  text: string;
  container: string;
}

/**
 * Constants for Streak Tracker Module
 */

import type { StreakMilestone } from './types';

/**
 * Default milestones for streak progression
 */
export const DEFAULT_MILESTONES: StreakMilestone[] = [
  { days: 7, reward: { xp: 500, coins: 100 }, claimed: false },
  { days: 14, reward: { xp: 1000, coins: 250 }, claimed: false },
  { days: 30, reward: { xp: 2500, coins: 500, badge: '🔥' }, claimed: false },
  { days: 60, reward: { xp: 5000, coins: 1000, title: 'Dedicated' }, claimed: false },
  { days: 100, reward: { xp: 10000, coins: 2500, badge: '💎' }, claimed: false },
  { days: 365, reward: { xp: 50000, coins: 10000, title: 'Legendary Streak' }, claimed: false },
];

/**
 * Fire colors based on streak intensity
 */
export const FIRE_COLORS = {
  low: '#F97316', // Orange
  medium: '#FF6B6B', // Red-orange
  high: '#FF4444', // Intense red
} as const;

/**
 * Glow color for fire animation
 */
export const GLOW_COLOR = '#FFD700';

/**
 * DailyRewards Constants
 *
 * Default values and configuration
 */

import type { DailyReward } from './types';

/**
 * Default 7-day reward cycle
 */
export const DEFAULT_REWARDS: DailyReward[] = [
  { day: 1, xp: 50, coins: 10 },
  { day: 2, xp: 75, coins: 15 },
  { day: 3, xp: 100, coins: 25 },
  { day: 4, xp: 150, coins: 35, isPremium: true },
  { day: 5, xp: 200, coins: 50 },
  { day: 6, xp: 250, coins: 75 },
  { day: 7, xp: 500, coins: 150, special: { type: 'badge', name: 'Weekly Warrior', icon: '🏆' } },
];

/**
 * Confetti colors for celebration
 */
export const CONFETTI_COLORS = ['#FFD700', '#FF6B6B'];

/**
 * Animation durations in milliseconds
 */
export const ANIMATION_DURATIONS = {
  claimedOverlay: 3000,
  cardStagger: 0.05,
  shakeRepeat: 2,
} as const;

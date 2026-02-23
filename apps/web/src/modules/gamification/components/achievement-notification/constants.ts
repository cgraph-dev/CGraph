/**
 * Constants for achievement notification styling and rarity colors.
 * @module modules/gamification/components/achievement-notification/constants
 */
import type { AchievementRarity } from '@/modules/gamification/store';

/**
 * Rarity-based color schemes for achievement notifications.
 */
export interface RarityColorScheme {
  from: string;
  to: string;
  glow: string;
}

export const RARITY_COLORS: Record<AchievementRarity, RarityColorScheme> = {
  common: { from: '#6b7280', to: '#4b5563', glow: '#6b7280' },
  uncommon: { from: '#10b981', to: '#059669', glow: '#10b981' },
  rare: { from: '#3b82f6', to: '#2563eb', glow: '#3b82f6' },
  epic: { from: '#8b5cf6', to: '#7c3aed', glow: '#8b5cf6' },
  legendary: { from: '#f59e0b', to: '#d97706', glow: '#f59e0b' },
  mythic: { from: '#ec4899', to: '#db2777', glow: '#ec4899' },
} as const;

/**
 * Confetti particle counts per rarity level.
 */
export const CONFETTI_PARTICLE_COUNTS: Record<AchievementRarity, number> = {
  common: 30,
  uncommon: 50,
  rare: 75,
  epic: 100,
  legendary: 150,
  mythic: 200,
} as const;

/**
 * Auto-dismiss duration in milliseconds.
 */
export const AUTO_DISMISS_DURATION_MS = 5000;

/**
 * Animation step count for progress / auto-dismiss timers.
 */
export const ANIMATION_STEPS = 60;

/**
 * Progress animation duration in milliseconds.
 */
export const PROGRESS_ANIMATION_DURATION_MS = 1000;

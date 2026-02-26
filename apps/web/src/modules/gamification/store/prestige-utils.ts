/**
 * Prestige system utility functions.
 * @module
 */
import type { PrestigeBonuses, PrestigeReward } from './prestige-types';

// ==================== BONUS CALCULATION ====================

export const BONUS_RATES = {
  xp: 0.05, // 5% per prestige level
  coins: 0.03, // 3% per prestige level
  karma: 0.02, // 2% per prestige level
  dropRate: 0.01, // 1% per prestige level
};

/**
 * unknown for the gamification module.
 */
/**
 * Computes bonuses.
 *
 * @param level - The level.
 * @returns The computed value.
 */
export function calculateBonuses(level: number): PrestigeBonuses {
  return {
    xp: level * BONUS_RATES.xp,
    coins: level * BONUS_RATES.coins,
    karma: level * BONUS_RATES.karma,
    dropRate: level * BONUS_RATES.dropRate,
  };
}

/**
 * unknown for the gamification module.
 */
/**
 * Computes xp required.
 *
 * @param level - The level.
 * @returns The computed value.
 */
export function calculateXpRequired(level: number): number {
  if (level < 0) return 0;
  if (level === 0) return 100000;
  return Math.round(100000 * Math.pow(1.5, level));
}

// ==================== HELPERS ====================

/**
 * unknown for the gamification module.
 */
/**
 * Retrieves default rewards for level.
 *
 * @param level - The level.
 * @returns The default rewards for level.
 */
export function getDefaultRewardsForLevel(level: number): PrestigeReward[] {
  const rewards: PrestigeReward[] = [
    { type: 'title', name: `Prestige ${level}` },
    { type: 'xp_bonus', amount: 0.05 },
  ];

  if (level >= 3) {
    rewards.push({ type: 'badge', name: 'Dedicated Player Badge' });
  }
  if (level >= 5) {
    rewards.push({ type: 'effect', name: 'Prestige Glow Effect' });
  }
  if (level >= 10) {
    rewards.push({ type: 'border', name: 'Prestige Master Border' });
  }
  if (level >= 15) {
    rewards.push({ type: 'title', name: 'Legendary Prestige' });
  }
  if (level >= 20) {
    rewards.push({ type: 'border', name: 'Transcendent Border' });
  }

  return rewards;
}

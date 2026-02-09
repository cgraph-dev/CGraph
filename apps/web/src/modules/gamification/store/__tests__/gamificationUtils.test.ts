import { describe, it, expect } from 'vitest';
import { calculateXPForLevel, calculateLevelFromXP, XP_REWARDS } from '../gamificationStore.utils';
import {
  calculateBonuses,
  calculateXpRequired,
  getDefaultRewardsForLevel,
  BONUS_RATES,
} from '../prestige-utils';

// ═══════════════════════════════════════════════════════════════════
// calculateXPForLevel
// ═══════════════════════════════════════════════════════════════════

describe('calculateXPForLevel', () => {
  it('returns 100 for level 1', () => {
    expect(calculateXPForLevel(1)).toBe(100);
  });

  it('returns floor of 100 * 2^1.8 for level 2', () => {
    expect(calculateXPForLevel(2)).toBe(Math.floor(100 * Math.pow(2, 1.8)));
  });

  it('scales exponentially — level 10 > level 5', () => {
    expect(calculateXPForLevel(10)).toBeGreaterThan(calculateXPForLevel(5));
  });

  it('scales exponentially — level 50 > level 20', () => {
    expect(calculateXPForLevel(50)).toBeGreaterThan(calculateXPForLevel(20));
  });

  it('returns 0 for level 0', () => {
    expect(calculateXPForLevel(0)).toBe(0);
  });

  it('returns integer (floor)', () => {
    for (let i = 1; i <= 20; i++) {
      expect(Number.isInteger(calculateXPForLevel(i))).toBe(true);
    }
  });

  it('matches known value for level 10 (6309)', () => {
    expect(calculateXPForLevel(10)).toBe(6309);
  });

  it('matches known value for level 100 (approximately 100000)', () => {
    const xp = calculateXPForLevel(100);
    // 100 * 100^1.8 = 100 * ~3981 ≈ 398107
    expect(xp).toBeGreaterThan(300000);
  });

  it('returns positive for any positive level', () => {
    for (const level of [1, 5, 10, 50, 100]) {
      expect(calculateXPForLevel(level)).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// calculateLevelFromXP
// ═══════════════════════════════════════════════════════════════════

describe('calculateLevelFromXP', () => {
  it('returns 0 for 0 XP', () => {
    expect(calculateLevelFromXP(0)).toBe(0);
  });

  it('returns 1 for 100 XP', () => {
    expect(calculateLevelFromXP(100)).toBe(1);
  });

  it('is roughly inverse of calculateXPForLevel (within 1 due to floor)', () => {
    for (const level of [1, 2, 5, 10, 20, 50]) {
      const xp = calculateXPForLevel(level);
      const computed = calculateLevelFromXP(xp);
      // floor() in both directions can lose up to 1 level
      expect(computed).toBeGreaterThanOrEqual(level - 1);
      expect(computed).toBeLessThanOrEqual(level);
    }
  });

  it('floors the result (no fractional levels)', () => {
    expect(Number.isInteger(calculateLevelFromXP(150))).toBe(true);
    expect(Number.isInteger(calculateLevelFromXP(999))).toBe(true);
  });

  it('returns level below when XP is between levels', () => {
    const xpForLevel5 = calculateXPForLevel(5);
    const xpForLevel6 = calculateXPForLevel(6);
    const midXP = Math.floor((xpForLevel5 + xpForLevel6) / 2);
    expect(calculateLevelFromXP(midXP)).toBe(5);
  });

  it('handles large XP values', () => {
    const level = calculateLevelFromXP(1_000_000);
    expect(level).toBeGreaterThan(50);
  });
});

// ═══════════════════════════════════════════════════════════════════
// XP_REWARDS constants
// ═══════════════════════════════════════════════════════════════════

describe('XP_REWARDS', () => {
  it('SEND_MESSAGE is 5', () => {
    expect(XP_REWARDS.SEND_MESSAGE).toBe(5);
  });

  it('SEND_VOICE_MESSAGE is greater than SEND_MESSAGE', () => {
    expect(XP_REWARDS.SEND_VOICE_MESSAGE).toBeGreaterThan(XP_REWARDS.SEND_MESSAGE);
  });

  it('MAKE_FRIEND is 25', () => {
    expect(XP_REWARDS.MAKE_FRIEND).toBe(25);
  });

  it('CREATE_FORUM is the highest fixed reward at 100', () => {
    expect(XP_REWARDS.CREATE_FORUM).toBe(100);
  });

  it('DAILY_LOGIN is 10', () => {
    expect(XP_REWARDS.DAILY_LOGIN).toBe(10);
  });

  it('streak multipliers increase progressively', () => {
    expect(XP_REWARDS.STREAK_3_DAYS).toBeLessThan(XP_REWARDS.STREAK_7_DAYS);
    expect(XP_REWARDS.STREAK_7_DAYS).toBeLessThan(XP_REWARDS.STREAK_30_DAYS);
    expect(XP_REWARDS.STREAK_30_DAYS).toBeLessThan(XP_REWARDS.STREAK_100_DAYS);
  });

  it('POST_GETS_BEST_ANSWER is 50', () => {
    expect(XP_REWARDS.POST_GETS_BEST_ANSWER).toBe(50);
  });

  it('all non-streak values are non-negative integers', () => {
    const fixedRewards = [
      XP_REWARDS.SEND_MESSAGE,
      XP_REWARDS.CREATE_POST,
      XP_REWARDS.CREATE_COMMENT,
      XP_REWARDS.DAILY_LOGIN,
      XP_REWARDS.MODERATE_CONTENT,
      XP_REWARDS.JOIN_GROUP,
    ];
    for (const r of fixedRewards) {
      expect(r).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(r)).toBe(true);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// prestige-utils: calculateBonuses
// ═══════════════════════════════════════════════════════════════════

describe('calculateBonuses', () => {
  it('returns all-zero bonuses for level 0', () => {
    const b = calculateBonuses(0);
    expect(b.xp).toBe(0);
    expect(b.coins).toBe(0);
    expect(b.karma).toBe(0);
    expect(b.dropRate).toBe(0);
  });

  it('calculates correct XP bonus for level 1', () => {
    expect(calculateBonuses(1).xp).toBeCloseTo(BONUS_RATES.xp);
  });

  it('calculates correct coins bonus for level 5', () => {
    expect(calculateBonuses(5).coins).toBeCloseTo(5 * BONUS_RATES.coins);
  });

  it('all bonuses scale linearly with level', () => {
    const b5 = calculateBonuses(5);
    const b10 = calculateBonuses(10);
    expect(b10.xp).toBeCloseTo(b5.xp * 2);
    expect(b10.coins).toBeCloseTo(b5.coins * 2);
  });

  it('returns four bonus fields', () => {
    const b = calculateBonuses(1);
    expect(Object.keys(b).sort()).toEqual(['coins', 'dropRate', 'karma', 'xp']);
  });
});

// ═══════════════════════════════════════════════════════════════════
// prestige-utils: calculateXpRequired
// ═══════════════════════════════════════════════════════════════════

describe('calculateXpRequired', () => {
  it('returns 100000 for level 0', () => {
    expect(calculateXpRequired(0)).toBe(100000);
  });

  it('returns 0 for negative level', () => {
    expect(calculateXpRequired(-1)).toBe(0);
  });

  it('scales with 1.5x multiplier per level', () => {
    expect(calculateXpRequired(1)).toBe(Math.round(100000 * 1.5));
    expect(calculateXpRequired(2)).toBe(Math.round(100000 * Math.pow(1.5, 2)));
  });

  it('increases with each level', () => {
    for (let i = 0; i < 10; i++) {
      expect(calculateXpRequired(i + 1)).toBeGreaterThan(calculateXpRequired(i));
    }
  });

  it('returns integer', () => {
    for (let i = 0; i < 10; i++) {
      expect(Number.isInteger(calculateXpRequired(i))).toBe(true);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// prestige-utils: getDefaultRewardsForLevel
// ═══════════════════════════════════════════════════════════════════

describe('getDefaultRewardsForLevel', () => {
  it('always includes a title reward', () => {
    const rewards = getDefaultRewardsForLevel(1);
    expect(rewards.some((r) => r.type === 'title')).toBe(true);
  });

  it('always includes xp_bonus', () => {
    const rewards = getDefaultRewardsForLevel(1);
    expect(rewards.some((r) => r.type === 'xp_bonus')).toBe(true);
  });

  it('includes badge at level 3+', () => {
    expect(getDefaultRewardsForLevel(2).some((r) => r.type === 'badge')).toBe(false);
    expect(getDefaultRewardsForLevel(3).some((r) => r.type === 'badge')).toBe(true);
    expect(getDefaultRewardsForLevel(5).some((r) => r.type === 'badge')).toBe(true);
  });

  it('includes effect at level 5+', () => {
    expect(getDefaultRewardsForLevel(4).some((r) => r.type === 'effect')).toBe(false);
    expect(getDefaultRewardsForLevel(5).some((r) => r.type === 'effect')).toBe(true);
  });

  it('includes border at level 10+', () => {
    expect(getDefaultRewardsForLevel(9).some((r) => r.type === 'border')).toBe(false);
    expect(getDefaultRewardsForLevel(10).some((r) => r.type === 'border')).toBe(true);
  });

  it('includes Legendary title at level 15+', () => {
    const rewards = getDefaultRewardsForLevel(15);
    expect(rewards.some((r) => r.type === 'title' && r.name === 'Legendary Prestige')).toBe(true);
  });

  it('includes Transcendent border at level 20+', () => {
    const rewards = getDefaultRewardsForLevel(20);
    expect(rewards.some((r) => r.type === 'border' && r.name === 'Transcendent Border')).toBe(true);
  });

  it('higher levels get more rewards', () => {
    const r1 = getDefaultRewardsForLevel(1);
    const r20 = getDefaultRewardsForLevel(20);
    expect(r20.length).toBeGreaterThan(r1.length);
  });

  it('level 1 gets exactly 2 rewards (title + xp_bonus)', () => {
    expect(getDefaultRewardsForLevel(1)).toHaveLength(2);
  });
});

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/**
 * Gamification Data & Constants Tests
 *
 * Tests for exported data structures in gamification:
 * - level-progress.constants (XP calc, streak multiplier, animation presets)
 * - daily-rewards/constants (DEFAULT_REWARDS, CONFETTI_COLORS, ANIMATION_DURATIONS)
 * - store/gamificationStore.utils (XP functions, XP_REWARDS)
 * - store/prestige-utils (bonuses, prestige XP, rewards)
 */

import { describe, it, expect } from 'vitest';

// ── level-progress.constants ─────────────────────────────────────────────
import {
  calculateXPForLevel as lpCalcXP,
  getStreakMultiplier,
  XP_NOTIFICATION_DURATION,
  glowPulseCompact,
  glowPulseExpanded,
  glowTransitionCompact,
  glowTransitionExpanded,
  shimmerTransition,
  progressBarTransitionCompact,
  progressBarTransitionExpanded,
  barShimmerTransition,
} from '../../components/level-progress.constants';

// ── daily-rewards/constants ──────────────────────────────────────────────
import {
  DEFAULT_REWARDS,
  CONFETTI_COLORS,
  ANIMATION_DURATIONS as DR_ANIMATION_DURATIONS,
} from '../../components/daily-rewards/constants';

// ── gamificationStore.utils ──────────────────────────────────────────────
import {
  XP_REWARDS,
} from '../../store/gamificationStore.utils';

// ── prestige-utils ───────────────────────────────────────────────────────
import {
  calculateBonuses,
  calculateXpRequired,
  getDefaultRewardsForLevel,
  BONUS_RATES,
} from '../../store/prestige-utils';

// ═══════════════════════════════════════════════════════════════════════════
// Level Progress Constants
// ═══════════════════════════════════════════════════════════════════════════

describe('level-progress.constants', () => {
  describe('calculateXPForLevel (level-progress)', () => {
    it('returns 100 for level 1', () => {
      expect(lpCalcXP(1)).toBe(100);
    });

    it('returns 0 for level 0', () => {
      expect(lpCalcXP(0)).toBe(0);
    });

    it('scales exponentially', () => {
      expect(lpCalcXP(10)).toBeGreaterThan(lpCalcXP(5));
      expect(lpCalcXP(20)).toBeGreaterThan(lpCalcXP(10));
    });

    it('returns integers', () => {
      for (let i = 1; i <= 15; i++) {
        expect(Number.isInteger(lpCalcXP(i))).toBe(true);
      }
    });
  });

  describe('getStreakMultiplier', () => {
    it('returns 1.0 for 0 days', () => {
      expect(getStreakMultiplier(0)).toBe(1.0);
    });

    it('returns 1.0 for 2 days', () => {
      expect(getStreakMultiplier(2)).toBe(1.0);
    });

    it('returns 1.5 for 3 days', () => {
      expect(getStreakMultiplier(3)).toBe(1.5);
    });

    it('returns 1.5 for 6 days', () => {
      expect(getStreakMultiplier(6)).toBe(1.5);
    });

    it('returns 2.0 for 7 days', () => {
      expect(getStreakMultiplier(7)).toBe(2.0);
    });

    it('returns 2.0 for 30 days', () => {
      expect(getStreakMultiplier(30)).toBe(2.0);
    });
  });

  describe('XP_NOTIFICATION_DURATION', () => {
    it('is 3000 ms', () => {
      expect(XP_NOTIFICATION_DURATION).toBe(3000);
    });
  });

  describe('animation presets', () => {
    it('glowPulseCompact has opacity and scale arrays', () => {
      expect(glowPulseCompact.opacity).toHaveLength(3);
      expect(glowPulseCompact.scale).toHaveLength(3);
    });

    it('glowPulseExpanded has opacity and scale arrays', () => {
      expect(glowPulseExpanded.opacity).toHaveLength(3);
      expect(glowPulseExpanded.scale).toHaveLength(3);
    });

    it('transitions have duration and repeat', () => {
      expect(glowTransitionCompact).toHaveProperty('duration');
      expect(glowTransitionCompact).toHaveProperty('repeat');
      expect(glowTransitionExpanded).toHaveProperty('duration');
      expect(shimmerTransition).toHaveProperty('duration');
      expect(progressBarTransitionCompact).toHaveProperty('duration');
      expect(progressBarTransitionExpanded).toHaveProperty('duration');
      expect(barShimmerTransition).toHaveProperty('duration');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Daily Rewards Constants
// ═══════════════════════════════════════════════════════════════════════════

describe('daily-rewards/constants', () => {
  describe('DEFAULT_REWARDS', () => {
    it('exports a non-empty array', () => {
      expect(DEFAULT_REWARDS.length).toBeGreaterThan(0);
    });

    it('has exactly 7 days', () => {
      expect(DEFAULT_REWARDS).toHaveLength(7);
    });

    it('each reward has day, xp, and coins', () => {
      DEFAULT_REWARDS.forEach((r) => {
        expect(r).toHaveProperty('day');
        expect(r).toHaveProperty('xp');
        expect(typeof r.day).toBe('number');
        expect(typeof r.xp).toBe('number');
      });
    });

    it('days are sequential 1-7', () => {
      const days = DEFAULT_REWARDS.map((r) => r.day);
      expect(days).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it('all day values are unique', () => {
      const days = DEFAULT_REWARDS.map((r) => r.day);
      expect(new Set(days).size).toBe(days.length);
    });

    it('XP increases over the week', () => {
      for (let i = 1; i < DEFAULT_REWARDS.length; i++) {
        expect(DEFAULT_REWARDS[i]!.xp).toBeGreaterThanOrEqual(DEFAULT_REWARDS[i - 1]!.xp);
      }
    });

    it('day 7 has a special reward', () => {
      const day7 = DEFAULT_REWARDS.find((r) => r.day === 7);
      expect(day7?.special).toBeDefined();
      expect(day7?.special?.type).toBe('badge');
      expect(day7?.special?.name).toBeTruthy();
    });

    it('day 4 is marked premium', () => {
      const day4 = DEFAULT_REWARDS.find((r) => r.day === 4);
      expect(day4?.isPremium).toBe(true);
    });
  });

  describe('CONFETTI_COLORS', () => {
    it('is a non-empty array of hex strings', () => {
      expect(CONFETTI_COLORS.length).toBeGreaterThan(0);
      CONFETTI_COLORS.forEach((c) => {
        expect(c).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  describe('ANIMATION_DURATIONS (daily-rewards)', () => {
    it('has required keys', () => {
      expect(DR_ANIMATION_DURATIONS).toHaveProperty('claimedOverlay');
      expect(DR_ANIMATION_DURATIONS).toHaveProperty('cardStagger');
      expect(DR_ANIMATION_DURATIONS).toHaveProperty('shakeRepeat');
    });

    it('values are positive numbers', () => {
      expect(DR_ANIMATION_DURATIONS.claimedOverlay).toBeGreaterThan(0);
      expect(DR_ANIMATION_DURATIONS.cardStagger).toBeGreaterThan(0);
      expect(DR_ANIMATION_DURATIONS.shakeRepeat).toBeGreaterThan(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Prestige Utils
// ═══════════════════════════════════════════════════════════════════════════

describe('prestige-utils', () => {
  describe('BONUS_RATES', () => {
    it('has xp, coins, karma, dropRate', () => {
      expect(BONUS_RATES).toHaveProperty('xp');
      expect(BONUS_RATES).toHaveProperty('coins');
      expect(BONUS_RATES).toHaveProperty('karma');
      expect(BONUS_RATES).toHaveProperty('dropRate');
    });

    it('all rates are positive', () => {
      Object.values(BONUS_RATES).forEach((r) => expect(r).toBeGreaterThan(0));
    });
  });

  describe('calculateBonuses', () => {
    it('returns 0 bonuses for level 0', () => {
      const b = calculateBonuses(0);
      expect(b.xp).toBe(0);
      expect(b.coins).toBe(0);
      expect(b.karma).toBe(0);
      expect(b.dropRate).toBe(0);
    });

    it('scales linearly with level', () => {
      const b1 = calculateBonuses(1);
      const b5 = calculateBonuses(5);
      expect(b5.xp).toBeCloseTo(b1.xp * 5);
      expect(b5.coins).toBeCloseTo(b1.coins * 5);
    });
  });

  describe('calculateXpRequired', () => {
    it('returns 100000 for level 0', () => {
      expect(calculateXpRequired(0)).toBe(100000);
    });

    it('returns 0 for negative levels', () => {
      expect(calculateXpRequired(-1)).toBe(0);
    });

    it('scales exponentially', () => {
      expect(calculateXpRequired(2)).toBeGreaterThan(calculateXpRequired(1));
      expect(calculateXpRequired(5)).toBeGreaterThan(calculateXpRequired(3));
    });
  });

  describe('getDefaultRewardsForLevel', () => {
    it('always includes title and xp_bonus', () => {
      const r = getDefaultRewardsForLevel(1);
      const types = r.map((rr) => rr.type);
      expect(types).toContain('title');
      expect(types).toContain('xp_bonus');
    });

    it('level 3+ includes badge', () => {
      const r = getDefaultRewardsForLevel(3);
      expect(r.some((rr) => rr.type === 'badge')).toBe(true);
    });

    it('level 5+ includes effect', () => {
      const r = getDefaultRewardsForLevel(5);
      expect(r.some((rr) => rr.type === 'effect')).toBe(true);
    });

    it('level 10+ includes border', () => {
      const r = getDefaultRewardsForLevel(10);
      expect(r.some((rr) => rr.type === 'border')).toBe(true);
    });

    it('level 20 has most rewards', () => {
      const r20 = getDefaultRewardsForLevel(20);
      const r1 = getDefaultRewardsForLevel(1);
      expect(r20.length).toBeGreaterThan(r1.length);
    });
  });

  describe('XP_REWARDS', () => {
    it('exports an object with known keys', () => {
      expect(XP_REWARDS).toHaveProperty('SEND_MESSAGE');
      expect(XP_REWARDS).toHaveProperty('CREATE_POST');
      expect(XP_REWARDS).toHaveProperty('DAILY_LOGIN');
      expect(XP_REWARDS).toHaveProperty('STREAK_7_DAYS');
    });

    it('all values are numbers', () => {
      Object.values(XP_REWARDS).forEach((v) => expect(typeof v).toBe('number'));
    });

    it('streak multipliers are >= 1', () => {
      expect(XP_REWARDS.STREAK_3_DAYS).toBeGreaterThanOrEqual(1);
      expect(XP_REWARDS.STREAK_7_DAYS).toBeGreaterThanOrEqual(1);
      expect(XP_REWARDS.STREAK_30_DAYS).toBeGreaterThanOrEqual(1);
    });
  });
});

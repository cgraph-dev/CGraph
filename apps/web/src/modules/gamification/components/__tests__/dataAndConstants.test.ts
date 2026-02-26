// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { describe, it, expect } from 'vitest';
import {
  calculateXPForLevel,
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
} from '../level-progress.constants';
import { navItems } from '@/layouts/app-layout/constants';

// ── XP Calculation Tests ───────────────────────────────────────────────

describe('level-progress.constants', () => {
  describe('calculateXPForLevel', () => {
    it('returns 100 XP for level 1', () => {
      expect(calculateXPForLevel(1)).toBe(100);
    });

    it('returns increasing XP for higher levels', () => {
      const xp1 = calculateXPForLevel(1);
      const xp2 = calculateXPForLevel(2);
      const xp5 = calculateXPForLevel(5);
      const xp10 = calculateXPForLevel(10);

      expect(xp2).toBeGreaterThan(xp1);
      expect(xp5).toBeGreaterThan(xp2);
      expect(xp10).toBeGreaterThan(xp5);
    });

    it('uses exponential growth (BASE_XP * level^1.8)', () => {
      // level 2: floor(100 * 2^1.8) = floor(100 * 3.4822...) = 348
      expect(calculateXPForLevel(2)).toBe(Math.floor(100 * Math.pow(2, 1.8)));
      // level 3: floor(100 * 3^1.8) = floor(100 * 7.2247...) = 722
      expect(calculateXPForLevel(3)).toBe(Math.floor(100 * Math.pow(3, 1.8)));
    });

    it('returns integer values', () => {
      for (let i = 1; i <= 20; i++) {
        const xp = calculateXPForLevel(i);
        expect(Number.isInteger(xp)).toBe(true);
      }
    });

    it('returns positive values for all positive levels', () => {
      for (let i = 1; i <= 100; i++) {
        expect(calculateXPForLevel(i)).toBeGreaterThan(0);
      }
    });
  });

  describe('getStreakMultiplier', () => {
    it('returns 1.0 for streaks less than 3 days', () => {
      expect(getStreakMultiplier(0)).toBe(1.0);
      expect(getStreakMultiplier(1)).toBe(1.0);
      expect(getStreakMultiplier(2)).toBe(1.0);
    });

    it('returns 1.5 for 3-6 day streaks', () => {
      expect(getStreakMultiplier(3)).toBe(1.5);
      expect(getStreakMultiplier(4)).toBe(1.5);
      expect(getStreakMultiplier(5)).toBe(1.5);
      expect(getStreakMultiplier(6)).toBe(1.5);
    });

    it('returns 2.0 for streaks of 7+ days', () => {
      expect(getStreakMultiplier(7)).toBe(2.0);
      expect(getStreakMultiplier(14)).toBe(2.0);
      expect(getStreakMultiplier(100)).toBe(2.0);
    });
  });

  describe('XP_NOTIFICATION_DURATION', () => {
    it('is 3000ms', () => {
      expect(XP_NOTIFICATION_DURATION).toBe(3000);
    });
  });

  describe('animation presets', () => {
    it('glowPulseCompact has correct shape', () => {
      expect(glowPulseCompact).toHaveProperty('opacity');
      expect(glowPulseCompact).toHaveProperty('scale');
      expect(Array.isArray(glowPulseCompact.opacity)).toBe(true);
      expect(Array.isArray(glowPulseCompact.scale)).toBe(true);
    });

    it('glowPulseExpanded has correct shape', () => {
      expect(glowPulseExpanded).toHaveProperty('opacity');
      expect(glowPulseExpanded).toHaveProperty('scale');
    });

    it('transitions have duration and repeat', () => {
      expect(glowTransitionCompact.duration).toBe(2);
      expect(glowTransitionCompact.repeat).toBe(Infinity);

      expect(glowTransitionExpanded.duration).toBe(3);
      expect(glowTransitionExpanded.repeat).toBe(Infinity);
    });

    it('shimmerTransition uses linear ease', () => {
      expect(shimmerTransition.ease).toBe('linear');
      expect(shimmerTransition.repeat).toBe(Infinity);
    });

    it('progressBar transitions use easeOut', () => {
      expect(progressBarTransitionCompact.ease).toBe('easeOut');
      expect(progressBarTransitionCompact.duration).toBe(1);
      expect(progressBarTransitionExpanded.ease).toBe('easeOut');
      expect(progressBarTransitionExpanded.duration).toBe(1.5);
    });

    it('barShimmerTransition repeats infinitely', () => {
      expect(barShimmerTransition.repeat).toBe(Infinity);
      expect(barShimmerTransition.ease).toBe('linear');
    });
  });
});

// ── App Layout Constants ───────────────────────────────────────────────

describe('app-layout/constants — navItems', () => {
  it('has 6 navigation items', () => {
    expect(navItems).toHaveLength(6);
  });

  it('each item has path, label, icon, and activeIcon', () => {
    for (const item of navItems) {
      expect(typeof item.path).toBe('string');
      expect(item.path.startsWith('/')).toBe(true);
      expect(typeof item.label).toBe('string');
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.icon).toBeDefined();
      expect(item.activeIcon).toBeDefined();
    }
  });

  it('includes required routes', () => {
    const paths = navItems.map((n) => n.path);
    expect(paths).toContain('/messages');
    expect(paths).toContain('/social');
    expect(paths).toContain('/settings');
    expect(paths).toContain('/forums');
    expect(paths).toContain('/customize');
    expect(paths).toContain('/profile');
  });

  it('has unique paths', () => {
    const paths = navItems.map((n) => n.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('has unique labels', () => {
    const labels = navItems.map((n) => n.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('Messages is the first item', () => {
    expect(navItems[0].label).toBe('Messages');
    expect(navItems[0].path).toBe('/messages');
  });

  it('Settings is the last item', () => {
    expect(navItems[navItems.length - 1].label).toBe('Settings');
    expect(navItems[navItems.length - 1].path).toBe('/settings');
  });
});

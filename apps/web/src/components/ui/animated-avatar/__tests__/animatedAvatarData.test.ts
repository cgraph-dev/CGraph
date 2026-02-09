/**
 * AnimatedAvatar Constants, Animations & Data Tests
 *
 * Tests for exported data structures in animated-avatar:
 * - constants.ts (BORDER_STYLES, SIZE_CONFIG, STATUS_COLORS, etc.)
 * - animations.ts (getShapeStyles, getBorderGradient, getAnimationProps, getParticleEmoji)
 */

import { describe, it, expect } from 'vitest';

import {
  defaultAvatarStyle,
  DEFAULT_OWNED_STYLES,
  BORDER_STYLES,
  SIZE_CONFIG,
  STATUS_COLORS,
  ANIMATION_DURATIONS,
} from '../constants';

import {
  getShapeStyles,
  getBorderGradient,
  getAnimationProps,
  getParticleEmoji,
} from '../animations';

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

describe('animated-avatar/constants', () => {
  describe('defaultAvatarStyle', () => {
    it('has all required fields', () => {
      expect(defaultAvatarStyle).toHaveProperty('borderStyle');
      expect(defaultAvatarStyle).toHaveProperty('borderWidth');
      expect(defaultAvatarStyle).toHaveProperty('borderColor');
      expect(defaultAvatarStyle).toHaveProperty('secondaryColor');
      expect(defaultAvatarStyle).toHaveProperty('glowIntensity');
      expect(defaultAvatarStyle).toHaveProperty('animationSpeed');
      expect(defaultAvatarStyle).toHaveProperty('shape');
      expect(defaultAvatarStyle).toHaveProperty('particleEffect');
      expect(defaultAvatarStyle).toHaveProperty('pulseOnHover');
      expect(defaultAvatarStyle).toHaveProperty('showLevel');
      expect(defaultAvatarStyle).toHaveProperty('levelBadgeStyle');
    });

    it('defaults to gradient border style', () => {
      expect(defaultAvatarStyle.borderStyle).toBe('gradient');
    });

    it('defaults to circle shape', () => {
      expect(defaultAvatarStyle.shape).toBe('circle');
    });

    it('defaults to no particle effect', () => {
      expect(defaultAvatarStyle.particleEffect).toBe('none');
    });
  });

  describe('DEFAULT_OWNED_STYLES', () => {
    it('is a non-empty array', () => {
      expect(DEFAULT_OWNED_STYLES.length).toBeGreaterThan(0);
    });

    it('includes free styles', () => {
      expect(DEFAULT_OWNED_STYLES).toContain('none');
      expect(DEFAULT_OWNED_STYLES).toContain('solid');
      expect(DEFAULT_OWNED_STYLES).toContain('gradient');
      expect(DEFAULT_OWNED_STYLES).toContain('pulse');
    });
  });

  describe('BORDER_STYLES', () => {
    it('exports a non-empty array', () => {
      expect(BORDER_STYLES.length).toBeGreaterThan(0);
    });

    it('each border style has required fields', () => {
      BORDER_STYLES.forEach((bs) => {
        expect(bs).toHaveProperty('id');
        expect(bs).toHaveProperty('name');
        expect(bs).toHaveProperty('category');
        expect(bs).toHaveProperty('description');
        expect(bs).toHaveProperty('coinPrice');
        expect(typeof bs.id).toBe('string');
        expect(typeof bs.name).toBe('string');
        expect(typeof bs.coinPrice).toBe('number');
      });
    });

    it('all IDs are unique', () => {
      const ids = BORDER_STYLES.map((bs) => bs.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('all names are unique', () => {
      const names = BORDER_STYLES.map((bs) => bs.name);
      expect(new Set(names).size).toBe(names.length);
    });

    it('categories are valid', () => {
      const valid = new Set(['free', 'premium', 'legendary', 'limited']);
      BORDER_STYLES.forEach((bs) => {
        expect(valid.has(bs.category)).toBe(true);
      });
    });

    it('free styles have 0 coinPrice', () => {
      const freeStyles = BORDER_STYLES.filter((bs) => bs.category === 'free');
      expect(freeStyles.length).toBeGreaterThan(0);
      freeStyles.forEach((bs) => {
        expect(bs.coinPrice).toBe(0);
      });
    });

    it('premium styles have positive coinPrice', () => {
      const premiumStyles = BORDER_STYLES.filter((bs) => bs.category === 'premium');
      expect(premiumStyles.length).toBeGreaterThan(0);
      premiumStyles.forEach((bs) => {
        expect(bs.coinPrice).toBeGreaterThan(0);
      });
    });

    it('legendary styles have coinPrice > premium max', () => {
      const premiumMax = Math.max(
        ...BORDER_STYLES.filter((bs) => bs.category === 'premium').map((bs) => bs.coinPrice)
      );
      const legendaryStyles = BORDER_STYLES.filter((bs) => bs.category === 'legendary');
      expect(legendaryStyles.length).toBeGreaterThan(0);
      legendaryStyles.forEach((bs) => {
        expect(bs.coinPrice).toBeGreaterThan(premiumMax);
      });
    });
  });

  describe('SIZE_CONFIG', () => {
    it('has all expected size keys', () => {
      expect(SIZE_CONFIG).toHaveProperty('xs');
      expect(SIZE_CONFIG).toHaveProperty('sm');
      expect(SIZE_CONFIG).toHaveProperty('md');
      expect(SIZE_CONFIG).toHaveProperty('lg');
      expect(SIZE_CONFIG).toHaveProperty('xl');
      expect(SIZE_CONFIG).toHaveProperty('2xl');
      expect(SIZE_CONFIG).toHaveProperty('3xl');
    });

    it('each size config has container, text, badge, levelSize', () => {
      Object.values(SIZE_CONFIG).forEach((cfg) => {
        expect(cfg).toHaveProperty('container');
        expect(cfg).toHaveProperty('text');
        expect(cfg).toHaveProperty('badge');
        expect(cfg).toHaveProperty('levelSize');
      });
    });
  });

  describe('STATUS_COLORS', () => {
    it('has all status types', () => {
      expect(STATUS_COLORS).toHaveProperty('online');
      expect(STATUS_COLORS).toHaveProperty('idle');
      expect(STATUS_COLORS).toHaveProperty('dnd');
      expect(STATUS_COLORS).toHaveProperty('offline');
    });

    it('each status has bg and glow', () => {
      Object.values(STATUS_COLORS).forEach((sc) => {
        expect(sc).toHaveProperty('bg');
        expect(sc).toHaveProperty('glow');
      });
    });
  });

  describe('ANIMATION_DURATIONS', () => {
    it('has all speed keys', () => {
      expect(ANIMATION_DURATIONS).toHaveProperty('none');
      expect(ANIMATION_DURATIONS).toHaveProperty('slow');
      expect(ANIMATION_DURATIONS).toHaveProperty('normal');
      expect(ANIMATION_DURATIONS).toHaveProperty('fast');
      expect(ANIMATION_DURATIONS).toHaveProperty('ultra');
    });

    it('none is 0', () => {
      expect(ANIMATION_DURATIONS.none).toBe(0);
    });

    it('speeds are ordered: slow > normal > fast > ultra', () => {
      expect(ANIMATION_DURATIONS.slow).toBeGreaterThan(ANIMATION_DURATIONS.normal);
      expect(ANIMATION_DURATIONS.normal).toBeGreaterThan(ANIMATION_DURATIONS.fast);
      expect(ANIMATION_DURATIONS.fast).toBeGreaterThan(ANIMATION_DURATIONS.ultra);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Animations
// ═══════════════════════════════════════════════════════════════════════════

describe('animated-avatar/animations', () => {
  describe('getShapeStyles', () => {
    it('returns rounded-full for circle', () => {
      expect(getShapeStyles('circle')).toBe('rounded-full');
    });

    it('returns rounded-2xl for rounded-square', () => {
      expect(getShapeStyles('rounded-square')).toBe('rounded-2xl');
    });

    it('returns clip-path class for hexagon', () => {
      expect(getShapeStyles('hexagon')).toContain('clip-path');
    });

    it('returns clip-path class for octagon', () => {
      expect(getShapeStyles('octagon')).toContain('clip-path');
    });

    it('returns clip-path class for diamond', () => {
      expect(getShapeStyles('diamond')).toContain('clip-path');
    });

    it('returns rounded class for shield', () => {
      expect(getShapeStyles('shield')).toContain('rounded');
    });

    it('defaults to rounded-full for unknown shape', () => {
      expect(getShapeStyles('unknown' as never)).toBe('rounded-full');
    });
  });

  describe('getBorderGradient', () => {
    it('returns transparent for none', () => {
      expect(getBorderGradient({ ...defaultAvatarStyle, borderStyle: 'none' })).toBe('transparent');
    });

    it('returns borderColor for solid', () => {
      const style = {
        ...defaultAvatarStyle,
        borderStyle: 'solid' as const,
        borderColor: '#ff0000',
      };
      expect(getBorderGradient(style)).toBe('#ff0000');
    });

    it('returns linear-gradient for gradient', () => {
      const result = getBorderGradient({ ...defaultAvatarStyle, borderStyle: 'gradient' });
      expect(result).toContain('linear-gradient');
    });

    it('returns rainbow gradient for rainbow', () => {
      const result = getBorderGradient({ ...defaultAvatarStyle, borderStyle: 'rainbow' });
      expect(result).toContain('#ff0000');
    });

    it('returns radial gradient for supernova', () => {
      const result = getBorderGradient({ ...defaultAvatarStyle, borderStyle: 'supernova' });
      expect(result).toContain('radial-gradient');
    });

    it('returns radial gradient for black_hole', () => {
      const result = getBorderGradient({ ...defaultAvatarStyle, borderStyle: 'black_hole' });
      expect(result).toContain('radial-gradient');
    });
  });

  describe('getAnimationProps', () => {
    it('returns empty object for none speed', () => {
      const result = getAnimationProps({ ...defaultAvatarStyle, animationSpeed: 'none' });
      expect(result).toEqual({});
    });

    it('returns pulse animation for pulse style', () => {
      const result = getAnimationProps({
        ...defaultAvatarStyle,
        borderStyle: 'pulse',
        animationSpeed: 'normal',
      });
      expect(result.animate).toBeDefined();
      expect(result.transition).toBeDefined();
    });

    it('returns spin animation for spin style', () => {
      const result = getAnimationProps({
        ...defaultAvatarStyle,
        borderStyle: 'spin',
        animationSpeed: 'normal',
      });
      expect(result.animate).toHaveProperty('rotate');
    });

    it('returns glow animation for glow style', () => {
      const result = getAnimationProps({
        ...defaultAvatarStyle,
        borderStyle: 'glow',
        animationSpeed: 'fast',
      });
      expect(result.animate).toHaveProperty('boxShadow');
    });

    it('returns empty object for unknown border style', () => {
      const result = getAnimationProps({
        ...defaultAvatarStyle,
        borderStyle: 'solid',
        animationSpeed: 'normal',
      });
      expect(result).toEqual({});
    });
  });

  describe('getParticleEmoji', () => {
    it('returns empty array for none', () => {
      expect(getParticleEmoji('none')).toEqual([]);
    });

    it('returns sparkle emojis for sparkles', () => {
      const result = getParticleEmoji('sparkles');
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('✨');
    });

    it('returns fire emojis for flames', () => {
      const result = getParticleEmoji('flames');
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('🔥');
    });

    it('returns heart emojis for hearts', () => {
      const result = getParticleEmoji('hearts');
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('❤️');
    });

    it('returns snow emojis for snow', () => {
      const result = getParticleEmoji('snow');
      expect(result.length).toBeGreaterThan(0);
    });

    it('returns star emojis for stars', () => {
      const result = getParticleEmoji('stars');
      expect(result.length).toBeGreaterThan(0);
    });

    it('returns bubble shapes for bubbles', () => {
      const result = getParticleEmoji('bubbles');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});

// @ts-nocheck
/**
 * Animation Effects Extended Tests
 *
 * Additional coverage for particle animations, background animations,
 * hover edge cases, and factory function return shapes.
 */

import { describe, it, expect } from 'vitest';

import { springs, staggerConfigs } from '../presets';
import { chatBubbleAnimations } from '../chat-bubbles';
import {
  hoverAnimations,
  createFireAnimation,
  createElectricAnimation,
  particleAnimations,
  backgroundAnimations,
  getStaggerDelay,
  createRepeatTransition,
  createSpring,
  getRarityGlow,
  getTierGlow,
} from '../effects';

// =============================================================================
// PARTICLE ANIMATIONS — DEEPER COVERAGE
// =============================================================================

describe('particleAnimations (extended)', () => {
  describe('float', () => {
    it('uses default baseY of -30 when no argument', () => {
      const f = particleAnimations.float();
      const y = f.animate.y as number[];
      expect(y).toEqual([0, -30, 0]);
    });

    it('accepts custom baseY', () => {
      const f = particleAnimations.float(-50);
      const y = f.animate.y as number[];
      expect(y[1]).toBe(-50);
    });

    it('animates opacity and scale', () => {
      const f = particleAnimations.float();
      expect(f.animate.opacity).toEqual([0.3, 0.8, 0.3]);
      expect(f.animate.scale).toEqual([0.5, 1, 0.5]);
    });
  });

  describe('rise', () => {
    it('moves upward (negative y) and fades out', () => {
      const { animate } = particleAnimations.rise;
      const y = animate.y as number[];
      expect(y[1]).toBeLessThan(y[0]);
      const opacity = animate.opacity as number[];
      expect(opacity[opacity.length - 1]).toBe(0);
    });

    it('includes x oscillation', () => {
      const x = particleAnimations.rise.animate.x as number[];
      expect(x.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('fall', () => {
    it('moves downward (positive y)', () => {
      const y = particleAnimations.fall.animate.y as number[];
      expect(y[1]).toBeGreaterThan(y[0]);
    });
  });

  describe('sparkle', () => {
    it('scales from 0 to peak then back to 0', () => {
      const s = particleAnimations.sparkle.animate.scale as number[];
      expect(s[0]).toBe(0);
      expect(s[s.length - 1]).toBe(0);
      expect(Math.max(...s)).toBeGreaterThan(0);
    });

    it('rotates', () => {
      expect(particleAnimations.sparkle.animate.rotate).toBeDefined();
    });
  });

  describe('orbit', () => {
    it('produces circular-ish positions', () => {
      const total = 8;
      const positions = Array.from({ length: total }, (_, i) =>
        particleAnimations.orbit(i, total, 25)
      );
      // Each position should have x and y arrays starting and ending at 0
      for (const p of positions) {
        const x = p.animate.x as number[];
        const y = p.animate.y as number[];
        expect(x[0]).toBe(0);
        expect(x[x.length - 1]).toBe(0);
        expect(y[0]).toBe(0);
        expect(y[y.length - 1]).toBe(0);
      }
    });

    it('uses the specified radius', () => {
      const radius = 40;
      const p = particleAnimations.orbit(0, 4, radius);
      const x = p.animate.x as number[];
      // At index 0 of 4, cos(0) = 1, so x[1] should be radius
      expect(x[1]).toBeCloseTo(radius, 5);
    });

    it('produces opacity animation', () => {
      const p = particleAnimations.orbit(0, 4);
      expect(p.animate.opacity).toBeDefined();
    });
  });
});

// =============================================================================
// BACKGROUND ANIMATIONS — DEEPER COVERAGE
// =============================================================================

describe('backgroundAnimations (extended)', () => {
  describe('gradientShift', () => {
    it('has backgroundPosition keyframes', () => {
      expect(backgroundAnimations.gradientShift.animate.backgroundPosition).toBeDefined();
      const pos = backgroundAnimations.gradientShift.animate.backgroundPosition as string[];
      expect(pos.length).toBe(3);
    });

    it('uses linear easing', () => {
      expect(backgroundAnimations.gradientShift.transition.ease).toBe('linear');
    });
  });

  describe('aurora', () => {
    it('creates gradient backgrounds from 2 colors', () => {
      const a = backgroundAnimations.aurora(['#ff0000', '#00ff00']);
      const bg = a.animate.background as string[];
      expect(bg.length).toBeGreaterThanOrEqual(4);
      for (const gradient of bg) {
        expect(gradient).toContain('#ff0000');
        expect(gradient).toContain('#00ff00');
      }
    });

    it('uses linear ease for smooth rotation', () => {
      const a = backgroundAnimations.aurora(['#aaa']);
      expect(a.transition.ease).toBe('linear');
    });
  });

  describe('pulse', () => {
    it('returns opacity and scale animation', () => {
      const p = backgroundAnimations.pulse();
      expect(p.animate.opacity).toBeDefined();
      expect(p.animate.scale).toBeDefined();
    });

    it('repeats infinitely with easeInOut', () => {
      const p = backgroundAnimations.pulse();
      expect(p.transition.repeat).toBe(Infinity);
      expect(p.transition.ease).toBe('easeInOut');
    });
  });
});

// =============================================================================
// HOVER ANIMATIONS — EDGE CASES
// =============================================================================

describe('hoverAnimations (extended)', () => {
  it('lift includes whileTap', () => {
    expect(hoverAnimations.lift.whileTap).toBeDefined();
    expect(hoverAnimations.lift.whileTap!.scale).toBeLessThan(1);
  });

  it('pop has larger scale than regular scale preset', () => {
    const popScale = (hoverAnimations.pop.whileHover as { scale: number }).scale;
    const scaleScale = (hoverAnimations.scale.whileHover as { scale: number }).scale;
    expect(popScale).toBeGreaterThan(scaleScale);
  });

  it('tilt rotates', () => {
    const tilt = hoverAnimations.tilt.whileHover as { rotate: number };
    expect(tilt.rotate).toBeDefined();
  });
});

// =============================================================================
// CHAT BUBBLE ANIMATIONS — EDGE CASES
// =============================================================================

describe('chatBubbleAnimations (extended)', () => {
  it('all animations start with opacity 0', () => {
    const allStyles = Object.keys(chatBubbleAnimations);
    for (const style of allStyles) {
      const result = chatBubbleAnimations[style]!(false, 0);
      const initial = result.initial as Record<string, unknown>;
      expect(initial.opacity).toBe(0);
    }
  });

  it('all animations end with opacity 1', () => {
    const allStyles = Object.keys(chatBubbleAnimations);
    for (const style of allStyles) {
      const result = chatBubbleAnimations[style]!(false, 0);
      const animate = result.animate as Record<string, unknown>;
      expect(animate.opacity).toBe(1);
    }
  });

  it('bubble-telegram uses directional offset based on isOwn', () => {
    const own = chatBubbleAnimations['bubble-telegram']!(true, 0);
    const other = chatBubbleAnimations['bubble-telegram']!(false, 0);
    const ownX = (own.initial as Record<string, unknown>).x as number;
    const otherX = (other.initial as Record<string, unknown>).x as number;
    expect(ownX).toBeGreaterThan(0);
    expect(otherX).toBeLessThan(0);
  });

  it('bubble-minimal has simplest animation (opacity only)', () => {
    const result = chatBubbleAnimations['bubble-minimal']!(false, 0);
    const initial = result.initial as Record<string, unknown>;
    expect(Object.keys(initial)).toEqual(['opacity']);
  });

  it('bubble-neon includes filter blur in initial', () => {
    const result = chatBubbleAnimations['bubble-neon']!(false, 0);
    const initial = result.initial as Record<string, unknown>;
    expect(initial.filter).toContain('blur');
  });
});

// =============================================================================
// FACTORY FUNCTIONS — EDGE CASES
// =============================================================================

describe('createFireAnimation (extended)', () => {
  it('handles single-color array by reusing color', () => {
    const fire = createFireAnimation(['#ff0000']);
    const shadows = fire.animate.boxShadow as string[];
    for (const s of shadows) {
      expect(s).toContain('#ff0000');
    }
  });

  it('animates y position', () => {
    const fire = createFireAnimation(['#ff0000']);
    expect(fire.animate.y).toBeDefined();
  });
});

describe('createElectricAnimation (extended)', () => {
  it('includes repeatDelay', () => {
    const e = createElectricAnimation('#00bfff');
    expect(e.transition.repeatDelay).toBe(0.5);
  });

  it('boxShadow array includes the color', () => {
    const color = '#ff00ff';
    const e = createElectricAnimation(color);
    const shadows = e.animate.boxShadow as string[];
    for (const s of shadows) {
      expect(s).toContain(color);
    }
  });
});

describe('getStaggerDelay (extended)', () => {
  it('uses "fast" config', () => {
    const d = getStaggerDelay(3, 'fast');
    expect(d).toBe(staggerConfigs.fast.delayChildren + 3 * staggerConfigs.fast.staggerChildren);
  });

  it('uses "grid" config', () => {
    const d = getStaggerDelay(5, 'grid');
    expect(d).toBe(staggerConfigs.grid.delayChildren + 5 * staggerConfigs.grid.staggerChildren);
  });
});

describe('createRepeatTransition (extended)', () => {
  it('accepts custom ease options', () => {
    expect(createRepeatTransition(1, 3, 'easeIn').ease).toBe('easeIn');
    expect(createRepeatTransition(1, 3, 'easeOut').ease).toBe('easeOut');
  });
});

describe('createSpring (extended)', () => {
  it('supports all named presets', () => {
    const presetNames = Object.keys(springs) as (keyof typeof springs)[];
    for (const name of presetNames) {
      const s = createSpring(name);
      expect(s).toHaveProperty('type', 'spring');
      expect(s).toHaveProperty('stiffness', springs[name].stiffness);
      expect(s).toHaveProperty('damping', springs[name].damping);
    }
  });

  it('omits delay when not provided', () => {
    const s = createSpring('gentle');
    expect(s).not.toHaveProperty('delay');
  });
});

describe('getRarityGlow (extended)', () => {
  it('covers all defined rarities', () => {
    expect(getRarityGlow('common')).toBe('#9ca3af');
    expect(getRarityGlow('epic')).toBe('#8b5cf6');
  });
});

describe('getTierGlow (extended)', () => {
  it('covers all defined tiers', () => {
    expect(getTierGlow('free')).toBe('#10b981');
    expect(getTierGlow('premium')).toBe('#8b5cf6');
    expect(getTierGlow('elite')).toBe('#ec4899');
  });
});

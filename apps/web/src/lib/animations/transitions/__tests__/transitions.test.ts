/**
 * Animation Transitions - Unit Tests
 *
 * Tests for core configs, helper functions, and component variants.
 */

import { describe, it, expect, vi } from 'vitest';

import { easings, springs, durations, staggerConfigs } from '../core';
import {
  createStaggerContainer,
  withDelay,
  createSpring,
  createTween,
  gpuAccelerated,
  safeCSSProps,
  getReducedMotion,
  getAccessibleTransition,
} from '../helpers';
import {
  pageTransitions,
  listItemVariants,
  cardVariants,
  modalVariants,
  notificationVariants,
  loadingVariants,
  skeletonVariants,
  badgeVariants,
} from '../variants';

// =============================================================================
// CORE
// =============================================================================

describe('easings', () => {
  it('should define all standard easing arrays with 4 values', () => {
    for (const key of Object.keys(easings) as (keyof typeof easings)[]) {
      expect(easings[key]).toHaveLength(4);
      for (const v of easings[key]) {
        expect(typeof v).toBe('number');
      }
    }
  });
});

describe('springs (transitions/core)', () => {
  it('should define gentle, default, bouncy, snappy, smooth presets', () => {
    for (const key of ['gentle', 'default', 'bouncy', 'snappy', 'smooth'] as const) {
      expect(springs[key].type).toBe('spring');
      expect(springs[key].stiffness).toBeGreaterThan(0);
      expect(springs[key].damping).toBeGreaterThan(0);
    }
  });

  it('should have increasing stiffness from gentle to snappy', () => {
    expect(springs.gentle.stiffness).toBeLessThan(springs.default.stiffness);
    expect(springs.default.stiffness).toBeLessThanOrEqual(springs.bouncy.stiffness);
    expect(springs.bouncy.stiffness).toBeLessThan(springs.snappy.stiffness);
  });
});

describe('durations', () => {
  it('should have increasing duration values', () => {
    expect(durations.instant).toBe(0);
    expect(durations.fast).toBeLessThan(durations.normal);
    expect(durations.normal).toBeLessThan(durations.smooth);
    expect(durations.smooth).toBeLessThan(durations.slow);
    expect(durations.slow).toBeLessThan(durations.cinematic);
  });
});

describe('staggerConfigs (transitions/core)', () => {
  it('should have increasing delay from quick to cinematic', () => {
    expect(staggerConfigs.quick.staggerChildren).toBeLessThanOrEqual(
      staggerConfigs.normal.staggerChildren
    );
    expect(staggerConfigs.normal.staggerChildren).toBeLessThanOrEqual(
      staggerConfigs.slow.staggerChildren
    );
    expect(staggerConfigs.slow.staggerChildren).toBeLessThanOrEqual(
      staggerConfigs.cinematic.staggerChildren
    );
  });
});

// =============================================================================
// HELPERS
// =============================================================================

describe('createStaggerContainer', () => {
  it('should return hidden and visible variants', () => {
    const variants = createStaggerContainer('normal');
    expect(variants).toHaveProperty('hidden');
    expect(variants).toHaveProperty('visible');
  });

  it('should start with opacity 0 and animate to 1', () => {
    const variants = createStaggerContainer();
    expect((variants.hidden as Record<string, unknown>).opacity).toBe(0);
    expect((variants.visible as Record<string, unknown>).opacity).toBe(1);
  });

  it('should use the specified stagger config', () => {
    const variants = createStaggerContainer('cinematic');
    const transition = (variants.visible as Record<string, unknown>).transition as Record<
      string,
      number
    >;
    expect(transition.staggerChildren).toBe(staggerConfigs.cinematic.staggerChildren);
    expect(transition.delayChildren).toBe(staggerConfigs.cinematic.delayChildren);
  });
});

describe('withDelay', () => {
  it('should add delay to variants that have transitions', () => {
    const base = {
      hidden: { opacity: 0, transition: { duration: 0.3 } },
      visible: { opacity: 1, transition: { duration: 0.3 } },
    };
    const delayed = withDelay(base, 0.5);
    expect((delayed.hidden as Record<string, unknown>).transition).toHaveProperty('delay', 0.5);
  });

  it('should preserve variants without transitions unchanged', () => {
    const base = {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.3 } },
    };
    const delayed = withDelay(base, 0.2);
    expect((delayed.hidden as Record<string, unknown>).opacity).toBe(0);
    expect(delayed.hidden).not.toHaveProperty('transition');
  });
});

describe('createSpring (helpers)', () => {
  it('should return spring transition with given values', () => {
    const s = createSpring(300, 20);
    expect(s).toEqual({ type: 'spring', stiffness: 300, damping: 20 });
  });
});

describe('createTween', () => {
  it('should return tween with duration and easing', () => {
    const t = createTween(0.5, 'easeOut');
    expect(t).toEqual({ duration: 0.5, ease: easings.easeOut });
  });

  it('should default to easeInOut', () => {
    const t = createTween(1);
    expect(t).toEqual({ duration: 1, ease: easings.easeInOut });
  });
});

describe('gpuAccelerated', () => {
  it('should flag transform properties as true', () => {
    expect(gpuAccelerated.translateX).toBe(true);
    expect(gpuAccelerated.translateY).toBe(true);
    expect(gpuAccelerated.scale).toBe(true);
    expect(gpuAccelerated.opacity).toBe(true);
  });

  it('should set willChange to transform and opacity', () => {
    expect(gpuAccelerated.willChange).toBe('transform, opacity');
  });
});

describe('safeCSSProps', () => {
  it('should include transform, opacity, filter, backdrop-filter', () => {
    expect(safeCSSProps).toContain('transform');
    expect(safeCSSProps).toContain('opacity');
    expect(safeCSSProps).toContain('filter');
    expect(safeCSSProps).toContain('backdrop-filter');
  });
});

describe('getReducedMotion', () => {
  it('should return false when window.matchMedia reports no preference', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
    } as MediaQueryList);
    expect(getReducedMotion()).toBe(false);
  });

  it('should return true when prefers-reduced-motion is set', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
    } as MediaQueryList);
    expect(getReducedMotion()).toBe(true);
  });
});

describe('getAccessibleTransition', () => {
  it('should return normal transition when motion is not reduced', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
    } as MediaQueryList);
    const normal = { duration: 0.5 };
    expect(getAccessibleTransition(normal)).toEqual(normal);
  });

  it('should return reduced transition when motion is reduced', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
    } as MediaQueryList);
    const reduced = { duration: 0 };
    expect(getAccessibleTransition({ duration: 0.5 }, reduced)).toEqual(reduced);
  });

  it('should default to duration 0 when no reduced fallback given', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
    } as MediaQueryList);
    expect(getAccessibleTransition({ duration: 0.5 })).toEqual({ duration: 0 });
  });
});

// =============================================================================
// VARIANTS
// =============================================================================

describe('pageTransitions', () => {
  it('should define fade, slideRight, slideLeft, slideUp, scale, blur', () => {
    for (const key of ['fade', 'slideRight', 'slideLeft', 'slideUp', 'scale', 'blur'] as const) {
      expect(pageTransitions[key]).toHaveProperty('initial');
      expect(pageTransitions[key]).toHaveProperty('animate');
      expect(pageTransitions[key]).toHaveProperty('exit');
    }
  });

  it('fade should start and exit at opacity 0', () => {
    expect(pageTransitions.fade.initial.opacity).toBe(0);
    expect(pageTransitions.fade.exit.opacity).toBe(0);
  });
});

describe('component variants shapes', () => {
  it('listItemVariants should have hidden, visible, exit', () => {
    expect(listItemVariants).toHaveProperty('hidden');
    expect(listItemVariants).toHaveProperty('visible');
    expect(listItemVariants).toHaveProperty('exit');
  });

  it('cardVariants should have hidden, visible, hover, tap', () => {
    expect(cardVariants).toHaveProperty('hidden');
    expect(cardVariants).toHaveProperty('visible');
    expect(cardVariants).toHaveProperty('hover');
    expect(cardVariants).toHaveProperty('tap');
  });

  it('modalVariants hidden should scale down and offset y', () => {
    const hidden = modalVariants.hidden as Record<string, unknown>;
    expect(hidden.opacity).toBe(0);
    expect(hidden.scale).toBe(0.9);
    expect(hidden.y).toBe(20);
  });

  it('notificationVariants should exit to the right', () => {
    const exit = notificationVariants.exit as Record<string, unknown>;
    expect(exit.x).toBe(100);
    expect(exit.opacity).toBe(0);
  });

  it('loadingVariants should define pulse, spin, bounce', () => {
    expect(loadingVariants).toHaveProperty('pulse');
    expect(loadingVariants).toHaveProperty('spin');
    expect(loadingVariants).toHaveProperty('bounce');
  });

  it('skeletonVariants should define pulse and shimmer', () => {
    expect(skeletonVariants).toHaveProperty('pulse');
    expect(skeletonVariants).toHaveProperty('shimmer');
  });

  it('badgeVariants hidden should start at scale 0 rotated', () => {
    const hidden = badgeVariants.hidden as Record<string, unknown>;
    expect(hidden.scale).toBe(0);
    expect(hidden.rotate).toBe(-180);
  });
});

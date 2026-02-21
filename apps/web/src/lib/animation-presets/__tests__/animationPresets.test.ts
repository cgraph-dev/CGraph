/**
 * Animation Presets - Unit Tests
 *
 * Tests for chat bubble animations, effects/utilities, and core presets.
 */

import { describe, it, expect } from 'vitest';

import { springs, tweens, staggerConfigs, entranceVariants } from '../presets';
import { chatBubbleAnimations } from '../chat-bubbles';
import {
  hoverAnimations,
  createPulseAnimation,
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
// CORE PRESETS
// =============================================================================

describe('springs', () => {
  it('should define all spring presets with correct type', () => {
    const presetNames = [
      'gentle',
      'default',
      'bouncy',
      'snappy',
      'superBouncy',
      'dramatic',
      'wobbly',
      'stiff',
      'smooth',
      'ultraSmooth',
    ] as const;

    for (const name of presetNames) {
      expect(springs[name]).toBeDefined();
      expect(springs[name].type).toBe('spring');
      expect(springs[name].stiffness).toBeGreaterThan(0);
      expect(springs[name].damping).toBeGreaterThan(0);
    }
  });

  it('should have increasing stiffness for snappier presets', () => {
    expect(springs.gentle.stiffness).toBeLessThan(springs.default.stiffness);
    expect(springs.default.stiffness).toBeLessThan(springs.snappy.stiffness);
    // stiff has high damping (less overshoot) but not necessarily higher stiffness
    expect(springs.stiff.stiffness).toBeGreaterThan(0);
  });
});

describe('tweens', () => {
  it('should define quickFade with short duration', () => {
    expect(tweens.quickFade.duration).toBe(0.15);
    expect(tweens.quickFade.ease).toBe('easeOut');
  });

  it('should define standard with 0.3s duration', () => {
    expect(tweens.standard.duration).toBe(0.3);
  });

  it('should define ambient as infinite repeat', () => {
    expect(tweens.ambient.repeat).toBe(Infinity);
    expect(tweens.ambient.ease).toBe('linear');
  });
});

describe('staggerConfigs', () => {
  it('should have fast stagger faster than slow stagger', () => {
    expect(staggerConfigs.fast.staggerChildren).toBeLessThan(staggerConfigs.slow.staggerChildren);
  });

  it('should define all stagger configs with correct shape', () => {
    for (const key of ['fast', 'standard', 'slow', 'grid'] as const) {
      expect(staggerConfigs[key]).toHaveProperty('staggerChildren');
      expect(staggerConfigs[key]).toHaveProperty('delayChildren');
      expect(typeof staggerConfigs[key].staggerChildren).toBe('number');
    }
  });
});

describe('entranceVariants', () => {
  it('should define all entrance variant names', () => {
    const names = [
      'fadeIn',
      'fadeUp',
      'fadeDown',
      'fadeLeft',
      'fadeRight',
      'scaleUp',
      'scaleIn',
      'slideUp',
      'flip',
      'blur',
    ];
    for (const name of names) {
      expect(entranceVariants[name]).toBeDefined();
      expect(entranceVariants[name]).toHaveProperty('hidden');
      expect(entranceVariants[name]).toHaveProperty('visible');
    }
  });

  it('should start hidden with opacity 0', () => {
    expect(entranceVariants.fadeIn!.hidden).toEqual({ opacity: 0 });
    expect((entranceVariants.fadeUp!.hidden as Record<string, unknown>).opacity).toBe(0);
  });

  it('should animate to full opacity in visible state', () => {
    expect((entranceVariants.fadeIn!.visible as Record<string, unknown>).opacity).toBe(1);
    expect((entranceVariants.scaleUp!.visible as Record<string, unknown>).opacity).toBe(1);
  });
});

// =============================================================================
// CHAT BUBBLE ANIMATIONS
// =============================================================================

describe('chatBubbleAnimations', () => {
  it('should define animations for all standard style names', () => {
    const standardStyles = ['rounded', 'sharp', 'cloud', 'modern', 'retro', 'default'];
    for (const style of standardStyles) {
      expect(chatBubbleAnimations[style]).toBeDefined();
      expect(typeof chatBubbleAnimations[style]).toBe('function');
    }
  });

  it('should define animations for all app-specific bubble IDs', () => {
    const bubbleIds = [
      'bubble-default',
      'bubble-pill',
      'bubble-sharp',
      'bubble-asymmetric',
      'bubble-aero',
      'bubble-flat',
      'bubble-compact',
      'bubble-retro',
      'bubble-neon',
      'bubble-minimal',
      'bubble-cloud',
      'bubble-modern',
    ];
    for (const id of bubbleIds) {
      expect(chatBubbleAnimations[id]).toBeDefined();
    }
  });

  it('should return initial, animate, and transition properties', () => {
    const result = chatBubbleAnimations['default']!(false, 0);
    expect(result).toHaveProperty('initial');
    expect(result).toHaveProperty('animate');
    expect(result).toHaveProperty('transition');
  });

  it('should pass delay into transition', () => {
    const delay = 0.5;
    const result = chatBubbleAnimations['default']!(false, delay);
    expect(result.transition).toHaveProperty('delay', delay);
  });

  it('should use directional offset for "sharp" based on isOwn', () => {
    const own = chatBubbleAnimations['sharp']!(true, 0);
    const other = chatBubbleAnimations['sharp']!(false, 0);
    expect((own.initial as Record<string, unknown>).x).toBeGreaterThan(0);
    expect((other.initial as Record<string, unknown>).x).toBeLessThan(0);
  });

  it('should apply spring transition for bouncy bubble styles', () => {
    const result = chatBubbleAnimations['rounded']!(false, 0);
    expect(result.transition).toHaveProperty('type', 'spring');
  });
});

// =============================================================================
// EFFECTS & UTILITIES
// =============================================================================

describe('hoverAnimations', () => {
  it('should define lift, scale, glow, tilt, pop presets', () => {
    expect(hoverAnimations.lift).toHaveProperty('whileHover');
    expect(hoverAnimations.scale).toHaveProperty('whileHover');
    expect(typeof hoverAnimations.glow).toBe('function');
    expect(hoverAnimations.tilt).toHaveProperty('whileHover');
    expect(hoverAnimations.pop).toHaveProperty('whileHover');
  });

  it('should produce glow boxShadow with given color', () => {
    const result = hoverAnimations.glow('#ff0000');
    expect(result.whileHover.boxShadow).toContain('#ff0000');
  });
});

describe('createPulseAnimation', () => {
  it('should return animate and transition keys', () => {
    const pulse = createPulseAnimation('#00ff00');
    expect(pulse).toHaveProperty('animate');
    expect(pulse).toHaveProperty('transition');
  });

  it('should repeat infinitely', () => {
    const pulse = createPulseAnimation('#00ff00');
    expect(pulse.transition.repeat).toBe(Infinity);
  });

  it('should create subtle vs strong intensity', () => {
    const subtle = createPulseAnimation('#00ff00', 'subtle');
    const strong = createPulseAnimation('#00ff00', 'strong');
    // Both return boxShadow arrays with 3 values
    expect((subtle.animate.boxShadow as string[]).length).toBe(3);
    expect((strong.animate.boxShadow as string[]).length).toBe(3);
  });
});

describe('createFireAnimation', () => {
  it('should create fire effect with given colors', () => {
    const fire = createFireAnimation(['#ff4500', '#ffaa00']);
    expect(fire).toHaveProperty('animate');
    expect(fire.transition.repeat).toBe(Infinity);
    expect((fire.animate.boxShadow as string[]).length).toBe(3);
  });
});

describe('createElectricAnimation', () => {
  it('should create electric effect with quick timing', () => {
    const electric = createElectricAnimation('#00bfff');
    expect(electric.transition.duration).toBe(0.1);
    expect(electric.transition.repeat).toBe(Infinity);
  });
});

describe('getRarityGlow', () => {
  it('should return correct color for each rarity', () => {
    expect(getRarityGlow('free')).toBe('#10b981');
    expect(getRarityGlow('rare')).toBe('#3b82f6');
    expect(getRarityGlow('legendary')).toBe('#f59e0b');
    expect(getRarityGlow('mythic')).toBe('#ec4899');
  });

  it('should fall back to common color for unknown rarity', () => {
    expect(getRarityGlow('nonexistent')).toBe('#9ca3af');
  });
});

describe('getTierGlow', () => {
  it('should return correct color for each tier', () => {
    expect(getTierGlow('free')).toBe('#10b981');
    expect(getTierGlow('premium')).toBe('#8b5cf6');
    expect(getTierGlow('enterprise')).toBe('#ec4899');
  });

  it('should fall back to free tier for unknown value', () => {
    expect(getTierGlow('unknown')).toBe('#10b981');
  });
});

describe('getStaggerDelay', () => {
  it('should compute correct delay for index 0', () => {
    const delay = getStaggerDelay(0, 'standard');
    expect(delay).toBe(staggerConfigs.standard.delayChildren);
  });

  it('should increase delay linearly per index', () => {
    const d0 = getStaggerDelay(0, 'standard');
    const d1 = getStaggerDelay(1, 'standard');
    const d2 = getStaggerDelay(2, 'standard');
    expect(d1 - d0).toBeCloseTo(d2 - d1);
  });
});

describe('createRepeatTransition', () => {
  it('should return a transition with given duration and repeat', () => {
    const t = createRepeatTransition(2, 5, 'linear');
    expect(t).toEqual({ duration: 2, repeat: 5, ease: 'linear' });
  });

  it('should default to Infinity repeat', () => {
    const t = createRepeatTransition(1);
    expect(t).toHaveProperty('repeat', Infinity);
  });
});

describe('createSpring', () => {
  it('should return spring config for a named preset', () => {
    const s = createSpring('bouncy');
    expect(s).toHaveProperty('type', 'spring');
    expect(s).toHaveProperty('stiffness', springs.bouncy.stiffness);
  });

  it('should include delay when provided', () => {
    const s = createSpring('default', 0.3);
    expect(s).toHaveProperty('delay', 0.3);
  });
});

describe('particleAnimations', () => {
  it('should define float, rise, fall, sparkle, orbit', () => {
    expect(typeof particleAnimations.float).toBe('function');
    expect(particleAnimations.rise).toHaveProperty('animate');
    expect(particleAnimations.fall).toHaveProperty('animate');
    expect(particleAnimations.sparkle).toHaveProperty('animate');
    expect(typeof particleAnimations.orbit).toBe('function');
  });

  it('should create orbit positions based on index and total', () => {
    const o0 = particleAnimations.orbit(0, 4, 30);
    const o1 = particleAnimations.orbit(1, 4, 30);
    expect(o0.animate).toHaveProperty('x');
    expect(o0.animate).toHaveProperty('y');
    // Different indices should produce different positions
    expect(o0.animate.x).not.toEqual(o1.animate.x);
  });
});

describe('backgroundAnimations', () => {
  it('should define gradientShift with infinite repeat', () => {
    expect(backgroundAnimations.gradientShift.transition.repeat).toBe(Infinity);
  });

  it('should create aurora animation from color array', () => {
    const aurora = backgroundAnimations.aurora(['#ff0000', '#00ff00', '#0000ff']);
    expect(aurora).toHaveProperty('animate');
    expect(aurora.transition.repeat).toBe(Infinity);
  });
});

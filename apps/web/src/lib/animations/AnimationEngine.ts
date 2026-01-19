/**
 * Advanced Animation Engine
 *
 * Enterprise-grade animation system inspired by React Native Reanimated
 * but optimized for web with GSAP and Framer Motion integration.
 *
 * Features:
 * - Spring physics animations with realistic motion
 * - Gesture-based interactions with haptic feedback simulation
 * - Choreographed sequence animations
 * - Performance monitoring and optimization
 * - Mobile-inspired animation patterns
 *
 * @version 2.0.0
 * @since v0.7.33
 */

import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(CustomEase);
}

// =============================================================================
// TYPES
// =============================================================================

export interface AnimationConfig {
  duration?: number;
  delay?: number;
  ease?: string | gsap.EaseFunction;
  repeat?: number;
  yoyo?: boolean;
  stagger?: number;
  onComplete?: () => void;
  onStart?: () => void;
  onUpdate?: (progress: number) => void;
}

export interface SpringConfig {
  tension?: number;
  friction?: number;
  mass?: number;
  velocity?: number;
  clamp?: boolean;
}

export interface GestureConfig {
  enableHaptic?: boolean;
  threshold?: number;
  direction?: 'horizontal' | 'vertical' | 'all';
  bounds?: { min: number; max: number };
}

export interface SequenceStep {
  target: HTMLElement | string;
  animation: gsap.TweenVars;
  label?: string;
}

// =============================================================================
// ANIMATION PRESETS (Mobile-Inspired)
// =============================================================================

export const ANIMATION_PRESETS = {
  // Entrance animations inspired by mobile
  slideInFromRight: {
    from: { x: 100, opacity: 0 },
    to: { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
  },
  slideInFromLeft: {
    from: { x: -100, opacity: 0 },
    to: { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
  },
  slideInFromBottom: {
    from: { y: 100, opacity: 0 },
    to: { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
  },
  slideInFromTop: {
    from: { y: -100, opacity: 0 },
    to: { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
  },

  // Scale animations
  scaleIn: {
    from: { scale: 0, opacity: 0 },
    to: { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' },
  },
  scaleOut: {
    from: { scale: 1, opacity: 1 },
    to: { scale: 0, opacity: 0, duration: 0.2, ease: 'back.in(1.7)' },
  },

  // Bounce animations (React Native style)
  bounceIn: {
    from: { scale: 0, opacity: 0 },
    to: {
      scale: 1,
      opacity: 1,
      duration: 0.6,
      ease: 'elastic.out(1, 0.5)',
    },
  },

  // Fade animations
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1, duration: 0.3, ease: 'power1.out' },
  },
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0, duration: 0.2, ease: 'power1.in' },
  },

  // Rotation animations
  rotateIn: {
    from: { rotation: -180, scale: 0, opacity: 0 },
    to: { rotation: 0, scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.4)' },
  },

  // Flip animations
  flipIn: {
    from: { rotationY: -90, opacity: 0 },
    to: { rotationY: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
  },

  // Shake animation (error feedback)
  shake: {
    from: { x: 0 },
    to: {
      x: 0,
      keyframes: {
        '0%': { x: 0 },
        '25%': { x: -10 },
        '50%': { x: 10 },
        '75%': { x: -10 },
        '100%': { x: 0 },
      },
      duration: 0.4,
      ease: 'power2.inOut',
    },
  },

  // Pulse animation
  pulse: {
    from: { scale: 1 },
    to: {
      scale: 1,
      keyframes: {
        '0%': { scale: 1 },
        '50%': { scale: 1.05 },
        '100%': { scale: 1 },
      },
      duration: 0.6,
      ease: 'sine.inOut',
    },
  },

  // Glow effect
  glowPulse: {
    from: { boxShadow: '0 0 5px rgba(16, 185, 129, 0.3)' },
    to: {
      boxShadow: '0 0 20px rgba(16, 185, 129, 0.6)',
      duration: 1,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    },
  },
} as const;

// =============================================================================
// SPRING PHYSICS (React Native Reanimated Style)
// =============================================================================

export class SpringPhysics {
  /**
   * Convert spring config to GSAP ease
   * Approximates React Native's spring animation using GSAP
   */
  static toGSAPEase(config: SpringConfig): string {
    const { tension = 100, friction = 12 } = config;

    // Calculate damping ratio and natural frequency
    const mass = config.mass || 1;
    const naturalFreq = Math.sqrt(tension / mass);
    const dampingRatio = friction / (2 * Math.sqrt(tension * mass));

    // Map to GSAP ease
    if (dampingRatio < 1) {
      // Underdamped (bouncy)
      return `elastic.out(${1 / dampingRatio}, ${naturalFreq / 10})`;
    } else if (dampingRatio === 1) {
      // Critically damped
      return 'power2.out';
    } else {
      // Overdamped
      return 'power3.out';
    }
  }

  /**
   * Create a spring animation
   */
  static animate(
    element: HTMLElement | string,
    to: gsap.TweenVars,
    springConfig: SpringConfig = {}
  ): gsap.core.Tween {
    const ease = this.toGSAPEase(springConfig);
    const duration = this.calculateDuration(springConfig);

    return gsap.to(element, {
      ...to,
      duration,
      ease,
    });
  }

  /**
   * Calculate optimal duration based on spring config
   */
  private static calculateDuration(config: SpringConfig): number {
    const { tension = 100, friction = 12, mass = 1 } = config;
    const dampingRatio = friction / (2 * Math.sqrt(tension * mass));

    // Empirical formula for spring duration
    if (dampingRatio < 0.7) {
      return 0.8; // Bouncy springs take longer
    } else if (dampingRatio < 1) {
      return 0.5;
    } else {
      return 0.3; // Stiff springs are quick
    }
  }
}

// =============================================================================
// HAPTIC FEEDBACK SIMULATION
// =============================================================================

export class HapticFeedback {
  private static isSupported = 'vibrate' in navigator;

  /**
   * Light haptic feedback (selection change)
   */
  static light(): void {
    if (this.isSupported) {
      navigator.vibrate(10);
    }
  }

  /**
   * Medium haptic feedback (button press)
   */
  static medium(): void {
    if (this.isSupported) {
      navigator.vibrate(20);
    }
  }

  /**
   * Heavy haptic feedback (error/warning)
   */
  static heavy(): void {
    if (this.isSupported) {
      navigator.vibrate([30, 10, 30]);
    }
  }

  /**
   * Success pattern
   */
  static success(): void {
    if (this.isSupported) {
      navigator.vibrate([10, 5, 10]);
    }
  }

  /**
   * Error pattern
   */
  static error(): void {
    if (this.isSupported) {
      navigator.vibrate([50, 30, 50]);
    }
  }

  /**
   * Warning pattern (softer than error)
   */
  static warning(): void {
    if (this.isSupported) {
      navigator.vibrate([30, 20, 30]);
    }
  }

  /**
   * Selection pattern (like iOS picker)
   */
  static selection(): void {
    if (this.isSupported) {
      navigator.vibrate(5);
    }
  }
}

// =============================================================================
// ANIMATION ENGINE
// =============================================================================

export class AnimationEngine {
  private static timeline: gsap.core.Timeline | null = null;
  private static activeAnimations = new Map<string, gsap.core.Tween>();

  /**
   * Animate an element with preset or custom config
   */
  static animate(
    element: HTMLElement | string,
    preset: keyof typeof ANIMATION_PRESETS | gsap.TweenVars,
    config?: AnimationConfig
  ): gsap.core.Tween {
    const animationConfig = typeof preset === 'string'
      ? { ...ANIMATION_PRESETS[preset].to, ...config }
      : { ...preset, ...config };

    // Apply from values if preset includes them
    if (typeof preset === 'string' && ANIMATION_PRESETS[preset].from) {
      gsap.set(element, ANIMATION_PRESETS[preset].from);
    }

    const tween = gsap.to(element, animationConfig);

    // Store animation reference
    const key = typeof element === 'string' ? element : element.id || Math.random().toString();
    this.activeAnimations.set(key, tween);

    return tween;
  }

  /**
   * Spring animation (React Native style)
   */
  static spring(
    element: HTMLElement | string,
    to: gsap.TweenVars,
    springConfig?: SpringConfig,
    config?: AnimationConfig
  ): gsap.core.Tween {
    return SpringPhysics.animate(element, { ...to, ...config }, springConfig);
  }

  /**
   * Stagger animation for multiple elements
   */
  static stagger(
    elements: HTMLElement[] | string,
    animation: gsap.TweenVars,
    staggerAmount = 0.1
  ): gsap.core.Tween {
    return gsap.to(elements, {
      ...animation,
      stagger: staggerAmount,
    });
  }

  /**
   * Create a timeline for complex sequences
   */
  static createSequence(steps: SequenceStep[]): gsap.core.Timeline {
    const timeline = gsap.timeline();

    steps.forEach(({ target, animation, label }) => {
      if (label) {
        timeline.add(label);
      }
      timeline.to(target, animation);
    });

    this.timeline = timeline;
    return timeline;
  }

  /**
   * Message entrance animation (like mobile)
   */
  static messageEnter(
    element: HTMLElement,
    isOwnMessage: boolean,
    index: number = 0
  ): gsap.core.Timeline {
    const timeline = gsap.timeline();

    // Set initial state
    gsap.set(element, {
      x: isOwnMessage ? 30 : -30,
      opacity: 0,
      scale: 0.95,
    });

    // Animate in with spring physics
    timeline
      .to(element, {
        x: 0,
        duration: 0.4,
        ease: 'power2.out',
        delay: index * 0.05, // Stagger based on index
      })
      .to(element, {
        opacity: 1,
        scale: 1,
        duration: 0.3,
        ease: 'back.out(1.4)',
      }, '-=0.3');

    return timeline;
  }

  /**
   * Reaction bubble animation
   */
  static reactionBounce(element: HTMLElement): gsap.core.Timeline {
    const timeline = gsap.timeline();

    timeline
      .to(element, {
        scale: 1.3,
        duration: 0.15,
        ease: 'power2.out',
      })
      .to(element, {
        y: -8,
        duration: 0.1,
        ease: 'power2.out',
      }, '-=0.15')
      .to(element, {
        scale: 1,
        y: 0,
        duration: 0.25,
        ease: 'elastic.out(1, 0.5)',
      });

    // Trigger haptic feedback
    HapticFeedback.light();

    return timeline;
  }

  /**
   * Card flip animation
   */
  static flip3D(
    element: HTMLElement,
    direction: 'x' | 'y' = 'y'
  ): gsap.core.Timeline {
    const timeline = gsap.timeline();
    const rotation = direction === 'x' ? 'rotationX' : 'rotationY';

    timeline
      .to(element, {
        [rotation]: 90,
        duration: 0.3,
        ease: 'power2.in',
      })
      .to(element, {
        [rotation]: 0,
        duration: 0.3,
        ease: 'power2.out',
      });

    return timeline;
  }

  /**
   * Morphing animation
   */
  static morph(
    element: HTMLElement,
    _fromShape: string,
    toShape: string,
    duration = 1
  ): gsap.core.Tween {
    // For SVG morphing
    return gsap.to(element, {
      attr: { d: toShape },
      duration,
      ease: 'power2.inOut',
    });
  }

  /**
   * Parallax scroll effect
   */
  static parallax(
    element: HTMLElement,
    speed: number = 0.5,
    direction: 'vertical' | 'horizontal' = 'vertical'
  ): void {
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const translateProp = direction === 'vertical' ? 'y' : 'x';

      gsap.to(element, {
        [translateProp]: scrolled * speed,
        duration: 0,
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  /**
   * Kill all active animations
   */
  static killAll(): void {
    this.activeAnimations.forEach(tween => tween.kill());
    this.activeAnimations.clear();
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }
  }

  /**
   * Kill specific animation
   */
  static kill(key: string): void {
    const tween = this.activeAnimations.get(key);
    if (tween) {
      tween.kill();
      this.activeAnimations.delete(key);
    }
  }

  /**
   * Pause all animations
   */
  static pauseAll(): void {
    this.activeAnimations.forEach(tween => tween.pause());
    if (this.timeline) {
      this.timeline.pause();
    }
  }

  /**
   * Resume all animations
   */
  static resumeAll(): void {
    this.activeAnimations.forEach(tween => tween.resume());
    if (this.timeline) {
      this.timeline.resume();
    }
  }

  /**
   * Get performance metrics
   */
  static getMetrics(): {
    activeAnimations: number;
    fps: number;
  } {
    return {
      activeAnimations: this.activeAnimations.size,
      fps: gsap.ticker.fps as unknown as number,
    };
  }
}

// =============================================================================
// GESTURE HANDLER
// =============================================================================

export class GestureHandler {
  private element: HTMLElement;
  private config: Required<GestureConfig>;
  private startX = 0;
  private startY = 0;
  private isDragging = false;

  constructor(element: HTMLElement, config: GestureConfig = {}) {
    this.element = element;
    this.config = {
      enableHaptic: config.enableHaptic ?? true,
      threshold: config.threshold ?? 10,
      direction: config.direction ?? 'all',
      bounds: config.bounds ?? { min: -Infinity, max: Infinity },
    };

    this.init();
  }

  private init(): void {
    this.element.addEventListener('mousedown', this.handleStart);
    this.element.addEventListener('touchstart', this.handleStart, { passive: false });
  }

  private handleStart = (e: MouseEvent | TouchEvent): void => {
    const point = e instanceof MouseEvent ? e : e.touches[0];
    if (!point) return;
    this.startX = point.clientX;
    this.startY = point.clientY;
    this.isDragging = true;

    if (this.config.enableHaptic) {
      HapticFeedback.light();
    }

    document.addEventListener('mousemove', this.handleMove);
    document.addEventListener('touchmove', this.handleMove, { passive: false });
    document.addEventListener('mouseup', this.handleEnd);
    document.addEventListener('touchend', this.handleEnd);
  };

  private handleMove = (e: MouseEvent | TouchEvent): void => {
    if (!this.isDragging) return;

    const point = e instanceof MouseEvent ? e : e.touches[0];
    if (!point) return;
    const deltaX = point.clientX - this.startX;
    const deltaY = point.clientY - this.startY;

    // Apply threshold
    if (Math.abs(deltaX) < this.config.threshold && Math.abs(deltaY) < this.config.threshold) {
      return;
    }

    // Apply bounds and direction constraints
    let x = 0;
    let y = 0;

    if (this.config.direction === 'horizontal' || this.config.direction === 'all') {
      x = Math.max(this.config.bounds.min, Math.min(this.config.bounds.max, deltaX));
    }

    if (this.config.direction === 'vertical' || this.config.direction === 'all') {
      y = Math.max(this.config.bounds.min, Math.min(this.config.bounds.max, deltaY));
    }

    gsap.set(this.element, { x, y });
  };

  private handleEnd = (): void => {
    this.isDragging = false;

    // Spring back to original position
    SpringPhysics.animate(this.element, { x: 0, y: 0 }, { tension: 200, friction: 20 });

    if (this.config.enableHaptic) {
      HapticFeedback.selection();
    }

    document.removeEventListener('mousemove', this.handleMove);
    document.removeEventListener('touchmove', this.handleMove);
    document.removeEventListener('mouseup', this.handleEnd);
    document.removeEventListener('touchend', this.handleEnd);
  };

  destroy(): void {
    this.element.removeEventListener('mousedown', this.handleStart);
    this.element.removeEventListener('touchstart', this.handleStart);
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default AnimationEngine;

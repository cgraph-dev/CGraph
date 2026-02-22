/**
 * Animation Engine Core Module
 *
 * The main AnimationEngine class providing preset-based animations,
 * spring animations, stagger effects, sequencing, and specialized
 * animation helpers (message enter, reaction bounce, card flip, etc.).
 *
 * @version 2.0.0
 * @since v0.7.33
 */

import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

import type { AnimationConfig, SpringConfig, SequenceStep } from '../animation-engine.types';
import { ANIMATION_PRESETS } from '../animation-engine.types';

import { SpringPhysics } from './spring-physics';
import { HapticFeedback } from './haptic-feedback';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(CustomEase);
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
    const animationConfig =
      typeof preset === 'string'
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
      .to(
        element,
        {
          opacity: 1,
          scale: 1,
          duration: 0.3,
          ease: 'back.out(1.4)',
        },
        '-=0.3'
      );

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
      .to(
        element,
        {
          y: -8,
          duration: 0.1,
          ease: 'power2.out',
        },
        '-=0.15'
      )
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
  static flip3D(element: HTMLElement, direction: 'x' | 'y' = 'y'): gsap.core.Timeline {
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
    this.activeAnimations.forEach((tween) => tween.kill());
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
    this.activeAnimations.forEach((tween) => tween.pause());
    if (this.timeline) {
      this.timeline.pause();
    }
  }

  /**
   * Resume all animations
   */
  static resumeAll(): void {
    this.activeAnimations.forEach((tween) => tween.resume());
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

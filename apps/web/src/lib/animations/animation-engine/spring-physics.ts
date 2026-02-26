/**
 * Spring Physics Module
 *
 * Converts spring configurations (React Native Reanimated style)
 * into GSAP-compatible ease strings and animations.
 *
 * @version 2.0.0
 * @since v0.7.33
 */

import gsap from 'gsap';

import type { SpringConfig } from '../animation-engine.types';

// =============================================================================
// SPRING PHYSICS (React Native Reanimated Style)
// =============================================================================

/**
 * Spring Physics class.
 */
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

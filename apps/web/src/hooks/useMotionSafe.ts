/**
 * useMotionSafe — Provides motion-safe animation configs.
 *
 * Wraps useReducedMotion + useAnimationIntensity to return spring/transition
 * configs that automatically degrade to instant (duration: 0) when reduced
 * motion is active. Components can destructure and spread without manual checks.
 *
 * @module hooks/useMotionSafe
 */
import { useMemo } from 'react';
import type { TargetAndTransition, Transition } from 'motion/react';
import { useReducedMotion, useAnimationIntensity, getMotionTransition } from './useReducedMotion';
import { springs as sharedSprings } from '@cgraph/animation-constants';

export interface MotionSafeResult {
  /** Whether animations should play at all */
  shouldAnimate: boolean;
  /** 0 = disabled, 0.5 = subtle, 1 = full */
  intensity: number;
  /** Spring configs that respect reduced motion (instant when reduced) */
  springs: {
    gentle: Transition;
    snappy: Transition;
    bouncy: Transition;
    smooth: Transition;
  };
  /** Get a transition config — returns { duration: 0 } when reduced */
  getTransition: (springConfig?: { damping?: number; stiffness?: number }) => Transition;
  /** whileTap value — returns {} when reduced motion, { scale } when active */
  tapScale: (scale?: number) => TargetAndTransition;
  /** whileHover value — returns {} when reduced motion, { scale } when active */
  hoverScale: (scale?: number) => TargetAndTransition;
}

/**
 * Hook that provides animation configurations respecting user motion preferences.
 *
 * @example
 * const { shouldAnimate, springs, tapScale, hoverScale } = useMotionSafe();
 * <motion.button
 *   whileTap={tapScale(0.97)}
 *   whileHover={hoverScale(1.02)}
 *   transition={springs.snappy}
 * />
 */
export function useMotionSafe(): MotionSafeResult {
  const reducedMotion = useReducedMotion();
  const intensity = useAnimationIntensity();
  const shouldAnimate = !reducedMotion && intensity > 0;

  return useMemo(() => {
    const instant: Transition = { duration: 0 };
    const toSpring = (s: { stiffness: number; damping: number; mass: number }): Transition =>
      shouldAnimate
        ? {
            type: 'spring' as const,
            stiffness: s.stiffness,
            damping: s.damping,
          }
        : instant;

    return {
      shouldAnimate,
      intensity,
      springs: {
        gentle: toSpring(sharedSprings.gentle),
        snappy: toSpring(sharedSprings.snappy),
        bouncy: toSpring(sharedSprings.bouncy),
        smooth: toSpring(sharedSprings.smooth),
      },
      getTransition: (springConfig) => getMotionTransition(reducedMotion, springConfig),
      tapScale: (scale = 0.97): TargetAndTransition => (shouldAnimate ? { scale } : {}),
      hoverScale: (scale = 1.02): TargetAndTransition => (shouldAnimate ? { scale } : {}),
    };
  }, [shouldAnimate, intensity, reducedMotion]);
}

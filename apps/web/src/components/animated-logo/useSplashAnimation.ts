/**
 * Splash Animation State Machine Hook
 *
 * Manages sequential animation phases for the CircuitBoardLogo
 * splash screen: traces → nodes → particles → complete.
 *
 * @module components/animated-logo/useSplashAnimation
 */

import { useEffect, useState } from 'react';
import { SPLASH_TIMINGS } from './constants';

/** Animation phase (0–4) progressing through splash sequence */
export type AnimationPhase = 0 | 1 | 2 | 3 | 4;

/** Return type of the useSplashAnimation hook */
export interface SplashAnimationState {
  /** Current animation phase */
  animationPhase: AnimationPhase;
  /** Whether data-flow particles should render */
  showParticles: boolean;
}

/**
 * Drives the timed splash animation sequence.
 *
 * @param isSplash  - Whether the splash sequence is active
 * @param isLoading - Whether continuous loading animation is active
 * @param onAnimationComplete - Callback when the splash sequence finishes
 */
export function useSplashAnimation(
  isSplash: boolean,
  isLoading: boolean,
  onAnimationComplete?: () => void
): SplashAnimationState {
  const [showParticles, setShowParticles] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>(0);

  // Progress through timed animation phases for splash
  useEffect(() => {
    if (isSplash) {
      const timers = [
        setTimeout(() => setAnimationPhase(1), SPLASH_TIMINGS.tracesDrawn),
        setTimeout(() => setAnimationPhase(2), SPLASH_TIMINGS.nodesAppear),
        setTimeout(() => setAnimationPhase(3), SPLASH_TIMINGS.particlesStart),
        setTimeout(() => {
          setAnimationPhase(4);
          onAnimationComplete?.();
        }, SPLASH_TIMINGS.complete),
      ];
      return () => timers.forEach(clearTimeout);
    }
    if (isLoading) {
      setShowParticles(true);
    }
    return undefined;
  }, [isSplash, isLoading, onAnimationComplete]);

  // Enable particles once phase 3+ is reached
  useEffect(() => {
    if (animationPhase >= 3) {
      setShowParticles(true);
    }
  }, [animationPhase]);

  return { animationPhase, showParticles };
}

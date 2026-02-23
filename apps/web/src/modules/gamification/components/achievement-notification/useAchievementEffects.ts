/**
 * Hook for achievement notification effects.
 * @module
 */
import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { AchievementRarity } from '@/modules/gamification/store';
import {
  RARITY_COLORS,
  CONFETTI_PARTICLE_COUNTS,
  AUTO_DISMISS_DURATION_MS,
  ANIMATION_STEPS,
  PROGRESS_ANIMATION_DURATION_MS,
} from '@/modules/gamification/components/achievement-notification/constants';

/**
 * Fires confetti and haptic feedback when an achievement is unlocked or progressed.
 */
export function useUnlockCelebration(isUnlock: boolean, rarity: AchievementRarity): void {
  const colors = RARITY_COLORS[rarity];

  useEffect(() => {
    let confettiTimer: ReturnType<typeof setTimeout> | undefined;

    if (isUnlock) {
      HapticFeedback.success();

      const particleCount = CONFETTI_PARTICLE_COUNTS[rarity];

      confetti({
        particleCount,
        spread: 60,
        origin: { x: 1, y: 0.3 },
        colors: [colors.from, colors.to, colors.glow],
        shapes: rarity === 'mythic' ? ['star'] : ['circle', 'square'],
      });

      if (rarity === 'legendary' || rarity === 'mythic') {
        confettiTimer = setTimeout(() => {
          confetti({
            particleCount: 50,
            spread: 90,
            origin: { x: 1, y: 0.3 },
            colors: [colors.from, colors.to],
          });
        }, 200);
      }
    } else {
      HapticFeedback.light();
    }

    return () => clearTimeout(confettiTimer);
  }, [isUnlock, rarity, colors]);
}

/**
 * Animates a progress bar from 0 to the target percentage.
 */
export function useAnimatedProgress(current: number, max: number): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const targetProgress = (current / max) * 100;
    const increment = targetProgress / ANIMATION_STEPS;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      setProgress(Math.min(currentStep * increment, targetProgress));
      if (currentStep >= ANIMATION_STEPS) clearInterval(interval);
    }, PROGRESS_ANIMATION_DURATION_MS / ANIMATION_STEPS);

    return () => clearInterval(interval);
  }, [current, max]);

  return progress;
}

/**
 * Drives the auto-dismiss countdown and calls `onDismiss` when complete.
 */
export function useAutoDismiss(onDismiss: () => void): number {
  const [autoDismissProgress, setAutoDismissProgress] = useState(0);

  useEffect(() => {
    const increment = 100 / ANIMATION_STEPS;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      setAutoDismissProgress(Math.min(currentStep * increment, 100));
      if (currentStep >= ANIMATION_STEPS) {
        clearInterval(interval);
        onDismiss();
      }
    }, AUTO_DISMISS_DURATION_MS / ANIMATION_STEPS);

    return () => clearInterval(interval);
  }, [onDismiss]);

  return autoDismissProgress;
}

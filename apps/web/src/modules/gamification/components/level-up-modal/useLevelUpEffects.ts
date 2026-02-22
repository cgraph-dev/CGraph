import { useEffect, useState } from 'react';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import confetti from 'canvas-confetti';

interface RewardsUnlocked {
  titles?: string[];
  badges?: string[];
  perks?: string[];
  loreFragments?: string[];
}

/**
 * Manages confetti bursts, haptic feedback, and the delayed
 * reveal of the rewards section when the level-up modal opens.
 */
export function useLevelUpEffects(isOpen: boolean, rewardsUnlocked: RewardsUnlocked) {
  const [showRewards, setShowRewards] = useState(false);

  useEffect(() => {
    if (isOpen) {
      HapticFeedback.success();

      // Confetti explosion from center
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#8b5cf6', '#ec4899', '#f59e0b'],
      });

      // Left burst
      const t1 = setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#10b981', '#8b5cf6'],
        });
      }, 250);

      // Right burst
      const t2 = setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ec4899', '#f59e0b'],
        });
      }, 400);

      // Reveal rewards after the level animation finishes
      const t3 = setTimeout(() => setShowRewards(true), 2000);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else {
      setShowRewards(false);
    }
    return undefined;
  }, [isOpen]);

  const hasRewards =
    (rewardsUnlocked.titles?.length ?? 0) > 0 ||
    (rewardsUnlocked.badges?.length ?? 0) > 0 ||
    (rewardsUnlocked.perks?.length ?? 0) > 0 ||
    (rewardsUnlocked.loreFragments?.length ?? 0) > 0;

  return { showRewards, hasRewards };
}

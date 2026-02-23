/**
 * Hook for achievement statistics computation.
 * @module
 */
import { useMemo } from 'react';
import type { Achievement, AchievementRarity } from './types';
import { RARITY_ORDER } from './constants';

export function useAchievementStats(achievements: Achievement[]) {
  return useMemo(() => {
    const unlocked = achievements.filter((a) => a.unlocked).length;
    const total = achievements.length;
    const totalXPEarned = achievements
      .filter((a) => a.unlocked)
      .reduce((sum, a) => sum + a.xpReward, 0);
    const byRarity = RARITY_ORDER.reduce(
      (acc, rarity) => {
        acc[rarity] = {
          unlocked: achievements.filter((a) => a.rarity === rarity && a.unlocked).length,
          total: achievements.filter((a) => a.rarity === rarity).length,
        };
        return acc;
      },
      {} as Record<AchievementRarity, { unlocked: number; total: number }> // safe downcast – structural boundary
    );

    return { unlocked, total, totalXPEarned, byRarity };
  }, [achievements]);
}

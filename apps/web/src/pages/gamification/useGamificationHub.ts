/**
 * Custom hook for GamificationHubPage state and logic.
 *
 * @version 1.0.0
 * @since v0.8.3
 */

import { useEffect } from 'react';
import { useGamificationStore } from '@/modules/gamification/store';

export function useGamificationHub() {
  const {
    totalXP,
    loginStreak,
    achievements,
    activeQuests,
    equippedTitle,
    fetchGamificationData,
    checkDailyLogin,
  } = useGamificationStore();

  useEffect(() => {
    fetchGamificationData();
    checkDailyLogin();
  }, [fetchGamificationData, checkDailyLogin]);

  const unlockedAchievements = achievements.filter((a) => a.unlocked).length;
  const totalAchievements = achievements.length;
  const completableQuests = activeQuests.filter((q) => q.completed && !q.completedAt).length;

  const recentAchievements = achievements
    .filter((a) => a.unlocked)
    .sort((a, b) => {
      const dateA = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
      const dateB = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 6);

  return {
    totalXP,
    loginStreak,
    achievements,
    activeQuests,
    equippedTitle,
    unlockedAchievements,
    totalAchievements,
    completableQuests,
    recentAchievements,
  };
}

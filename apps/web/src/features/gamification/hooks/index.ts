/**
 * Gamification Hooks
 * 
 * Custom React hooks for gamification functionality.
 */

import { useCallback } from 'react';
import { useGamificationStore } from '../stores';

/**
 * Hook to track and award XP for user actions
 */
export function useXPTracker() {
  const { addXP, getCurrentLevel, getProgress } = useGamificationStore();
  
  const trackAction = useCallback((action: string, xpAmount: number) => {
    addXP(xpAmount, action);
  }, [addXP]);
  
  return {
    trackAction,
    currentLevel: getCurrentLevel(),
    progress: getProgress(),
  };
}

/**
 * Hook to check and display achievements
 */
export function useAchievements() {
  const { achievements, unlockAchievement, checkAchievementProgress } = useGamificationStore();
  
  const checkProgress = useCallback((achievementId: string) => {
    return checkAchievementProgress(achievementId);
  }, [checkAchievementProgress]);
  
  return {
    achievements,
    unlockAchievement,
    checkProgress,
  };
}

/**
 * Hook to manage daily/weekly quests
 */
export function useQuests() {
  const { activeQuests, completeQuest, claimReward } = useGamificationStore();
  
  return {
    activeQuests,
    completeQuest,
    claimReward,
  };
}

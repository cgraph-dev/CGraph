/**
 * Gamification Hooks (Mobile)
 */

import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';

/**
 * Hook for gamification interactions with haptics
 */
export function useGamificationHaptics() {
  const onLevelUp = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);
  
  const onAchievement = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);
  
  const onXPGain = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);
  
  const onQuestComplete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);
  
  return {
    onLevelUp,
    onAchievement,
    onXPGain,
    onQuestComplete,
  };
}

// Re-export from services
export { useGamification } from '@/hooks/useGamification';

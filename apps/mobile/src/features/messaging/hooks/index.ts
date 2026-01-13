/**
 * Messaging Hooks (Mobile)
 */

import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';

/**
 * Hook for message haptic feedback
 */
export function useMessageHaptics() {
  const onSend = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);
  
  const onReact = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);
  
  const onLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);
  
  const onSwipe = useCallback(() => {
    Haptics.selectionAsync();
  }, []);
  
  return {
    onSend,
    onReact,
    onLongPress,
    onSwipe,
  };
}

/**
 * Hook for voice message recording
 */
export function useVoiceRecording() {
  // TODO: Implement with expo-av
  return {
    isRecording: false,
    duration: 0,
    start: async () => {},
    stop: async () => null,
    cancel: () => {},
  };
}

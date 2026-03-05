/**
 * Messaging Hooks (Mobile)
 */

import { useCallback, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { useVoiceRecorder } from '@/components/voice-message-recorder/use-voice-recorder';

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
 * Hook for voice message recording.
 * Wraps the real expo-audio based useVoiceRecorder and maps to the
 * simplified interface expected by messaging consumers.
 */
export function useVoiceRecording() {
  const recorder = useVoiceRecorder({
    onComplete: () => {},
    onCancel: () => {},
  });

  return useMemo(
    () => ({
      isRecording: recorder.state === 'recording',
      duration: recorder.duration,
      start: recorder.startRecording,
      stop: recorder.stopRecording,
      cancel: recorder.handleCancel,
    }),
    [recorder.state, recorder.duration, recorder.startRecording, recorder.stopRecording, recorder.handleCancel]
  );
}

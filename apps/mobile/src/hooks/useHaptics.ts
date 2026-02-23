/**
 * React hook providing a unified API for triggering haptic feedback across different styles.
 * @module hooks/useHaptics
 */
import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';

export type HapticStyle =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'rigid'
  | 'soft'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection';

/**
 * Hook for triggering haptic feedback.
 *
 * Provides a simple interface to expo-haptics with predefined styles.
 *
 * @example
 * const haptic = useHaptics();
 *
 * // In a handler
 * haptic('light');
 * haptic('success');
 */
export function useHaptics() {
  const trigger = useCallback(async (style: HapticStyle = 'light') => {
    try {
      switch (style) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'rigid':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
          break;
        case 'soft':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'selection':
          await Haptics.selectionAsync();
          break;
        default:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      // Haptics may not be available on all devices
      console.warn('Haptics not available:', error);
    }
  }, []);

  return trigger;
}

/**
 * Hook for creating a haptic-enabled press handler.
 *
 * @example
 * const onPress = useHapticPress(() => {
 *   doSomething();
 * }, 'medium');
 */
export function useHapticPress<T extends (...args: Parameters<T>) => void>(
  callback: T,
  style: HapticStyle = 'light'
): (...args: Parameters<T>) => void {
  const haptic = useHaptics();

  return useCallback(
    (...args: Parameters<T>) => {
      haptic(style);
      callback(...args);
    },
    [callback, haptic, style]
  );
}

export default useHaptics;

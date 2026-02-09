/**
 * useReducedMotion - Respects system & app-level motion preferences (Mobile)
 * Uses Reanimated's built-in useReducedMotion hook
 */
import { useReducedMotion as useReanimatedReducedMotion } from 'react-native-reanimated';
import { SPRING_PRESETS } from '@/lib/animations/AnimationLibrary';

/**
 * Returns true if animations should be simplified/disabled.
 * Reads from the OS accessibility setting.
 */
export function useReducedMotion(): boolean {
  return useReanimatedReducedMotion();
}

/**
 * Returns animation intensity: 0 = disabled, 0.5 = subtle, 1 = full
 */
export function useAnimationIntensity(): number {
  const reduced = useReducedMotion();
  if (reduced) return 0;
  return 1;
}

/**
 * Get an appropriate spring config based on motion preferences.
 * Returns an instant config if reduced motion is enabled.
 */
export function getMotionSpring(
  reduced: boolean,
  preset: keyof typeof SPRING_PRESETS = 'default',
) {
  if (reduced) {
    return SPRING_PRESETS.instant;
  }
  return SPRING_PRESETS[preset];
}

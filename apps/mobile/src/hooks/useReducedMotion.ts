/**
 * useReducedMotion - Respects system & app-level motion preferences (Mobile)
 * Uses Reanimated's built-in useReducedMotion hook
 */
import { useReducedMotion as useReanimatedReducedMotion } from 'react-native-reanimated';
import { SPRING_PRESETS } from '@/lib/animations/animation-library';
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * Returns true if animations should be simplified/disabled.
 * Checks both the OS accessibility setting AND the app-level reduceMotion toggle.
 */
export function useReducedMotion(): boolean {
  const osReduced = useReanimatedReducedMotion();
  const appReduced = useSettingsStore((s) => s.settings.appearance.reduceMotion);
  return osReduced || appReduced;
}

/**
 * Returns animation intensity: 0 = disabled, 0.5 = subtle, 1 = full
 *
 * Reads both OS reduced-motion preference and app-level setting.
 * When reduced: 0. Otherwise: 1 (full).
 * Future: 3-level support once animationSpeed is added to mobile settings.
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

/**
 * HapticPatterns - Enhanced Haptic Feedback System
 *
 * Features:
 * - 20+ contextual haptic patterns
 * - Intensity control
 * - Pattern sequences
 * - Device-aware haptics
 * - Accessibility integration
 */

import { durations } from '@cgraph/animation-constants';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// ============================================================================
// Types
// ============================================================================

export type HapticIntensity = 'off' | 'light' | 'medium' | 'strong';

export type HapticPattern =
  | 'tap'
  | 'doubleTap'
  | 'longPress'
  | 'success'
  | 'error'
  | 'warning'
  | 'selection'
  | 'toggle'
  | 'slider'
  | 'scroll'
  | 'refresh'
  | 'notification'
  | 'levelUp'
  | 'achievement'
  | 'countdown'
  | 'heartbeat'
  | 'loading'
  | 'confirm'
  | 'cancel'
  | 'swipe'
  | 'pop'
  | 'impact'
  | 'soft'
  | 'rigid'
  | 'morse';

export interface HapticConfig {
  intensity: HapticIntensity;
  enabled: boolean;
  respectSystemSettings: boolean;
}

export interface PatternStep {
  type: 'impact' | 'notification' | 'selection' | 'wait';
  style?: Haptics.ImpactFeedbackStyle | Haptics.NotificationFeedbackType;
  duration?: number; // For wait type
}

// ============================================================================
// Constants
// ============================================================================

const INTENSITY_MAPPING: Record<HapticIntensity, Haptics.ImpactFeedbackStyle | null> = {
  off: null,
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  strong: Haptics.ImpactFeedbackStyle.Heavy,
};

// ============================================================================
// Pattern Definitions
// ============================================================================

const PATTERNS: Record<HapticPattern, PatternStep[]> = {
  tap: [{ type: 'impact', style: Haptics.ImpactFeedbackStyle.Light }],

  doubleTap: [
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Light },
    { type: 'wait', duration: durations.instant.ms },
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Light },
  ],

  longPress: [
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Medium },
    { type: 'wait', duration: durations.stagger.ms },
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Heavy },
  ],

  success: [{ type: 'notification', style: Haptics.NotificationFeedbackType.Success }],

  error: [{ type: 'notification', style: Haptics.NotificationFeedbackType.Error }],

  warning: [{ type: 'notification', style: Haptics.NotificationFeedbackType.Warning }],

  selection: [{ type: 'selection' }],

  toggle: [{ type: 'impact', style: Haptics.ImpactFeedbackStyle.Medium }],

  slider: [{ type: 'selection' }],

  scroll: [{ type: 'impact', style: Haptics.ImpactFeedbackStyle.Light }],

  refresh: [
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Medium },
    { type: 'wait', duration: durations.instant.ms },
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Light },
  ],

  notification: [
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Medium },
    { type: 'wait', duration: durations.fast.ms },
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Light },
    { type: 'wait', duration: durations.fast.ms },
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Light },
  ],

  levelUp: [
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Light },
    { type: 'wait', duration: durations.stagger.ms },
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Medium },
    { type: 'wait', duration: durations.stagger.ms },
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Heavy },
    { type: 'wait', duration: durations.instant.ms },
    { type: 'notification', style: Haptics.NotificationFeedbackType.Success },
  ],

  achievement: [
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Heavy },
    { type: 'wait', duration: durations.instant.ms },
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Medium },
    { type: 'wait', duration: durations.instant.ms },
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Light },
    { type: 'wait', duration: durations.normal.ms },
    { type: 'notification', style: Haptics.NotificationFeedbackType.Success },
  ],

  countdown: [
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Heavy },
    { type: 'wait', duration: durations.verySlow.ms },
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Heavy },
    { type: 'wait', duration: durations.verySlow.ms },
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Heavy },
    { type: 'wait', duration: durations.slower.ms },
    { type: 'notification', style: Haptics.NotificationFeedbackType.Success },
  ],

  heartbeat: [
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Heavy },
    { type: 'wait', duration: durations.instant.ms },
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Light },
    { type: 'wait', duration: durations.dramatic.ms },
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Heavy },
    { type: 'wait', duration: durations.instant.ms },
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Light },
  ],

  loading: [
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Light },
    { type: 'wait', duration: durations.normal.ms },
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Light },
    { type: 'wait', duration: durations.normal.ms },
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Light },
  ],

  confirm: [
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Medium },
    { type: 'wait', duration: durations.fast.ms },
    { type: 'notification', style: Haptics.NotificationFeedbackType.Success },
  ],

  cancel: [{ type: 'impact', style: Haptics.ImpactFeedbackStyle.Light }],

  swipe: [{ type: 'impact', style: Haptics.ImpactFeedbackStyle.Light }],

  pop: [{ type: 'impact', style: Haptics.ImpactFeedbackStyle.Medium }],

  impact: [{ type: 'impact', style: Haptics.ImpactFeedbackStyle.Heavy }],

  soft: [{ type: 'impact', style: Haptics.ImpactFeedbackStyle.Soft }],

  rigid: [{ type: 'impact', style: Haptics.ImpactFeedbackStyle.Rigid }],

  morse: [
    // SOS pattern: ... --- ...
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Light },
    { type: 'wait', duration: durations.instant.ms },
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Light },
    { type: 'wait', duration: durations.instant.ms },
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Light },
    { type: 'wait', duration: durations.slow.ms },
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Heavy },
    { type: 'wait', duration: durations.slow.ms },
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Heavy },
    { type: 'wait', duration: durations.slow.ms },
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Heavy },
    { type: 'wait', duration: durations.slow.ms },
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Light },
    { type: 'wait', duration: durations.instant.ms },
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Light },
    { type: 'wait', duration: durations.instant.ms },
    { type: 'impact', style: Haptics.ImpactFeedbackStyle.Light },
  ],
};

// ============================================================================
// Haptic Engine Class
// ============================================================================

class HapticEngine {
  private config: HapticConfig = {
    intensity: 'medium',
    enabled: true,
    respectSystemSettings: true,
  };

  private isPlaying: boolean = false;
  private cancelToken: { cancelled: boolean } | null = null;

  /**
   * Configure the haptic engine
   */
  configure(config: Partial<HapticConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): HapticConfig {
    return { ...this.config };
  }

  /**
   * Set intensity level
   */
  setIntensity(intensity: HapticIntensity): void {
    this.config.intensity = intensity;
  }

  /**
   * Enable/disable haptics
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Check if haptics are available
   */
  isAvailable(): boolean {
    // Haptics are available on iOS and most Android devices
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  /**
   * Play a simple impact
   */
  async impact(style?: Haptics.ImpactFeedbackStyle): Promise<void> {
    if (!this.shouldPlay()) return;

    const effectiveStyle = this.getEffectiveStyle(style);
    if (!effectiveStyle) return;

    try {
      await Haptics.impactAsync(effectiveStyle);
    } catch (error) {
      // Silently fail if haptics not available
      // eslint-disable-next-line no-console
      console.debug('Haptic feedback not available:', error);
    }
  }

  /**
   * Play a notification feedback
   */
  async notification(type: Haptics.NotificationFeedbackType): Promise<void> {
    if (!this.shouldPlay()) return;

    try {
      await Haptics.notificationAsync(type);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.debug('Haptic notification not available:', error);
    }
  }

  /**
   * Play a selection feedback
   */
  async selection(): Promise<void> {
    if (!this.shouldPlay()) return;

    try {
      await Haptics.selectionAsync();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.debug('Haptic selection not available:', error);
    }
  }

  /**
   * Play a predefined pattern
   */
  async playPattern(pattern: HapticPattern): Promise<void> {
    if (!this.shouldPlay()) return;

    const patternSteps = PATTERNS[pattern];
    if (!patternSteps) return;

    // Cancel any existing pattern
    this.cancel();

    // Create cancel token
    const token = { cancelled: false };
    this.cancelToken = token;
    this.isPlaying = true;

    try {
      for (const step of patternSteps) {
        if (token.cancelled) break;

        switch (step.type) {
          case 'impact':
            if (step.style) {
              const effectiveStyle = this.getEffectiveStyle(
                 
                step.style as Haptics.ImpactFeedbackStyle
              );
              if (effectiveStyle) {
                await Haptics.impactAsync(effectiveStyle);
              }
            }
            break;

          case 'notification':
            if (step.style) {
               
              await Haptics.notificationAsync(step.style as Haptics.NotificationFeedbackType);
            }
            break;

          case 'selection':
            await Haptics.selectionAsync();
            break;

          case 'wait':
            if (step.duration) {
              await this.wait(step.duration);
            }
            break;
        }
      }
    } finally {
      this.isPlaying = false;
    }
  }

  /**
   * Play a custom pattern
   */
  async playCustomPattern(steps: PatternStep[]): Promise<void> {
    if (!this.shouldPlay()) return;

    this.cancel();

    const token = { cancelled: false };
    this.cancelToken = token;
    this.isPlaying = true;

    try {
      for (const step of steps) {
        if (token.cancelled) break;

        switch (step.type) {
          case 'impact':
            if (step.style) {
               
              await Haptics.impactAsync(step.style as Haptics.ImpactFeedbackStyle);
            }
            break;

          case 'notification':
            if (step.style) {
               
              await Haptics.notificationAsync(step.style as Haptics.NotificationFeedbackType);
            }
            break;

          case 'selection':
            await Haptics.selectionAsync();
            break;

          case 'wait':
            if (step.duration) {
              await this.wait(step.duration);
            }
            break;
        }
      }
    } finally {
      this.isPlaying = false;
    }
  }

  /**
   * Cancel any playing pattern
   */
  cancel(): void {
    if (this.cancelToken) {
      this.cancelToken.cancelled = true;
      this.cancelToken = null;
    }
    this.isPlaying = false;
  }

  /**
   * Check if a pattern is currently playing
   */
  isPatternPlaying(): boolean {
    return this.isPlaying;
  }

  // Private helpers

  private shouldPlay(): boolean {
    if (!this.config.enabled) return false;
    if (this.config.intensity === 'off') return false;
    if (!this.isAvailable()) return false;
    return true;
  }

  private getEffectiveStyle(
    style?: Haptics.ImpactFeedbackStyle
  ): Haptics.ImpactFeedbackStyle | null {
    // If intensity is off, return null
    if (this.config.intensity === 'off') return null;

    // If no style provided, use intensity-based default
    if (!style) {
      return INTENSITY_MAPPING[this.config.intensity];
    }

    // Adjust style based on intensity
    switch (this.config.intensity) {
      case 'light':
        // Downgrade heavy/medium to light
        if (
          style === Haptics.ImpactFeedbackStyle.Heavy ||
          style === Haptics.ImpactFeedbackStyle.Medium
        ) {
          return Haptics.ImpactFeedbackStyle.Light;
        }
        return style;

      case 'medium':
        // Downgrade heavy to medium
        if (style === Haptics.ImpactFeedbackStyle.Heavy) {
          return Haptics.ImpactFeedbackStyle.Medium;
        }
        return style;

      case 'strong':
      default:
        return style;
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const hapticEngine = new HapticEngine();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Haptic tap.
 *
 */
export function hapticTap(): void {
  hapticEngine.impact(Haptics.ImpactFeedbackStyle.Light);
}

/**
 * Haptic medium.
 *
 */
export function hapticMedium(): void {
  hapticEngine.impact(Haptics.ImpactFeedbackStyle.Medium);
}

/**
 * Haptic heavy.
 *
 */
export function hapticHeavy(): void {
  hapticEngine.impact(Haptics.ImpactFeedbackStyle.Heavy);
}

/**
 * Haptic success.
 *
 */
export function hapticSuccess(): void {
  hapticEngine.notification(Haptics.NotificationFeedbackType.Success);
}

/**
 * Haptic error.
 *
 */
export function hapticError(): void {
  hapticEngine.notification(Haptics.NotificationFeedbackType.Error);
}

/**
 * Haptic warning.
 *
 */
export function hapticWarning(): void {
  hapticEngine.notification(Haptics.NotificationFeedbackType.Warning);
}

/**
 * Haptic selection.
 *
 */
export function hapticSelection(): void {
  hapticEngine.selection();
}

/**
 * Play haptic pattern.
 *
 */
export function playHapticPattern(pattern: HapticPattern): Promise<void> {
  return hapticEngine.playPattern(pattern);
}

// ============================================================================
// React Hook
// ============================================================================

import { useCallback } from 'react';

/**
 * Hook for haptics.
 *
 */
export function useHaptics() {
  const tap = useCallback(() => hapticTap(), []);
  const medium = useCallback(() => hapticMedium(), []);
  const heavy = useCallback(() => hapticHeavy(), []);
  const success = useCallback(() => hapticSuccess(), []);
  const error = useCallback(() => hapticError(), []);
  const warning = useCallback(() => hapticWarning(), []);
  const selection = useCallback(() => hapticSelection(), []);
  const pattern = useCallback((p: HapticPattern) => playHapticPattern(p), []);

  return {
    tap,
    medium,
    heavy,
    success,
    error,
    warning,
    selection,
    pattern,
    engine: hapticEngine,
  };
}

// ============================================================================
// Default Export
// ============================================================================

export default hapticEngine;

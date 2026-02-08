/**
 * Haptic Feedback Simulation Module
 *
 * Provides haptic feedback patterns via the Web Vibration API,
 * simulating mobile-style tactile responses.
 *
 * @version 2.0.0
 * @since v0.7.33
 */

// =============================================================================
// HAPTIC FEEDBACK SIMULATION
// =============================================================================

export class HapticFeedback {
  private static isSupported = 'vibrate' in navigator;

  /**
   * Light haptic feedback (selection change)
   */
  static light(): void {
    if (this.isSupported) {
      navigator.vibrate(10);
    }
  }

  /**
   * Medium haptic feedback (button press)
   */
  static medium(): void {
    if (this.isSupported) {
      navigator.vibrate(20);
    }
  }

  /**
   * Heavy haptic feedback (error/warning)
   */
  static heavy(): void {
    if (this.isSupported) {
      navigator.vibrate([30, 10, 30]);
    }
  }

  /**
   * Success pattern
   */
  static success(): void {
    if (this.isSupported) {
      navigator.vibrate([10, 5, 10]);
    }
  }

  /**
   * Error pattern
   */
  static error(): void {
    if (this.isSupported) {
      navigator.vibrate([50, 30, 50]);
    }
  }

  /**
   * Warning pattern (softer than error)
   */
  static warning(): void {
    if (this.isSupported) {
      navigator.vibrate([30, 20, 30]);
    }
  }

  /**
   * Selection pattern (like iOS picker)
   */
  static selection(): void {
    if (this.isSupported) {
      navigator.vibrate(5);
    }
  }
}

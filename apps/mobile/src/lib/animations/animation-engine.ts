/**
 * Next-Generation Animation Engine for React Native
 * Provides spring physics, gesture animations, and haptic feedback patterns
 */

import { durations } from '@cgraph/animation-constants';
import * as Haptics from 'expo-haptics';

// ==================== HAPTIC FEEDBACK PATTERNS ====================

/**
 *
 */
export class HapticFeedback {
  // Light tap - UI selections, toggles
  /**
   *
   */
  static light() {
    return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  // Medium impact - button presses, swipes
  /**
   *
   */
  static medium() {
    return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  // Heavy impact - important actions, deletions
  /**
   *
   */
  static heavy() {
    return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }

  // Success pattern
  /**
   *
   */
  static success() {
    return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  // Error pattern
  /**
   *
   */
  static error() {
    return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  // Warning pattern
  /**
   *
   */
  static warning() {
    return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }

  // Selection change (iOS only)
  /**
   *
   */
  static selection() {
    return Haptics.selectionAsync();
  }

  // Custom pattern: Double tap feedback
  /**
   *
   */
  static async doubleTap() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 50);
  }

  // Custom pattern: Celebration burst (3 quick taps)
  /**
   *
   */
  static async celebration() {
    for (let i = 0; i < 3; i++) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Custom pattern: Long press confirmed
  /**
   *
   */
  static async longPressConfirm() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise(resolve => setTimeout(resolve, 150));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }

  // Custom pattern: Level up sequence
  /**
   *
   */
  static async levelUp() {
    // Rising pattern
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise(resolve => setTimeout(resolve, 80));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise(resolve => setTimeout(resolve, 80));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise(resolve => setTimeout(resolve, 100));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  // Custom pattern: Swipe to delete warning
  /**
   *
   */
  static async deleteWarning() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise(resolve => setTimeout(resolve, 50));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
}

// ==================== SPRING PHYSICS CONFIGS ====================

export const SpringPresets = {
  // Gentle spring for subtle animations
  gentle: {
    damping: 20,
    stiffness: 90,
    mass: 1,
  },

  // Default spring - balanced and smooth
  default: {
    damping: 15,
    stiffness: 120,
    mass: 1,
  },

  // Bouncy spring for playful animations
  bouncy: {
    damping: 10,
    stiffness: 150,
    mass: 1,
  },

  // Snappy spring for quick interactions
  snappy: {
    damping: 18,
    stiffness: 180,
    mass: 0.8,
  },

  // Slow spring for dramatic effects
  slow: {
    damping: 25,
    stiffness: 60,
    mass: 1.5,
  },

  // Wobbly spring for attention-grabbing
  wobbly: {
    damping: 8,
    stiffness: 130,
    mass: 1,
  },

  // Stiff spring for precise movements
  stiff: {
    damping: 20,
    stiffness: 300,
    mass: 1,
  },
};

// ==================== TIMING CONFIGS ====================

export const TimingPresets = {
  // Quick fade (200ms)
  quick: { duration: durations.normal.ms },

  // Default (300ms)
  default: { duration: durations.slow.ms },

  // Smooth (400ms)
  smooth: { duration: durations.smooth.ms },

  // Slow (600ms)
  slow: { duration: durations.dramatic.ms },

  // Very slow (1000ms)
  verySlow: { duration: durations.verySlow.ms },
};

// ==================== EASING FUNCTIONS ====================

export const EasingPresets = {
  // Standard ease-in-out
  easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  // Ease-in (starts slow)
  easeIn: (t: number) => t * t,

  // Ease-out (ends slow)
  easeOut: (t: number) => t * (2 - t),

  // Elastic ease-out (bounces at end)
  elasticOut: (t: number) => {
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1;
  },

  // Bounce ease-out
  bounceOut: (t: number) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  },
};

// ==================== ANIMATION VARIANTS ====================

export const AnimationVariants = {
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },

  fadeInUp: {
    initial: { opacity: 0, translateY: 20 },
    animate: { opacity: 1, translateY: 0 },
    exit: { opacity: 0, translateY: -20 },
  },

  fadeInDown: {
    initial: { opacity: 0, translateY: -20 },
    animate: { opacity: 1, translateY: 0 },
    exit: { opacity: 0, translateY: 20 },
  },

  // Scale animations
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
  },

  scaleInBounce: {
    initial: { opacity: 0, scale: 0.3 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
  },

  // Slide animations
  slideInRight: {
    initial: { opacity: 0, translateX: 50 },
    animate: { opacity: 1, translateX: 0 },
    exit: { opacity: 0, translateX: -50 },
  },

  slideInLeft: {
    initial: { opacity: 0, translateX: -50 },
    animate: { opacity: 1, translateX: 0 },
    exit: { opacity: 0, translateX: 50 },
  },

  // Rotate animations
  rotateIn: {
    initial: { opacity: 0, rotate: -180, scale: 0.5 },
    animate: { opacity: 1, rotate: 0, scale: 1 },
    exit: { opacity: 0, rotate: 180, scale: 0.5 },
  },

  // Flip animations
  flipIn: {
    initial: { opacity: 0, rotateY: -90 },
    animate: { opacity: 1, rotateY: 0 },
    exit: { opacity: 0, rotateY: 90 },
  },
};

// ==================== GESTURE CONSTANTS ====================

export const GestureThresholds = {
  // Swipe velocity (pixels per second)
  swipeVelocity: 500,

  // Swipe distance threshold (pixels)
  swipeDistance: 50,

  // Long press duration (milliseconds)
  longPressDuration: 500,

  // Double tap max delay (milliseconds)
  doubleTapDelay: 300,

  // Pan threshold before starting (pixels)
  panThreshold: 10,
};

// ==================== COLOR CONSTANTS ====================

export const AnimationColors = {
  // Primary colors
  primary: '#10b981',
  primaryLight: '#34d399',
  primaryDark: '#059669',

  // Accent colors
  purple: '#8b5cf6',
  purpleLight: '#a78bfa',
  pink: '#ec4899',
  pinkLight: '#f472b6',
  amber: '#f59e0b',
  amberLight: '#fbbf24',

  // Matrix theme
  matrixGreen: '#00ff41',
  matrixDark: '#003b00',

  // Neon colors
  neonCyan: '#00f5ff',
  neonMagenta: '#ff00ff',
  neonYellow: '#ffff00',

  // Status colors
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',

  // Dark theme
  dark900: '#111827',
  dark800: '#1f2937',
  dark700: '#374151',
  dark600: '#4b5563',
  dark500: '#6b7280',

  // Text colors
  white: '#ffffff',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
};

// ==================== HELPER UTILITIES ====================

/**
 * Interpolate between two values
 */
export function interpolate(
  value: number,
  inputRange: [number, number],
  outputRange: [number, number]
): number {
  const [inputMin, inputMax] = inputRange;
  const [outputMin, outputMax] = outputRange;

  const ratio = (value - inputMin) / (inputMax - inputMin);
  return outputMin + ratio * (outputMax - outputMin);
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generate stagger delay for list items
 */
export function getStaggerDelay(index: number, baseDelay: number = 50): number {
  return index * baseDelay;
}

/**
 * Check if device prefers reduced motion
 */
export function shouldReduceMotion(): boolean {
  // In React Native, we'd need to check system preferences
  // For now, return false (implement with expo-system-ui or similar)
  return false;
}

/**
 * Convert hex color to rgba
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Animation utilities for React Native
 * 
 * Provides consistent timing, easing, and animation configurations
 * for use with React Native Animated API.
 */

import { Animated, Easing, Platform } from 'react-native';

// ============================================================================
// Timing Constants
// ============================================================================

export const timings = {
  fast: 150,
  normal: 200,
  slow: 300,
  verySlow: 500,
  stagger: 50,
} as const;

// ============================================================================
// Easing Functions
// ============================================================================

export const easings = {
  // Standard easing
  default: Easing.bezier(0.4, 0, 0.2, 1),
  
  // Enter/exit easings
  easeOut: Easing.bezier(0, 0, 0.2, 1),
  easeIn: Easing.bezier(0.4, 0, 1, 1),
  
  // Spring-like
  spring: Easing.bezier(0.68, -0.55, 0.27, 1.55),
  bounce: Easing.bounce,
  
  // Smooth
  smooth: Easing.bezier(0.25, 0.1, 0.25, 1),
} as const;

// ============================================================================
// Animation Factories
// ============================================================================

/**
 * Create a fade animation
 */
export const fadeIn = (
  animatedValue: Animated.Value,
  duration: number = timings.normal,
  useNativeDriver: boolean = true
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    easing: easings.easeOut,
    useNativeDriver,
  });
};

export const fadeOut = (
  animatedValue: Animated.Value,
  duration: number = timings.normal,
  useNativeDriver: boolean = true
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: easings.easeIn,
    useNativeDriver,
  });
};

/**
 * Create a slide animation
 */
export const slideIn = (
  animatedValue: Animated.Value,
  fromValue: number = 50,
  duration: number = timings.normal,
  useNativeDriver: boolean = true
): Animated.CompositeAnimation => {
  animatedValue.setValue(fromValue);
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: easings.easeOut,
    useNativeDriver,
  });
};

/**
 * Create a scale animation (spring-based)
 */
export const scaleSpring = (
  animatedValue: Animated.Value,
  toValue: number = 1,
  useNativeDriver: boolean = true
): Animated.CompositeAnimation => {
  return Animated.spring(animatedValue, {
    toValue,
    friction: 4,
    tension: 100,
    useNativeDriver,
  });
};

/**
 * Create a press animation (scale down and back)
 */
export const pressAnimation = (
  animatedValue: Animated.Value,
  useNativeDriver: boolean = true
) => ({
  pressIn: () => {
    Animated.spring(animatedValue, {
      toValue: 0.95,
      friction: 8,
      tension: 300,
      useNativeDriver,
    }).start();
  },
  pressOut: () => {
    Animated.spring(animatedValue, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver,
    }).start();
  },
});

// ============================================================================
// Complex Animations
// ============================================================================

/**
 * Fade and slide in from bottom
 */
export const fadeSlideIn = (
  opacityValue: Animated.Value,
  translateValue: Animated.Value,
  duration: number = timings.normal,
  delay: number = 0
): Animated.CompositeAnimation => {
  return Animated.parallel([
    Animated.timing(opacityValue, {
      toValue: 1,
      duration,
      delay,
      easing: easings.easeOut,
      useNativeDriver: true,
    }),
    Animated.timing(translateValue, {
      toValue: 0,
      duration,
      delay,
      easing: easings.easeOut,
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Staggered list animation
 */
export const staggeredFadeIn = (
  animatedValues: Animated.Value[],
  staggerDelay: number = timings.stagger
): Animated.CompositeAnimation => {
  return Animated.stagger(
    staggerDelay,
    animatedValues.map((value) =>
      Animated.timing(value, {
        toValue: 1,
        duration: timings.normal,
        easing: easings.easeOut,
        useNativeDriver: true,
      })
    )
  );
};

/**
 * Pulse animation (repeating scale)
 */
export const pulse = (
  animatedValue: Animated.Value,
  minScale: number = 0.97,
  maxScale: number = 1.03,
  duration: number = 1000
): Animated.CompositeAnimation => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: maxScale,
        duration: duration / 2,
        easing: easings.smooth,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: minScale,
        duration: duration / 2,
        easing: easings.smooth,
        useNativeDriver: true,
      }),
    ])
  );
};

// ============================================================================
// Hooks Helpers
// ============================================================================

/**
 * Create animated value with initial setup
 */
export const createAnimatedValue = (initialValue: number = 0): Animated.Value => {
  return new Animated.Value(initialValue);
};

/**
 * Create animated values for list items
 */
export const createAnimatedValues = (count: number, initialValue: number = 0): Animated.Value[] => {
  return Array.from({ length: count }, () => new Animated.Value(initialValue));
};

// ============================================================================
// Transform Helpers
// ============================================================================

/**
 * Create interpolated color (requires non-native driver)
 */
export const interpolateColor = (
  animatedValue: Animated.Value,
  inputRange: number[],
  outputRange: string[]
): Animated.AnimatedInterpolation<string> => {
  return animatedValue.interpolate({
    inputRange,
    outputRange,
  });
};

/**
 * Create interpolated rotation
 */
export const interpolateRotation = (
  animatedValue: Animated.Value,
  inputRange: number[] = [0, 1],
  outputRange: string[] = ['0deg', '360deg']
): Animated.AnimatedInterpolation<string> => {
  return animatedValue.interpolate({
    inputRange,
    outputRange,
  });
};

// ============================================================================
// Platform-specific helpers
// ============================================================================

/**
 * Get appropriate native driver setting for the animation type
 */
export const canUseNativeDriver = (animatingProperty: 'transform' | 'opacity' | 'other'): boolean => {
  if (animatingProperty === 'other') return false;
  return true;
};

/**
 * Platform-aware animation config
 */
export const getPlatformAnimationConfig = () => ({
  duration: Platform.OS === 'ios' ? timings.normal : timings.fast,
  useNativeDriver: true,
});

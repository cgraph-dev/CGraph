/**
 * Animations Library - Comprehensive Animation System for React Native
 *
 * This module provides:
 * - Animation presets (60+ entrance/exit animations)
 * - Spring physics presets (10 configurations)
 * - Easing functions (25+ options)
 * - Pre-built animated components
 * - Haptic feedback patterns
 */

// ============================================================================
// Animation Engine (original)
// ============================================================================

export {
  HapticFeedback,
  SpringPresets,
  TimingPresets,
  EasingPresets,
  AnimationVariants,
  GestureThresholds,
  AnimationColors,
  interpolate,
  clamp,
  getStaggerDelay as getStaggerDelayLegacy,
  shouldReduceMotion,
  hexToRgba,
} from './AnimationEngine';

// ============================================================================
// Animation Library (extended)
// ============================================================================

export { default as AnimationLibrary } from './AnimationLibrary';
export {
  SPRING_PRESETS,
  TIMING_PRESETS,
  EASING_FUNCTIONS,
  ENTRANCE_ANIMATIONS,
  EXIT_ANIMATIONS,
  LOOP_ANIMATIONS,
  getStaggerDelay,
  getStaggerDelays,
  combineAnimations,
  createDelayedAnimation,
  createSequencedAnimations,
} from './AnimationLibrary';

export type {
  SpringConfig,
  TimingConfig,
  AnimationValues,
  AnimationPreset,
} from './AnimationLibrary';

// ============================================================================
// Animated Components
// ============================================================================

export { default as AnimatedComponents } from './AnimatedComponents';
export {
  AnimatedView,
  AnimatedText,
  AnimatedButton,
  AnimatedList,
  AnimatedImage,
  AnimatedCounter,
  AnimatedProgress,
} from './AnimatedComponents';

export type {
  AnimatedViewProps,
  AnimatedTextProps,
  AnimatedButtonProps,
  AnimatedListProps,
  AnimatedImageProps,
  AnimatedCounterProps,
  AnimatedProgressProps,
} from './AnimatedComponents';

// ============================================================================
// Timeline System
// ============================================================================

export { default as TimelineSystem } from './TimelineSystem';
export {
  KeyframeBuilder,
  TimelineBuilder,
  runKeyframeAnimation,
  runTimeline,
  createStaggeredAnimation,
  createWaveAnimation,
  createPulseAnimation,
  createShakeAnimation,
  createBounceAnimation,
  stopAnimation,
  stopAllAnimations,
  CHOREOGRAPHY_PRESETS,
} from './TimelineSystem';

export type {
  Keyframe,
  KeyframeAnimation,
  TimelineStep,
  Timeline,
  ChoreographyConfig,
} from './TimelineSystem';

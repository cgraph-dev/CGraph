/**
 * Interactions Library
 *
 * Feedback systems, haptics, and micro-interactions.
 */

// ============================================================================
// Feedback System
// ============================================================================

export {
  PressableFeedback,
  Skeleton,
  SkeletonGroup,
  SuccessAnimation,
  ErrorAnimation,
  LoadingAnimation,
  EmptyState,
  Ripple,
  default as FeedbackSystem,
} from './feedback-system';

export type {
  PressableFeedbackProps,
  SkeletonProps,
  SkeletonGroupProps,
  SuccessAnimationProps,
  ErrorAnimationProps,
  LoadingAnimationProps,
  EmptyStateProps,
  RippleProps,
  PressStyle,
  FeedbackIntensity,
} from './feedback-system';

// ============================================================================
// Haptic Patterns
// ============================================================================

export {
  hapticEngine,
  hapticTap,
  hapticMedium,
  hapticHeavy,
  hapticSuccess,
  hapticError,
  hapticWarning,
  hapticSelection,
  playHapticPattern,
  useHaptics,
  default as HapticPatterns,
} from './haptic-patterns';

export type { HapticIntensity, HapticPattern, HapticConfig, PatternStep } from './haptic-patterns';

// ============================================================================
// Default Export
// ============================================================================

const Interactions = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  FeedbackSystem: require('./feedback-system').default,

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  HapticPatterns: require('./haptic-patterns').default,
};

export default Interactions;

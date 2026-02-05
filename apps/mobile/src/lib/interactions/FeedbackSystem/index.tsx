/**
 * FeedbackSystem - Comprehensive feedback and loading components
 *
 * Extracted from monolithic FeedbackSystem.tsx for better maintainability.
 * Provides animated feedback components for user interactions.
 */

// Re-export all types
export type {
  PressableFeedbackProps,
  SkeletonProps,
  SkeletonGroupProps,
  SuccessAnimationProps,
  ErrorAnimationProps,
  LoadingAnimationProps,
  EmptyStateProps,
  RippleProps,
} from './types';

// Re-export all components
export {
  PressableFeedback,
  Skeleton,
  SkeletonGroup,
  SuccessAnimation,
  ErrorAnimation,
  LoadingAnimation,
  EmptyState,
  Ripple,
} from './components';

// Import for default export
import {
  PressableFeedback,
  Skeleton,
  SkeletonGroup,
  SuccessAnimation,
  ErrorAnimation,
  LoadingAnimation,
  EmptyState,
  Ripple,
} from './components';

// ============================================================================
// Default Export - Maintains backward compatibility
// ============================================================================

const FeedbackSystem = {
  PressableFeedback,
  Skeleton,
  SkeletonGroup,
  SuccessAnimation,
  ErrorAnimation,
  LoadingAnimation,
  EmptyState,
  Ripple,
};

export default FeedbackSystem;

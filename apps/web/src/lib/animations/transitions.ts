/**
 * Animation Transitions Library
 *
 * Centralized animation variants and transitions for consistent motion design
 * throughout the CGraph application. All animations target 60 FPS performance
 * with GPU-accelerated transforms.
 *
 * This file re-exports from the transitions/ submodules for backward compatibility.
 */

// Core configuration
export { easings, springs, durations, staggerConfigs } from './transitions/core';

// Component variants
export {
  pageTransitions,
  listItemVariants,
  listItemVariantsSlide,
  listItemVariantsScale,
  cardVariants,
  cardVariantsSubtle,
  buttonVariants,
  buttonVariantsSubtle,
  modalVariants,
  modalBackdropVariants,
  notificationVariants,
  loadingVariants,
  skeletonVariants,
  badgeVariants,
} from './transitions/variants';

// Helper functions & utilities
export {
  createStaggerContainer,
  withDelay,
  createSpring,
  createTween,
  gpuAccelerated,
  safeCSSProps,
  getReducedMotion,
  getAccessibleTransition,
} from './transitions/helpers';

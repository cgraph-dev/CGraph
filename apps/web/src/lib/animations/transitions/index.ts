/**
 * Animation Transitions Library - Barrel Export
 *
 * Re-exports all animation variants, transitions, and utilities
 * from the transitions submodules.
 */

// Core configuration: easings, springs, durations, stagger configs
export { easings, springs, durations, staggerConfigs } from './core';

// Component variants: page transitions, list items, cards, buttons,
// modals, notifications, loading, skeletons, badges
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
} from './variants';

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
} from './helpers';

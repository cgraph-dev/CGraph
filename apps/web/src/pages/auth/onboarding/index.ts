/**
 * Onboarding module - first-time user experience
 *
 * This module provides:
 * - Step-by-step wizard with animated transitions
 * - Avatar upload and profile customization
 * - Notification preferences setup
 * - Feature highlights tour
 */

export { default as Onboarding } from './Onboarding';
export { ProgressBar } from './ProgressBar';
export { StepHeader } from './StepHeader';
export { WelcomeStep } from './WelcomeStep';
export { ProfileStep } from './ProfileStep';
export { NotificationsStep } from './NotificationsStep';
export { FeaturesStep } from './FeaturesStep';
export { NavigationButtons } from './NavigationButtons';
export { useOnboarding } from './useOnboarding';
export {
  ONBOARDING_STEPS,
  FEATURES,
  NOTIFICATION_OPTIONS,
  DEFAULT_PROFILE_DATA,
} from './constants';
export { pageVariants, containerVariants, itemVariants } from './animations';
export type {
  OnboardingStep,
  ProfileData,
  Feature,
  ProfileUpdatePayload,
  NotificationKey,
  NotificationOption,
} from './types';

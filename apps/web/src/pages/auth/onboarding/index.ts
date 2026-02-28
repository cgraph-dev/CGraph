/**
 * Onboarding module - first-time user experience
 *
 * This module provides:
 * - Step-by-step wizard with animated transitions
 * - Avatar upload and profile customization
 * - Notification preferences setup
 * - Feature highlights tour
 */

export { default as Onboarding } from './onboarding';
export { ProgressBar } from './progress-bar';
export { StepHeader } from './step-header';
export { WelcomeStep } from './welcome-step';
export { ProfileStep } from './profile-step';
export { FindFriendsStep } from './find-friends-step';
export { CommunityStep } from './community-step';
export { NavigationButtons } from './navigation-buttons';
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

/**
 * CreateForum module - multi-step forum creation wizard
 *
 * This module provides:
 * - 4-step wizard for forum creation
 * - Form validation and error handling
 * - Preview before submission
 * - Subscription tier info
 */

export { default as CreateForum } from './CreateForum';
export { StepIndicator } from './StepIndicator';
export { BasicInfoStep } from './BasicInfoStep';
export { AppearanceStep } from './AppearanceStep';
export { SettingsStep } from './SettingsStep';
export { ConfirmStep } from './ConfirmStep';
export { useCreateForum } from './useCreateForum';
export {
  FORUM_CATEGORIES,
  WIZARD_STEPS,
  DEFAULT_FORM_DATA,
  NAME_MIN_LENGTH,
  NAME_MAX_LENGTH,
  SLUG_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
} from './constants';
export type { ForumFormData, ForumCategory, StepInfo } from './types';

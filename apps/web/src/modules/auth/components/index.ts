/**
 * Auth Module Components
 *
 * Re-exports authentication components from centralized location.
 * Import from '@/modules/auth/components' for module-based organization.
 *
 * @module @modules/auth/components
 * @deprecated Import from '@/components/auth' until full migration complete
 */

// Re-export all auth components from legacy location
export {
  AuthFormInput,
  AuthButton,
  PasswordStrengthMeter,
  AuthCard,
  SocialLoginDivider,
  OAuthButton,
  OAuthButtonGroup,
} from '@/components/auth';

// Re-export types
export type {
  AuthFormInputProps,
  AuthButtonProps,
  PasswordStrengthMeterProps,
  AuthCardProps,
  SocialLoginDividerProps,
} from '@/components/auth';

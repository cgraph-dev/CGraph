/**
 * Auth Components
 *
 * Re-exports authentication-related components from the auth module.
 *
 * @deprecated Import from '@/modules/auth/components' instead
 */

// Re-export from auth module
export {
  AuthFormInput,
  AuthButton,
  PasswordStrengthMeter,
  AuthCard,
  SocialLoginDivider,
  OAuthButton,
  OAuthButtonGroup,
} from '@/modules/auth/components';

// Re-export types
export type {
  AuthFormInputProps,
  AuthButtonProps,
  PasswordStrengthMeterProps,
  AuthCardProps,
  SocialLoginDividerProps,
} from '@/modules/auth/components';

// OAuth convenience exports (for backward compatibility)
export { OAuthButtonGroup as default } from '@/modules/auth/components';
export { OAuthButton as AuthDivider } from '@/modules/auth/components';

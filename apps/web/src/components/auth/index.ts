/**
 * Auth Components
 *
 * Reusable authentication UI components with animations.
 */

// Form components
export { AuthFormInput } from './AuthFormInput';
export type { AuthFormInputProps } from './AuthFormInput';

export { AuthButton } from './AuthButton';
export type { AuthButtonProps } from './AuthButton';

export { PasswordStrengthMeter } from './PasswordStrengthMeter';
export type { PasswordStrengthMeterProps } from './PasswordStrengthMeter';

// Layout components
export { AuthCard } from './AuthCard';
export type { AuthCardProps } from './AuthCard';

export { SocialLoginDivider } from './SocialLoginDivider';
export type { SocialLoginDividerProps } from './SocialLoginDivider';

// OAuth buttons (existing)
export { OAuthButton, OAuthButtonGroup } from './OAuthButtons';

// Default export
export { AuthCard as default } from './AuthCard';

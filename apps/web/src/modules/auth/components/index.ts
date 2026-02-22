/**
 * Auth Components
 *
 * Reusable authentication UI components with animations.
 */

// Form components
export { AuthFormInput } from './auth-form-input';
export type { AuthFormInputProps } from './auth-form-input';

export { AuthButton } from './auth-button';
export type { AuthButtonProps } from './auth-button';

export { PasswordStrengthMeter } from './password-strength-meter';
export type { PasswordStrengthMeterProps } from './password-strength-meter';

// Layout components
export { AuthCard } from './auth-card';
export type { AuthCardProps } from './auth-card';

export { SocialLoginDivider } from './social-login-divider';
export type { SocialLoginDividerProps } from './social-login-divider';

// OAuth buttons (existing)
export { OAuthButton, OAuthButtonGroup } from './o-auth-buttons';

// Default export
export { AuthCard as default } from './auth-card';

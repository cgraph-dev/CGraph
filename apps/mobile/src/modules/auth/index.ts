/**
 * Auth Module — screens, components, hooks for authentication flow.
 * @module modules/auth
 */

// Screens — re-exported from legacy screens/ during migration
export { default as LoginScreen } from '../../screens/auth/LoginScreen';
export { default as RegisterScreen } from '../../screens/auth/RegisterScreen';
export { default as ForgotPasswordScreen } from '../../screens/auth/ForgotPasswordScreen';
export { default as ResetPasswordScreen } from '../../screens/auth/ResetPasswordScreen';
export { default as VerifyEmailScreen } from '../../screens/auth/VerifyEmailScreen';
export { default as OnboardingScreen } from '../../screens/auth/OnboardingScreen';

// Hooks — re-exported from features/auth during migration
export { useBiometricAuth, use2FA } from '../../features/auth/hooks';

// Store
export { useAuthStore, useAuthUser, useIsAuthenticated, useAuthLoading } from '../../stores/authStore';

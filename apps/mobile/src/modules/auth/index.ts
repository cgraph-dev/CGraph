/**
 * Auth Module — screens, components, hooks for authentication flow.
 * @module modules/auth
 */

// Screens — re-exported from legacy screens/ during migration
export { default as LoginScreen } from '../../screens/auth/login-screen';
export { default as RegisterScreen } from '../../screens/auth/register-screen';
export { default as ForgotPasswordScreen } from '../../screens/auth/forgot-password-screen';
export { default as ResetPasswordScreen } from '../../screens/auth/reset-password-screen';
export { default as VerifyEmailScreen } from '../../screens/auth/verify-email-screen';
export { default as OnboardingScreen } from '../../screens/auth/onboarding-screen';

// Hooks — re-exported from features/auth during migration
export { useBiometricAuth, useTwoFactor as use2FA } from '../../features/auth/hooks';

// Store
export {
  useAuthStore,
  useAuthUser,
  useIsAuthenticated,
  useAuthLoading,
} from '../../stores/authStore';

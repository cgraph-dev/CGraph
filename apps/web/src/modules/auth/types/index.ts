/**
 * Auth Module Types
 *
 * Type definitions for authentication functionality.
 *
 * @module modules/auth/types
 * @version 1.0.0
 */

// Re-export store types
export type { User, AuthState } from '../store/authStore.impl';

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Registration data
 */
export interface RegistrationData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  marketingOptIn?: boolean;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password reset confirmation
 */
export interface PasswordResetConfirmation {
  token: string;
  password: string;
  confirmPassword: string;
}

/**
 * Two-factor authentication setup response
 */
export interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

/**
 * Two-factor verification
 */
export interface TwoFactorVerification {
  code: string;
}

/**
 * OAuth provider
 */
export type OAuthProvider = 'google' | 'apple' | 'discord' | 'github';

/**
 * OAuth callback data
 */
export interface OAuthCallbackData {
  provider: OAuthProvider;
  code: string;
  state?: string;
}

/**
 * Session information
 */
export interface Session {
  id: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  location?: string;
  lastActive: string;
  createdAt: string;
  isCurrent: boolean;
}

/**
 * Auth error codes
 */
export type AuthErrorCode =
  | 'invalid_credentials'
  | 'account_locked'
  | 'account_not_verified'
  | 'email_taken'
  | 'username_taken'
  | 'weak_password'
  | 'invalid_token'
  | 'token_expired'
  | 'two_factor_required'
  | 'two_factor_invalid'
  | 'rate_limited'
  | 'network_error'
  | 'unknown_error';

/**
 * Auth error
 */
export interface AuthError {
  code: AuthErrorCode;
  message: string;
  field?: string;
}

/**
 * Token pair
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

/**
 * Auth response
 */
export interface AuthResponse {
  user: import('../store/authStore.impl').User;
  tokens: TokenPair;
  requiresTwoFactor?: boolean;
}

/**
 * User update payload
 */
export interface UserUpdatePayload {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  status?: string;
  pronouns?: string;
  timezone?: string;
}

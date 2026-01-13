/**
 * Auth Types
 * 
 * TypeScript types and interfaces for auth feature.
 */

// Re-export from shared types
export type {
  User,
  Session,
  AuthTokens,
} from '@cgraph/shared-types';

// Feature-specific types
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatar?: string;
  isEmailVerified: boolean;
  is2FAEnabled: boolean;
  walletAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  displayName?: string;
  inviteCode?: string;
  referralCode?: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  requires2FA?: boolean;
}

export interface TwoFactorSetupData {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface SessionInfo {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  location?: {
    city?: string;
    country?: string;
  };
  isCurrent: boolean;
  createdAt: Date;
  lastActiveAt: Date;
  expiresAt: Date;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
}

export interface WalletAuthChallenge {
  message: string;
  nonce: string;
  expiresAt: string;
}

export interface WalletAuthVerify {
  address: string;
  signature: string;
  nonce: string;
}

export interface OAuthProvider {
  id: 'google' | 'apple' | 'github';
  name: string;
  icon: string;
  isEnabled: boolean;
}

export type AuthError = 
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_VERIFIED'
  | '2FA_REQUIRED'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_DISABLED'
  | 'SESSION_EXPIRED'
  | 'TOKEN_INVALID'
  | 'RATE_LIMITED';

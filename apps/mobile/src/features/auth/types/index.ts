/**
 * Auth Types (Mobile)
 */

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatar?: string;
  isEmailVerified: boolean;
  is2FAEnabled: boolean;
  createdAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  inviteCode?: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  requires2FA?: boolean;
}

export type AuthError =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_VERIFIED'
  | '2FA_REQUIRED'
  | 'ACCOUNT_LOCKED'
  | 'SESSION_EXPIRED';

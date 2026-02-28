/**
 * Auth Store Types
 *
 * Type definitions for authentication state management.
 */

// Type for API error responses
export interface ApiErrorResponse {
  error?: string;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface User {
  id: string;
  uid: string; // Random 10-digit UID (e.g., "4829173650")
  userId: number; // Legacy sequential ID (for backward compatibility)
  userIdDisplay: string; // Formatted UID for display (e.g., "#4829173650")
  email: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  walletAddress: string | null;
  emailVerifiedAt: string | null;
  twoFactorEnabled: boolean;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  statusMessage: string | null;
  karma: number;
  isVerified: boolean;
  isPremium: boolean;
  isAdmin: boolean;
  canChangeUsername: boolean;
  usernameNextChangeAt: string | null;
  createdAt: string;

  // Profile fields
  bio?: string;
  pronouns?: string;
  location?: string;
  website?: string;
  occupation?: string;
  bannerUrl?: string | null;

  // Gamification fields
  level?: number;
  xp?: number;
  title?: string;
  titleColor?: string;
  badges?: string[];
  streak?: number;
  coins?: number;

  // Subscription/Premium info
  subscription?: {
    tier?: 'free' | 'premium' | 'enterprise';
    status?: 'active' | 'inactive' | 'cancelled';
    expiresAt?: string;
  } | null;
}

export interface WalletChallenge {
  message: string;
  nonce: string;
}

/** Returned by login() when user has 2FA enabled */
export interface TwoFactorRequired {
  twoFactorRequired: true;
  twoFactorToken: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<TwoFactorRequired | void>;
  verifyLoginTwoFactor: (twoFactorToken: string, code: string) => Promise<void>;
  getWalletChallenge: (walletAddress: string) => Promise<WalletChallenge>;
  loginWithWallet: (walletAddress: string, signature: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
  reset: () => void;
}

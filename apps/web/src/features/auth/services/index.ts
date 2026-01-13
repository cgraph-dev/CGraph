/**
 * Auth Services
 * 
 * API and business logic services for authentication.
 */

// API endpoints for auth
export const authApi = {
  // Authentication
  login: () => '/api/v1/auth/login',
  logout: () => '/api/v1/auth/logout',
  register: () => '/api/v1/auth/register',
  refreshToken: () => '/api/v1/auth/refresh',
  
  // Password management
  forgotPassword: () => '/api/v1/auth/forgot-password',
  resetPassword: () => '/api/v1/auth/reset-password',
  changePassword: () => '/api/v1/auth/change-password',
  
  // Email verification
  verifyEmail: (token: string) => `/api/v1/auth/verify-email/${token}`,
  resendVerification: () => '/api/v1/auth/resend-verification',
  
  // Two-factor authentication
  enable2FA: () => '/api/v1/auth/2fa/enable',
  verify2FA: () => '/api/v1/auth/2fa/verify',
  disable2FA: () => '/api/v1/auth/2fa/disable',
  getBackupCodes: () => '/api/v1/auth/2fa/backup-codes',
  
  // OAuth
  oauthGoogle: () => '/api/v1/auth/oauth/google',
  oauthApple: () => '/api/v1/auth/oauth/apple',
  oauthGithub: () => '/api/v1/auth/oauth/github',
  
  // Web3 wallet auth
  walletChallenge: () => '/api/v1/auth/wallet/challenge',
  walletVerify: () => '/api/v1/auth/wallet/verify',
  
  // Sessions
  getSessions: () => '/api/v1/auth/sessions',
  revokeSession: (sessionId: string) => `/api/v1/auth/sessions/${sessionId}`,
  revokeAllSessions: () => '/api/v1/auth/sessions/revoke-all',
  
  // User management
  getMe: () => '/api/v1/auth/me',
  updateProfile: () => '/api/v1/auth/profile',
  deleteAccount: () => '/api/v1/auth/account',
};

// Token storage utilities
export const tokenStorage = {
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('cgraph_access_token');
  },
  
  setAccessToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cgraph_access_token', token);
    }
  },
  
  removeAccessToken: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cgraph_access_token');
    }
  },
  
  // Refresh token is stored in HTTP-only cookie for security
  // These are handled server-side
};

// Password validation rules
export const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

export function validatePassword(password: string): { 
  isValid: boolean; 
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < PASSWORD_RULES.minLength) {
    errors.push(`Password must be at least ${PASSWORD_RULES.minLength} characters`);
  }
  if (password.length > PASSWORD_RULES.maxLength) {
    errors.push(`Password must be at most ${PASSWORD_RULES.maxLength} characters`);
  }
  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }
  if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }
  if (PASSWORD_RULES.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain a number');
  }
  if (PASSWORD_RULES.requireSpecial && !new RegExp(`[${PASSWORD_RULES.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password)) {
    errors.push('Password must contain a special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

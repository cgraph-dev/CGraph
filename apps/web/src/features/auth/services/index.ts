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

/**
 * Token Storage Utilities
 * 
 * SECURITY MODEL (v0.9.0+):
 * =========================
 * 
 * PRIMARY AUTH: HTTP-only cookies
 *   - Set automatically by backend on login/register/refresh
 *   - Sent automatically with every request (withCredentials: true)
 *   - CANNOT be accessed by JavaScript (XSS immune)
 *   - Access token: 15 min expiry
 *   - Refresh token: 7 days, path-restricted to /api/v1/auth/refresh
 * 
 * SECONDARY: Token in sessionStorage (WebSocket ONLY)
 *   - Phoenix Channels require token in connection params
 *   - HTTP-only cookies cannot be read by JS for WebSocket auth
 *   - sessionStorage is cleared on browser/tab close
 *   - This token is only used for socket.connect() params
 * 
 * DEPRECATED: localStorage
 *   - No longer used - was XSS vulnerable
 *   - Migrated to HTTP-only cookies in v0.9.0
 * 
 * The getAccessToken function below reads from sessionStorage which
 * is populated by the authStore on login. This is ONLY for WebSocket
 * connections - all HTTP requests use HTTP-only cookies automatically.
 */
export const tokenStorage = {
  /**
   * Get access token for WebSocket connections only.
   * HTTP requests should NOT use this - they use cookies automatically.
   */
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    // Read from sessionStorage (set by authStore on login)
    // This is only for Phoenix socket connection params
    const stored = sessionStorage.getItem('auth-storage');
    if (!stored) return null;
    try {
      const parsed = JSON.parse(decodeURIComponent(atob(stored)));
      return parsed?.state?.token || null;
    } catch {
      return null;
    }
  },
  
  /**
   * @deprecated Tokens are now managed via HTTP-only cookies.
   * Do not call this directly - authStore handles token storage.
   */
  setAccessToken: (_token: string): void => {
    console.warn('[tokenStorage] setAccessToken is deprecated. Tokens are now managed via HTTP-only cookies.');
    // No-op - authStore uses sessionStorage for WebSocket token
    // HTTP auth uses cookies set by backend
  },
  
  /**
   * @deprecated Tokens are now managed via HTTP-only cookies.
   * Do not call this directly - use authStore.logout() instead.
   */
  removeAccessToken: (): void => {
    console.warn('[tokenStorage] removeAccessToken is deprecated. Use authStore.logout() instead.');
    // No-op - cookies are cleared server-side on logout
  },
  
  /**
   * Refresh token is stored in HTTP-only cookie for security.
   * It's path-restricted to /api/v1/auth/refresh so it's only sent
   * to the refresh endpoint, not every request.
   */
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

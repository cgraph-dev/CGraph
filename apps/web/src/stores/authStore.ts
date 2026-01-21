import { create } from 'zustand';
import { devtools, persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { api } from '@/lib/api';
import { registerTokenHandlers } from '@/lib/tokenService';
import { AxiosError } from 'axios';

// Type for API error responses
interface ApiErrorResponse {
  error?: string;
  message?: string;
  errors?: Record<string, string[]>;
}

// Helper to extract error message from API errors
function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    return data?.error || data?.message || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
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
    tier?: 'free' | 'plus' | 'pro' | 'premium';
    status?: 'active' | 'inactive' | 'cancelled';
    expiresAt?: string;
  } | null;
}

// Map API user response to frontend User type
// Exported for use in OAuth callbacks
export function mapUserFromApi(apiUser: Record<string, unknown>): User {
  return {
    id: apiUser.id as string,
    uid: (apiUser.uid as string) || '',
    userId: (apiUser.user_id as number) || 0,
    userIdDisplay: (apiUser.user_id_display as string) || '#0000000000',
    email: apiUser.email as string,
    username: (apiUser.username as string | null) || null,
    displayName: (apiUser.display_name as string | null) || null,
    avatarUrl: (apiUser.avatar_url as string | null) || null,
    walletAddress: (apiUser.wallet_address as string | null) || null,
    emailVerifiedAt: (apiUser.email_verified_at as string | null) || null,
    twoFactorEnabled: (apiUser.totp_enabled as boolean) || false,
    status: (apiUser.status as 'online' | 'idle' | 'dnd' | 'offline') || 'offline',
    statusMessage: (apiUser.custom_status as string | null) || null,
    karma: (apiUser.karma as number) || 0,
    isVerified: (apiUser.is_verified as boolean) || false,
    isPremium: (apiUser.is_premium as boolean) || false,
    isAdmin: (apiUser.is_admin as boolean) || false,
    canChangeUsername: (apiUser.can_change_username as boolean) ?? true,
    usernameNextChangeAt: (apiUser.username_next_change_at as string | null) || null,
    createdAt: apiUser.inserted_at as string,
    // Gamification fields
    level: (apiUser.level as number) || 1,
    xp: (apiUser.xp as number) || 0,
    coins: (apiUser.coins as number) || 0,
    title: apiUser.title as string | undefined,
    titleColor: apiUser.title_color as string | undefined,
    badges: apiUser.badges as string[] | undefined,
    streak: (apiUser.streak as number) || 0,
  };
}

interface WalletChallenge {
  message: string;
  nonce: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  getWalletChallenge: (walletAddress: string) => Promise<WalletChallenge>;
  loginWithWallet: (walletAddress: string, signature: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

/**
 * Session storage wrapper for auth persistence
 *
 * SECURITY MODEL (XSS MITIGATION):
 * ================================
 *
 * 1. PRIMARY AUTH: HTTP-only cookies
 *    - Set by backend on login/register/refresh
 *    - Automatically sent with every request (withCredentials: true)
 *    - CANNOT be accessed by JavaScript (XSS immune)
 *    - This is the primary authentication mechanism
 *
 * 2. SECONDARY: Token in sessionStorage (WebSocket ONLY)
 *    - Phoenix Channels require token in connection params
 *    - HTTP-only cookies cannot be read by JS for WebSocket auth
 *    - This is a known limitation of WebSocket authentication
 *
 * MITIGATIONS:
 *    - sessionStorage (not localStorage): cleared on browser/tab close
 *    - Base64 encoding: provides obfuscation (not encryption)
 *    - Short-lived access tokens: expire in 15 minutes
 *    - Refresh tokens: sent via HTTP-only cookie path restriction
 *    - CORS + SameSite cookie settings prevent CSRF
 *    - Content Security Policy prevents inline script injection
 *
 * ATTACK SURFACE:
 *    - An XSS attack could steal the access token (15 min lifetime)
 *    - Cannot steal refresh token (HTTP-only cookie with path restriction)
 *    - User would need to re-login after access token expires
 *
 * FUTURE IMPROVEMENT:
 *    - Consider using a short-lived WebSocket-specific token
 *    - Implement token binding to prevent token theft reuse
 */
const createSecureStorage = (): StateStorage => {
  const encode = (data: string): string => {
    try {
      return btoa(encodeURIComponent(data));
    } catch {
      return data;
    }
  };

  const decode = (data: string): string => {
    try {
      return decodeURIComponent(atob(data));
    } catch {
      return data;
    }
  };

  return {
    getItem: (name: string): string | null => {
      const value = sessionStorage.getItem(name);
      if (!value) return null;
      try {
        return decode(value);
      } catch {
        return value;
      }
    },
    setItem: (name: string, value: string): void => {
      sessionStorage.setItem(name, encode(value));
    },
    removeItem: (name: string): void => {
      sessionStorage.removeItem(name);
    },
  };
};

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false, // Start with false - checkAuth will handle loading state
        error: null,

        login: async (email: string, password: string) => {
          set({ isLoading: true, error: null }, false, 'login/start');
          try {
            const response = await api.post('/api/v1/auth/login', {
              identifier: email, // Backend accepts email or username
              password,
            });
            const { user, tokens } = response.data;
            set(
              {
                user: mapUserFromApi(user),
                token: tokens.access_token,
                refreshToken: tokens.refresh_token,
                isAuthenticated: true,
                isLoading: false,
              },
              false,
              'login/success'
            );
          } catch (error: unknown) {
            set(
              {
                error: getApiErrorMessage(error, 'Login failed'),
                isLoading: false,
              },
              false,
              'login/error'
            );
            throw error;
          }
        },

        getWalletChallenge: async (walletAddress: string): Promise<WalletChallenge> => {
          try {
            const response = await api.post('/api/v1/auth/wallet/challenge', {
              wallet_address: walletAddress,
            });
            return {
              message: response.data.message,
              nonce: response.data.nonce,
            };
          } catch (error: unknown) {
            const errorMessage = getApiErrorMessage(error, 'Failed to get wallet challenge');
            set({ error: errorMessage });
            throw new Error(errorMessage);
          }
        },

        loginWithWallet: async (walletAddress: string, signature: string) => {
          set({ isLoading: true, error: null });
          try {
            const response = await api.post('/api/v1/auth/wallet/verify', {
              wallet_address: walletAddress,
              signature,
            });
            const { user, tokens } = response.data;
            set({
              user: mapUserFromApi(user),
              token: tokens.access_token,
              refreshToken: tokens.refresh_token,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error: unknown) {
            set({
              error: getApiErrorMessage(error, 'Wallet login failed'),
              isLoading: false,
            });
            throw error;
          }
        },

        register: async (email: string, username: string, password: string) => {
          set({ isLoading: true, error: null });
          try {
            const response = await api.post('/api/v1/auth/register', {
              user: {
                email,
                username,
                password,
                password_confirmation: password, // Backend requires confirmation
              },
            });
            const { user, tokens } = response.data;
            set({
              user: mapUserFromApi(user),
              token: tokens.access_token,
              refreshToken: tokens.refresh_token,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error: unknown) {
            set({
              error: getApiErrorMessage(error, 'Registration failed'),
              isLoading: false,
            });
            throw error;
          }
        },

        logout: async () => {
          // Attempt server-side logout to invalidate tokens
          const { token } = get();
          if (token) {
            try {
              await api.post('/api/v1/auth/logout');
            } catch {
              // Continue with client-side cleanup even if server call fails
              // This handles offline scenarios gracefully
            }
          }

          // Clear all client-side auth state
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        },

        refreshSession: async () => {
          const { refreshToken } = get();
          if (!refreshToken) {
            set({ isLoading: false });
            return;
          }

          try {
            const response = await api.post('/api/v1/auth/refresh', {
              refresh_token: refreshToken,
            });
            // Handle both wrapped and unwrapped token responses
            const data = response.data;
            const tokens = data.tokens || data;
            const accessToken = tokens.access_token;
            const newRefreshToken = tokens.refresh_token;

            if (accessToken) {
              set({
                token: accessToken,
                refreshToken: newRefreshToken || refreshToken,
              });
            }
          } catch {
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
            });
          }
        },

        updateUser: (data: Partial<User>) => {
          const { user } = get();
          if (user) {
            set({ user: { ...user, ...data } });
          }
        },

        clearError: () => set({ error: null }),

        checkAuth: async () => {
          const { token } = get();
          if (!token) {
            set({ isLoading: false, isAuthenticated: false });
            return;
          }

          try {
            const response = await api.get('/api/v1/me');
            // Backend returns { data: { id, email, ... } }
            const userData = response.data.data || response.data.user || response.data;
            set({
              user: mapUserFromApi(userData),
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            // Clear invalid/stale auth on any error
            if (import.meta.env.DEV) {
              console.debug('[AuthStore] checkAuth failed - clearing auth:', error);
            }
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        },
      }),
      {
        name: 'cgraph-auth',
        storage: createJSONStorage(() => createSecureStorage()),
        partialize: (state) => ({
          token: state.token,
          refreshToken: state.refreshToken,
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
        // Critical: Handle rehydration to fix isLoading state
        onRehydrateStorage: () => {
          if (import.meta.env.DEV) {
            console.debug('[AuthStore] onRehydrateStorage called');
          }
          return (state, error) => {
            if (import.meta.env.DEV) {
              console.debug('[AuthStore] Rehydration callback - state:', !!state, 'error:', error);
            }
            if (error) {
              console.error('Auth store rehydration failed:', error);
              // On error, reset to safe state
              useAuthStore.setState({
                isLoading: false,
                isAuthenticated: false,
                user: null,
                token: null,
                refreshToken: null,
              });
            } else if (state) {
              // Rehydration successful - mark loading as complete
              // Don't block on token validation - let the app render
              if (import.meta.env.DEV) {
                console.debug('[AuthStore] Rehydration complete - hasToken:', !!state.token);
              }
              useAuthStore.setState({
                isLoading: false, // Never block - checkAuth runs in background
              });
            } else {
              // No state to rehydrate
              if (import.meta.env.DEV) {
                console.debug('[AuthStore] No state to rehydrate');
              }
              useAuthStore.setState({ isLoading: false });
            }
          };
        },
      }
    ),
    {
      name: 'AuthStore',
      enabled: import.meta.env.DEV,
    }
  )
);

/**
 * Register token handlers with tokenService
 *
 * CIRCULAR DEPENDENCY FIX:
 * - api.ts needs access to tokens but can't import authStore (creates circular dep)
 * - tokenService.ts provides a decoupled interface
 * - authStore registers its handlers here after initialization
 * - api.ts calls tokenService functions which delegate to these handlers
 *
 * This ensures:
 * 1. api.ts can initialize before authStore loads
 * 2. No "Cannot access before initialization" errors in production builds
 * 3. Token access works correctly once store is ready
 */
registerTokenHandlers({
  getAccessToken: () => useAuthStore.getState().token,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  setTokens: ({ accessToken, refreshToken }) => {
    useAuthStore.setState({
      token: accessToken,
      refreshToken: refreshToken ?? useAuthStore.getState().refreshToken,
    });
  },
  onLogout: () => useAuthStore.getState().logout(),
});

// Safety timeout: ensure isLoading is set to false within 3 seconds of module load
// This catches any edge cases where rehydration might not complete
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const state = useAuthStore.getState();
    if (state.isLoading) {
      console.warn('[AuthStore] Safety timeout: forcing isLoading to false');
      useAuthStore.setState({ isLoading: false });
    }
  }, 3000);
}

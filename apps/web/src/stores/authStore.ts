import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { api } from '@/lib/api';
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
  userId: number;
  userIdDisplay: string;
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
}

// Map API user response to frontend User type
function mapUserFromApi(apiUser: Record<string, unknown>): User {
  return {
    id: apiUser.id as string,
    userId: (apiUser.user_id as number) || 0,
    userIdDisplay: (apiUser.user_id_display as string) || '#0000',
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
  };
}

interface WalletChallenge {
  message: string;
  nonce: string;
}

interface AuthState {
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
 * Secure storage wrapper for auth data
 * Uses sessionStorage for tokens (cleared on browser close) 
 * and base64 encoding for obfuscation (not encryption)
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
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/api/v1/auth/login', {
            email,
            password,
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
            error: getApiErrorMessage(error, 'Login failed'),
            isLoading: false,
          });
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
              password_confirmation: password,  // Backend requires confirmation
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
        // Clear state - no logout endpoint needed, just revoke token client-side
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
          set({ isLoading: false });
          return;
        }

        try {
          const response = await api.get('/api/v1/me');
          const userData = response.data.user || response.data;
          set({
            user: mapUserFromApi(userData),
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
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
    }
  )
);

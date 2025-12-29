import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  walletAddress: string | null;
  emailVerifiedAt: string | null;
  twoFactorEnabled: boolean;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  statusMessage: string | null;
  createdAt: string;
}

// Map API user response to frontend User type
function mapUserFromApi(apiUser: Record<string, unknown>): User {
  return {
    id: apiUser.id as string,
    email: apiUser.email as string,
    username: apiUser.username as string,
    displayName: (apiUser.display_name as string | null) || null,
    avatarUrl: (apiUser.avatar_url as string | null) || null,
    walletAddress: (apiUser.wallet_address as string | null) || null,
    emailVerifiedAt: (apiUser.email_verified_at as string | null) || null,
    twoFactorEnabled: (apiUser.totp_enabled as boolean) || false,
    status: (apiUser.status as 'online' | 'idle' | 'dnd' | 'offline') || 'offline',
    statusMessage: (apiUser.custom_status as string | null) || null,
    createdAt: apiUser.inserted_at as string,
  };
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
  loginWithWallet: (walletAddress: string, signature: string, message: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

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
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      loginWithWallet: async (walletAddress: string, signature: string, message: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/api/v1/auth/wallet', {
            wallet_address: walletAddress,
            signature,
            message,
          });
          const { user, tokens } = response.data;
          set({
            user: mapUserFromApi(user),
            token: tokens.access_token,
            refreshToken: tokens.refresh_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Wallet login failed',
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
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Registration failed',
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
          const { access_token, refresh_token: newRefreshToken } = response.data;
          set({
            token: access_token,
            refreshToken: newRefreshToken,
          });
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
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

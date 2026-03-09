/**
 * Mobile Auth Store — Zustand replacement for AuthContext.
 *
 * Manages authentication state: user, tokens, session lifecycle.
 * Persists tokens via expo-secure-store for security.
 * Connects/disconnects socket on auth state changes.
 *
 * @module stores/authStore
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { AppState, type AppStateStatus } from 'react-native';
import api from '../lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// Re-use the app's User type if available, else define a compatible shape
interface User {
  readonly id: string;
  readonly username: string;
  readonly displayName?: string;
  readonly display_name?: string;
  readonly email: string;
  readonly avatarUrl?: string | null;
  readonly avatar_url?: string | null;
  readonly bio?: string | null;
  readonly xp?: number;
  readonly level?: number;
  readonly coins?: number;
  readonly subscription_tier?: string;
  readonly is_active?: boolean;
  readonly streak_days?: number;
  readonly karma?: number;
  readonly equipped_title_id?: string | null;
  readonly avatar_border_id?: string | null;
  readonly status?: string;
  readonly inserted_at?: string;
  [key: string]: unknown; // Allow extra fields from API
}

interface AuthState {
  readonly user: User | null;
  readonly token: string | null;
  readonly isLoading: boolean;
  readonly isAuthenticated: boolean;
}

interface AuthActions {
  readonly initialize: () => Promise<void>;
  readonly login: (
    identifier: string,
    password: string
  ) => Promise<{ twoFactorRequired: true; twoFactorToken: string } | void>;
  readonly verifyLoginTwoFactor: (twoFactorToken: string, code: string) => Promise<void>;
  readonly register: (email: string, username: string | null, password: string) => Promise<void>;
  readonly logout: () => Promise<void>;
  readonly updateUser: (user: User) => void;
  readonly refreshUser: () => Promise<void>;
  readonly reset: () => void;
}

type AuthStore = AuthState & AuthActions;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEYS = {
  TOKEN: 'cgraph_auth_token',
  REFRESH_TOKEN: 'cgraph_refresh_token',
  USER: 'cgraph_user',
} as const;

const INITIAL_STATE: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
};

// ---------------------------------------------------------------------------
// Socket helpers (lazy import to avoid circular deps)
// ---------------------------------------------------------------------------

let socketManagerModule: {
  default: {
    connect: () => Promise<void>;
    disconnect: () => void;
    setAppState: (state: 'foreground' | 'background') => void;
  };
} | null = null;

async function getSocketManager() {
  if (!socketManagerModule) {
    try {
      socketManagerModule = await import('../lib/socket');
    } catch {
      socketManagerModule = {
        default: { connect: async () => {}, disconnect: () => {}, setAppState: () => {} },
      };
    }
  }
  return socketManagerModule?.default;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthStore>((set, _get) => ({
  ...INITIAL_STATE,

  initialize: async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEYS.TOKEN),
        SecureStore.getItemAsync(STORAGE_KEYS.USER),
      ]);

      if (!storedToken || !storedUser) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      // Parse stored user safely
      let parsedUser: User | null = null;
      try {
        parsedUser = JSON.parse(storedUser);
      } catch {
        await clearStorage();
        set({ ...INITIAL_STATE, isLoading: false });
        return;
      }

      // Set token for API calls
      api.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
      set({ user: parsedUser, token: storedToken, isAuthenticated: true });

      // Verify token is still valid
      try {
        const response = await api.get('/api/v1/me');
        const verifiedUser = response.data?.data || response.data?.user || response.data;

        set({ user: verifiedUser, isLoading: false });
        await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(verifiedUser));

        // Connect socket
        const socketManager = await getSocketManager();
        socketManager.connect().catch(() => {});
      } catch {
        // Token invalid — clear auth
        await clearStorage();
        delete api.defaults.headers.common.Authorization;
        set({ ...INITIAL_STATE, isLoading: false });
      }
    } catch {
      set({ ...INITIAL_STATE, isLoading: false });
    }
  },

  login: async (identifier: string, password: string) => {
    // NOTE: Do NOT set global isLoading here — LoginScreen has its own local
    // loading state. Setting global isLoading causes RootNavigator to unmount
    // AuthNavigator mid-flight, losing error feedback and causing a loading loop.
    const response = await api.post('/api/v1/auth/login', { identifier, password });
    const data = response.data?.data || response.data;

    // Handle 2FA-required response
    if (data?.status === '2fa_required' && data?.two_factor_token) {
      return {
        twoFactorRequired: true as const,
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        twoFactorToken: data.two_factor_token as string,
      };
    }

    const { user, tokens } = data;

    await saveAuth(tokens.access_token, tokens.refresh_token, user);

    set({
      user,
      token: tokens.access_token,
      isAuthenticated: true,
    });

    // Connect socket
    const socketManager = await getSocketManager();
    socketManager.connect().catch(() => {});
  },

  verifyLoginTwoFactor: async (twoFactorToken: string, code: string) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/api/v1/auth/login/2fa', {
        two_factor_token: twoFactorToken,
        code,
      });
      const data = response.data?.data || response.data;
      const { user, tokens } = data;

      await saveAuth(tokens.access_token, tokens.refresh_token, user);

      set({
        user,
        token: tokens.access_token,
        isLoading: false,
        isAuthenticated: true,
      });

      // Connect socket
      const socketManager = await getSocketManager();
      socketManager.connect().catch(() => {});
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (email: string, username: string | null, password: string) => {
    set({ isLoading: true });
    try {
      const userData: Record<string, string> = {
        email,
        password,
        password_confirmation: password,
      };
      if (username) {
        userData.username = username;
      }

      const response = await api.post('/api/v1/auth/register', { user: userData });
      const { user, tokens } = response.data?.data || response.data;

      await saveAuth(tokens.access_token, tokens.refresh_token, user);

      set({
        user,
        token: tokens.access_token,
        isLoading: false,
        isAuthenticated: true,
      });

      const socketManager = await getSocketManager();
      socketManager.connect().catch(() => {});
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } catch {
      // Ignore logout API errors
    }

    try {
      const socketManager = await getSocketManager();
      socketManager.disconnect();
    } catch {
      // Socket disconnect failure shouldn't block logout
    }

    await clearStorage();
    delete api.defaults.headers.common.Authorization;

    // SECURITY: Reset ALL stores to prevent data leakage between user sessions
    try {
      const { useChatStore } = await import('./chatStore');
      const { useFriendStore } = await import('./friendStore');
      const { useNotificationStore } = await import('./notificationStore');
      const { useGroupStore } = await import('./groupStore');
      // TODO(phase-26): gamificationStore and marketplaceStore deleted
      const { useCustomizationStore } = await import('./customizationStore');

      // Reset stores that have initial states
      useChatStore.setState(useChatStore.getInitialState?.() ?? {});
      useFriendStore.setState(useFriendStore.getInitialState?.() ?? {});
      useNotificationStore.setState(useNotificationStore.getInitialState?.() ?? {});
      useGroupStore.setState(useGroupStore.getInitialState?.() ?? {});
      useCustomizationStore.setState(useCustomizationStore.getInitialState?.() ?? {});
    } catch {
      // Store reset failure shouldn't block logout
    }

    set({ ...INITIAL_STATE, isLoading: false });
  },

  updateUser: (updatedUser: User) => {
    set({ user: updatedUser });
    SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(updatedUser)).catch(() => {});
  },

  refreshUser: async () => {
    try {
      const response = await api.get('/api/v1/me');
      const userData = response.data?.data || response.data?.user || response.data;
      set({ user: userData });
      await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(userData));
    } catch {
      // Silently fail — user data will be stale but functional
    }
  },

  reset: () => {
    set({ ...INITIAL_STATE, isLoading: false });
  },
}));

// ---------------------------------------------------------------------------
// AppState listener — manage socket foreground/background state
// ---------------------------------------------------------------------------

let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;

function setupAppStateListener() {
  if (appStateSubscription) return;

  let previousState = AppState.currentState;

  appStateSubscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
    const { isAuthenticated, token } = useAuthStore.getState();
    if (!isAuthenticated || !token) {
      previousState = nextState;
      return;
    }

    if (nextState === 'active' && previousState.match(/inactive|background/)) {
      getSocketManager()
        .then((sm) => sm.setAppState('foreground'))
        .catch(() => {});
    } else if (nextState.match(/inactive|background/) && previousState === 'active') {
      getSocketManager()
        .then((sm) => sm.setAppState('background'))
        .catch(() => {});
    }

    previousState = nextState;
  });
}

setupAppStateListener();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function saveAuth(token: string, refreshToken: string, user: User): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(STORAGE_KEYS.TOKEN, token),
    SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
    SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user)),
  ]);
  // Note: httpClient interceptor also reads token from SecureStore per-request.
  // This default header ensures the token is available immediately after login
  // without waiting for the next interceptor cycle.
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
}

async function clearStorage(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN),
    SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
    SecureStore.deleteItemAsync(STORAGE_KEYS.USER),
  ]).catch(() => {});
}

// ---------------------------------------------------------------------------
// Selectors (fine-grained to prevent unnecessary re-renders)
// ---------------------------------------------------------------------------

/** Select only the user object — re-renders only when user changes. */
export const useAuthUser = () => useAuthStore((s) => s.user);

/** Select only authentication status. */
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);

/** Select only loading state. */
export const useAuthLoading = () => useAuthStore((s) => s.isLoading);

/** Select auth token for API calls. */
export const useAuthToken = () => useAuthStore((s) => s.token);

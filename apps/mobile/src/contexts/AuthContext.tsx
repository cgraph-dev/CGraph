import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from '../lib/api';
import socketManager from '../lib/socket';
import { User } from '../types';
import { createLogger } from '../lib/logger';

const logger = createLogger('Auth');

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string | null, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'cgraph_auth_token';
const REFRESH_TOKEN_KEY = 'cgraph_refresh_token';
const USER_KEY = 'cgraph_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Track app state changes and update presence
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (token) {
        if (nextAppState === 'active' && appState.current.match(/inactive|background/)) {
          // App came to foreground
          socketManager.setAppState('foreground');
        } else if (nextAppState.match(/inactive|background/) && appState.current === 'active') {
          // App went to background
          socketManager.setAppState('background');
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [token]);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      const storedUser = await SecureStore.getItemAsync(USER_KEY);

      if (storedToken && storedUser) {
        // Safely parse user data with error handling
        let parsedUser: User | null = null;
        try {
          parsedUser = JSON.parse(storedUser);
        } catch (parseError) {
          // Corrupted user data, clear auth
          logger.error('Corrupted user data in storage, clearing auth');
          await clearAuth();
          return;
        }

        setToken(storedToken);
        setUser(parsedUser);
        api.defaults.headers.common.Authorization = `Bearer ${storedToken}`;

        // Verify token is still valid
        try {
          const response = await api.get('/api/v1/me');
          // API returns {data: {id, username, ...}} - the user object is in data
          const verifiedUser = response.data.data || response.data.user || response.data;

          // Debug: log what we received
          if (__DEV__) {
            logger.log('/me response:', JSON.stringify(response.data, null, 2));
            logger.log('Verified user:', JSON.stringify(verifiedUser, null, 2));
            logger.log('User ID:', verifiedUser?.id);
          }

          setUser(verifiedUser);

          // Connect socket after verifying auth
          socketManager.connect().catch((err) => {
            if (__DEV__) logger.error('Socket connection failed:', err);
          });
        } catch {
          // Token invalid, clear auth
          await clearAuth();
        }
      }
    } catch (error) {
      // Only log in development to avoid leaking info in production
      if (__DEV__) {
        logger.error('Error loading auth:', error);
      }
      await clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const saveAuth = async (authToken: string, refreshToken: string, userData: User) => {
    await SecureStore.setItemAsync(TOKEN_KEY, authToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));

    setToken(authToken);
    setUser(userData);
    api.defaults.headers.common.Authorization = `Bearer ${authToken}`;

    // Connect socket after saving token
    socketManager.connect().catch((err) => {
      if (__DEV__) logger.error('Socket connection failed:', err);
    });
  };

  const clearAuth = async () => {
    // Disconnect socket before clearing auth
    socketManager.disconnect();

    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);

    setToken(null);
    setUser(null);
    delete api.defaults.headers.common.Authorization;
  };

  const login = async (identifier: string, password: string) => {
    const response = await api.post('/api/v1/auth/login', { identifier, password });
    const { user: userData, tokens } = response.data.data || response.data;
    await saveAuth(tokens.access_token, tokens.refresh_token, userData);
  };

  const register = async (email: string, username: string | null, password: string) => {
    const userData: Record<string, string> = {
      email,
      password,
      password_confirmation: password, // Backend requires confirmation
    };
    if (username) {
      userData.username = username;
    }
    const response = await api.post('/api/v1/auth/register', { user: userData });
    const { user: responseUser, tokens } = response.data.data || response.data;
    await saveAuth(tokens.access_token, tokens.refresh_token, responseUser);
  };

  const logout = async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } catch {
      // Ignore logout errors
    }
    await clearAuth();
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/api/v1/me');
      const userData = response.data.data || response.data.user || response.data;
      setUser(userData);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
    } catch (error) {
      if (__DEV__) {
        logger.error('Failed to refresh user:', error);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

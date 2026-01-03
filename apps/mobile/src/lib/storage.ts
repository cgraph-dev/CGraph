/**
 * Storage abstraction layer for React Native
 * 
 * Provides a unified interface for secure storage operations
 * Uses expo-secure-store for sensitive data and AsyncStorage for general data
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for stored data
const KEYS = {
  AUTH_TOKEN: 'cgraph_auth_token',
  REFRESH_TOKEN: 'cgraph_refresh_token',
  USER_DATA: 'cgraph_user_data',
  OAUTH_STATE: 'cgraph_oauth_state',
  DEVICE_ID: 'cgraph_device_id',
  THEME: 'cgraph_theme',
  NOTIFICATIONS_ENABLED: 'cgraph_notifications_enabled',
  LAST_SYNC: 'cgraph_last_sync',
} as const;

type StorageKey = typeof KEYS[keyof typeof KEYS];

/**
 * Secure storage for sensitive data (tokens, etc.)
 * Data is encrypted and stored in the device's secure enclave/keychain
 */
const secureStorage = {
  async getItem(key: StorageKey): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Failed to get secure item ${key}:`, error);
      return null;
    }
  },

  async setItem(key: StorageKey, value: string): Promise<boolean> {
    try {
      await SecureStore.setItemAsync(key, value);
      return true;
    } catch (error) {
      console.error(`Failed to set secure item ${key}:`, error);
      return false;
    }
  },

  async removeItem(key: StorageKey): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove secure item ${key}:`, error);
      return false;
    }
  },
};

/**
 * General storage for non-sensitive data
 * Uses AsyncStorage for faster access and larger data
 */
const generalStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`Failed to get item ${key}:`, error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Failed to set item ${key}:`, error);
      return false;
    }
  },

  async removeItem(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error);
      return false;
    }
  },

  async getObject<T>(key: string): Promise<T | null> {
    const value = await this.getItem(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },

  async setObject<T>(key: string, value: T): Promise<boolean> {
    try {
      return await this.setItem(key, JSON.stringify(value));
    } catch {
      return false;
    }
  },
};

/**
 * Unified storage interface
 * Automatically routes to secure or general storage based on key type
 */
export const storage = {
  KEYS,

  // Authentication tokens (secure storage)
  async getAuthToken(): Promise<string | null> {
    return secureStorage.getItem(KEYS.AUTH_TOKEN);
  },

  async setAuthToken(token: string): Promise<boolean> {
    return secureStorage.setItem(KEYS.AUTH_TOKEN, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return secureStorage.getItem(KEYS.REFRESH_TOKEN);
  },

  async setRefreshToken(token: string): Promise<boolean> {
    return secureStorage.setItem(KEYS.REFRESH_TOKEN, token);
  },

  async clearAuthTokens(): Promise<void> {
    await secureStorage.removeItem(KEYS.AUTH_TOKEN);
    await secureStorage.removeItem(KEYS.REFRESH_TOKEN);
  },

  // OAuth state (secure storage for CSRF protection)
  async getOAuthState(): Promise<string | null> {
    return secureStorage.getItem(KEYS.OAUTH_STATE);
  },

  async setOAuthState(state: string): Promise<boolean> {
    return secureStorage.setItem(KEYS.OAUTH_STATE, state);
  },

  async clearOAuthState(): Promise<boolean> {
    return secureStorage.removeItem(KEYS.OAUTH_STATE);
  },

  // User data (general storage for faster access)
  async getUserData<T>(): Promise<T | null> {
    return generalStorage.getObject<T>(KEYS.USER_DATA);
  },

  async setUserData<T>(data: T): Promise<boolean> {
    return generalStorage.setObject(KEYS.USER_DATA, data);
  },

  async clearUserData(): Promise<boolean> {
    return generalStorage.removeItem(KEYS.USER_DATA);
  },

  // Theme preference
  async getTheme(): Promise<'light' | 'dark' | 'system' | null> {
    const theme = await generalStorage.getItem(KEYS.THEME);
    return theme as 'light' | 'dark' | 'system' | null;
  },

  async setTheme(theme: 'light' | 'dark' | 'system'): Promise<boolean> {
    return generalStorage.setItem(KEYS.THEME, theme);
  },

  // Clear all stored data (for logout)
  async clearAll(): Promise<void> {
    await this.clearAuthTokens();
    await this.clearUserData();
    await this.clearOAuthState();
    await generalStorage.removeItem(KEYS.NOTIFICATIONS_ENABLED);
    await generalStorage.removeItem(KEYS.LAST_SYNC);
  },

  // Direct access to underlying storage
  secure: secureStorage,
  general: generalStorage,
};

export default storage;

/**
 * Tests for storage — secure and general storage abstraction layer.
 *
 * @module lib/__tests__/storage.test
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from '../storage';

// Logger is imported by storage — mock it
jest.mock('../logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

// ── secureStorage ────────────────────────────────────────────────────

describe('secureStorage (via storage.secure)', () => {
  it('getItem returns value from SecureStore', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('my-token');
    const result = await storage.secure.getItem('cgraph_auth_token');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('cgraph_auth_token');
    expect(result).toBe('my-token');
  });

  it('getItem returns null when SecureStore returns null', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    const result = await storage.secure.getItem('cgraph_auth_token');
    expect(result).toBeNull();
  });

  it('getItem returns null on error', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(new Error('Keychain error'));
    const result = await storage.secure.getItem('cgraph_auth_token');
    expect(result).toBeNull();
  });

  it('setItem stores value in SecureStore', async () => {
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    const result = await storage.secure.setItem('cgraph_auth_token', 'new-token');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('cgraph_auth_token', 'new-token');
    expect(result).toBe(true);
  });

  it('setItem returns false on error', async () => {
    (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(new Error('Write failed'));
    const result = await storage.secure.setItem('cgraph_auth_token', 'value');
    expect(result).toBe(false);
  });

  it('removeItem deletes from SecureStore', async () => {
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
    const result = await storage.secure.removeItem('cgraph_auth_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('cgraph_auth_token');
    expect(result).toBe(true);
  });

  it('removeItem returns false on error', async () => {
    (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValue(new Error('Delete failed'));
    const result = await storage.secure.removeItem('cgraph_auth_token');
    expect(result).toBe(false);
  });
});

// ── generalStorage ───────────────────────────────────────────────────

describe('generalStorage (via storage.general)', () => {
  it('getItem returns value from AsyncStorage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('some-value');
    const result = await storage.general.getItem('cgraph_theme');
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('cgraph_theme');
    expect(result).toBe('some-value');
  });

  it('getItem returns null when AsyncStorage returns null', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const result = await storage.general.getItem('cgraph_theme');
    expect(result).toBeNull();
  });

  it('getItem returns null on error', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Read failed'));
    const result = await storage.general.getItem('cgraph_theme');
    expect(result).toBeNull();
  });

  it('setItem stores value in AsyncStorage', async () => {
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    const result = await storage.general.setItem('cgraph_theme', 'dark');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('cgraph_theme', 'dark');
    expect(result).toBe(true);
  });

  it('setItem returns false on error', async () => {
    (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Write failed'));
    const result = await storage.general.setItem('cgraph_theme', 'dark');
    expect(result).toBe(false);
  });

  it('removeItem deletes from AsyncStorage', async () => {
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    const result = await storage.general.removeItem('cgraph_theme');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('cgraph_theme');
    expect(result).toBe(true);
  });

  it('removeItem returns false on error', async () => {
    (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(new Error('Delete failed'));
    const result = await storage.general.removeItem('cgraph_theme');
    expect(result).toBe(false);
  });

  it('getObject parses JSON value', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('{"name":"alice","id":1}');
    const result = await storage.general.getObject('cgraph_user_data');
    expect(result).toEqual({ name: 'alice', id: 1 });
  });

  it('getObject returns null when value is null', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const result = await storage.general.getObject('cgraph_user_data');
    expect(result).toBeNull();
  });

  it('getObject returns null for invalid JSON', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('not-json');
    const result = await storage.general.getObject('cgraph_user_data');
    expect(result).toBeNull();
  });

  it('setObject serializes and stores JSON', async () => {
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    const data = { name: 'bob', score: 42 };
    const result = await storage.general.setObject('cgraph_user_data', data);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('cgraph_user_data', JSON.stringify(data));
    expect(result).toBe(true);
  });

  it('setObject returns false on error', async () => {
    (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage full'));
    const result = await storage.general.setObject('cgraph_user_data', { data: true });
    expect(result).toBe(false);
  });
});

// ── unified storage interface ────────────────────────────────────────

describe('storage — unified interface', () => {
  it('getAuthToken reads from secure storage', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('token-123');
    const result = await storage.getAuthToken();
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('cgraph_auth_token');
    expect(result).toBe('token-123');
  });

  it('setAuthToken writes to secure storage', async () => {
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    const result = await storage.setAuthToken('new-token');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('cgraph_auth_token', 'new-token');
    expect(result).toBe(true);
  });

  it('getRefreshToken reads from secure storage', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('refresh-abc');
    const result = await storage.getRefreshToken();
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('cgraph_refresh_token');
    expect(result).toBe('refresh-abc');
  });

  it('setRefreshToken writes to secure storage', async () => {
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    const result = await storage.setRefreshToken('refresh-new');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('cgraph_refresh_token', 'refresh-new');
    expect(result).toBe(true);
  });

  it('clearAuthTokens removes both tokens from secure storage', async () => {
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
    await storage.clearAuthTokens();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('cgraph_auth_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('cgraph_refresh_token');
  });

  it('getOAuthState reads from secure storage', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('state-xyz');
    const result = await storage.getOAuthState();
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('cgraph_oauth_state');
    expect(result).toBe('state-xyz');
  });

  it('setOAuthState writes to secure storage', async () => {
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    const result = await storage.setOAuthState('state-new');
    expect(result).toBe(true);
  });

  it('clearOAuthState removes from secure storage', async () => {
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
    const result = await storage.clearOAuthState();
    expect(result).toBe(true);
  });

  it('getUserData reads and parses from general storage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('{"id":"u1","name":"Test"}');
    const result = await storage.getUserData();
    expect(result).toEqual({ id: 'u1', name: 'Test' });
  });

  it('setUserData serializes to general storage', async () => {
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    const data = { id: 'u1', name: 'Test' };
    const result = await storage.setUserData(data);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('cgraph_user_data', JSON.stringify(data));
    expect(result).toBe(true);
  });

  it('clearUserData removes from general storage', async () => {
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    const result = await storage.clearUserData();
    expect(result).toBe(true);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('cgraph_user_data');
  });

  it('getTheme reads from general storage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('dark');
    const result = await storage.getTheme();
    expect(result).toBe('dark');
  });

  it('setTheme writes to general storage', async () => {
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    const result = await storage.setTheme('light');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('cgraph_theme', 'light');
    expect(result).toBe(true);
  });

  it('clearAll removes auth tokens, user data, oauth, notifications, last sync', async () => {
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

    await storage.clearAll();

    // Secure storage removals
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('cgraph_auth_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('cgraph_refresh_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('cgraph_oauth_state');

    // General storage removals
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('cgraph_user_data');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('cgraph_notifications_enabled');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('cgraph_last_sync');
  });

  it('KEYS contains expected storage key constants', () => {
    expect(storage.KEYS.AUTH_TOKEN).toBe('cgraph_auth_token');
    expect(storage.KEYS.REFRESH_TOKEN).toBe('cgraph_refresh_token');
    expect(storage.KEYS.USER_DATA).toBe('cgraph_user_data');
    expect(storage.KEYS.OAUTH_STATE).toBe('cgraph_oauth_state');
    expect(storage.KEYS.DEVICE_ID).toBe('cgraph_device_id');
    expect(storage.KEYS.THEME).toBe('cgraph_theme');
    expect(storage.KEYS.NOTIFICATIONS_ENABLED).toBe('cgraph_notifications_enabled');
    expect(storage.KEYS.LAST_SYNC).toBe('cgraph_last_sync');
  });
});

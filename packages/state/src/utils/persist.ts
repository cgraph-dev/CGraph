/**
 * Persistence Utilities
 * 
 * Cross-platform persistence for Zustand stores.
 */

export interface PersistOptions<T> {
  name: string;
  getStorage: () => PersistStorage;
  partialize?: (state: T) => Partial<T>;
  version?: number;
  migrate?: (persistedState: unknown, version: number) => T;
  onRehydrateStorage?: (state: T) => ((state?: T, error?: unknown) => void) | void;
}

export interface PersistStorage {
  getItem: (name: string) => Promise<string | null>;
  setItem: (name: string, value: string) => Promise<void>;
  removeItem: (name: string) => Promise<void>;
}

/**
 * Create a localStorage adapter (web)
 */
export function createLocalStorageAdapter(): PersistStorage {
  return {
    getItem: async (name) => {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem(name);
    },
    setItem: async (name, value) => {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(name, value);
    },
    removeItem: async (name) => {
      if (typeof window === 'undefined') return;
      window.localStorage.removeItem(name);
    },
  };
}

// Type for async storage module
interface AsyncStorageModule {
  default: {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
  };
}

/**
 * Create an AsyncStorage adapter (React Native)
 * Note: Requires @react-native-async-storage/async-storage
 */
export function createAsyncStorageAdapter(): PersistStorage {
  // Dynamic import to avoid bundling issues
  return {
    getItem: async (name) => {
      const AsyncStorage = await import('@react-native-async-storage/async-storage' as string) as AsyncStorageModule;
      return AsyncStorage.default.getItem(name);
    },
    setItem: async (name, value) => {
      const AsyncStorage = await import('@react-native-async-storage/async-storage' as string) as AsyncStorageModule;
      await AsyncStorage.default.setItem(name, value);
    },
    removeItem: async (name) => {
      const AsyncStorage = await import('@react-native-async-storage/async-storage' as string) as AsyncStorageModule;
      await AsyncStorage.default.removeItem(name);
    },
  };
}

// Type for secure store module
interface SecureStoreModule {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
}

/**
 * Create a SecureStore adapter for sensitive data (React Native)
 * Note: Requires expo-secure-store
 */
export function createSecureStorageAdapter(): PersistStorage {
  return {
    getItem: async (name) => {
      const SecureStore = await import('expo-secure-store' as string) as SecureStoreModule;
      return SecureStore.getItemAsync(name);
    },
    setItem: async (name, value) => {
      const SecureStore = await import('expo-secure-store' as string) as SecureStoreModule;
      await SecureStore.setItemAsync(name, value);
    },
    removeItem: async (name) => {
      const SecureStore = await import('expo-secure-store' as string) as SecureStoreModule;
      await SecureStore.deleteItemAsync(name);
    },
  };
}

/**
 * Create an in-memory adapter (for testing)
 */
export function createMemoryStorageAdapter(): PersistStorage {
  const storage = new Map<string, string>();
  return {
    getItem: async (name) => storage.get(name) ?? null,
    setItem: async (name, value) => { storage.set(name, value); },
    removeItem: async (name) => { storage.delete(name); },
  };
}

/**
 * Serialize state to JSON with error handling
 */
export function serialize<T>(state: T): string {
  try {
    return JSON.stringify(state);
  } catch (error) {
    console.error('Failed to serialize state:', error);
    return '{}';
  }
}

/**
 * Deserialize JSON to state with error handling
 */
export function deserialize<T>(str: string): T | null {
  try {
    return JSON.parse(str) as T;
  } catch (error) {
    console.error('Failed to deserialize state:', error);
    return null;
  }
}

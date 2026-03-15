/**
 * React hook for persistent state management using AsyncStorage.
 * @module hooks/useAsyncStorage
 */
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Hook that syncs state with AsyncStorage (React Native equivalent of localStorage).
 *
 * Handles serialization/deserialization automatically.
 *
 * @param key - AsyncStorage key
 * @param initialValue - default value if key doesn't exist
 * @returns tuple of [value, setValue, removeValue]
 *
 * @example
 * const [theme, setTheme] = useAsyncStorage('theme', 'light');
 * const [settings, setSettings, clearSettings] = useAsyncStorage('settings', {});
 */
export function useAsyncStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => Promise<void>, () => Promise<void>, boolean] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  // Load from AsyncStorage on mount
  useEffect(() => {
    const loadStoredValue = async () => {
      try {
        const item = await AsyncStorage.getItem(key);
        if (item !== null) {
           
          setStoredValue(JSON.parse(item) as T);
        }
      } catch (error) {
        console.warn(`Error reading AsyncStorage key "${key}":`, error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredValue();
  }, [key]);

  // Update AsyncStorage when state changes
  const setValue = useCallback(
    async (value: T | ((prev: T) => T)) => {
      try {
        // Handle function updates
        const valueToStore = value instanceof Function ? value(storedValue) : value;

        // Save to state
        setStoredValue(valueToStore);

        // Save to AsyncStorage
        await AsyncStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.warn(`Error setting AsyncStorage key "${key}":`, error);
        throw error;
      }
    },
    [key, storedValue]
  );

  // Remove from AsyncStorage
  const removeValue = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing AsyncStorage key "${key}":`, error);
      throw error;
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue, isLoading];
}

/**
 * Hook for storing secure data (use SecureStore for sensitive data like tokens).
 * This is a convenience alias for useAsyncStorage.
 */
export const useLocalStorage = useAsyncStorage;

export default useAsyncStorage;

/**
 * Settings store implementation.
 * @module
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createLogger } from '@/lib/logger';

// Re-export all types and constants from the types file
export * from './settingsStore.types';

import type { SettingsState } from './settingsStore.types';
import { DEFAULT_SETTINGS } from './settingsStore.types';
import { createSettingsActions } from './settings-actions';

const logger = createLogger('SettingsStore');

/**
 * Settings Store - Manages user settings with backend sync
 *
 * Features:
 * - Automatic sync with backend on changes
 * - Optimistic updates with rollback on failure
 * - Local caching for offline support
 * - Type-safe settings with defaults
 *
 * @version 0.7.46
 */

// ============================================================================
// Store Implementation
// ============================================================================

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      isLoading: false,
      isSaving: false,
      error: null,
      lastSyncedAt: null,

      ...createSettingsActions(set, get),

      reset: () =>
        set({
          settings: DEFAULT_SETTINGS,
          isLoading: false,
          isSaving: false,
          error: null,
          lastSyncedAt: null,
        }),
    }),
    {
      name: 'cgraph-settings',
      storage: createJSONStorage(() => {
        // Safe localStorage wrapper
        return {
          getItem: (name: string): string | null => {
            try {
              return localStorage.getItem(name);
            } catch (error) {
              logger.warn('Failed to read from localStorage:', error);
              return null;
            }
          },
          setItem: (name: string, value: string): void => {
            try {
              localStorage.setItem(name, value);
            } catch (error) {
              logger.warn('Failed to write to localStorage:', error);
            }
          },
          removeItem: (name: string): void => {
            try {
              localStorage.removeItem(name);
            } catch (error) {
              logger.warn('Failed to remove from localStorage:', error);
            }
          },
        };
      }),
      partialize: (state) => ({
        settings: state.settings,
        lastSyncedAt: state.lastSyncedAt,
      }),
    }
  )
);

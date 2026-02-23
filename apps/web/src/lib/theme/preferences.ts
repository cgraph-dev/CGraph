/**
 * Theme Preferences — Persistence & Cross-Tab Sync
 *
 * Handles loading / saving ThemePreferences from localStorage
 * and synchronising theme changes across browser tabs via BroadcastChannel.
 *
 * @module lib/theme/preferences
 * @version 4.0.0
 * @since v0.7.36
 */

import { createLogger } from '@/lib/logger';
import type { Theme, ThemePreferences } from './types';

const logger = createLogger('ThemePreferences');

// =============================================================================
// CONSTANTS
// =============================================================================

export const STORAGE_KEY = 'cgraph-theme-preferences';
export const BROADCAST_CHANNEL = 'cgraph-theme-sync';

// =============================================================================
// DEFAULT PREFERENCES
// =============================================================================

/**
 * Return a fresh default ThemePreferences object.
 */
export function getDefaultPreferences(): ThemePreferences {
  return {
    activeThemeId: 'dark',
    customThemes: [],
    settings: {
      syncAcrossDevices: false,
      respectSystemPreference: false,
      messageDisplay: 'cozy',
      fontScale: 1,
      messageSpacing: 1,
      reduceMotion: false,
      highContrast: false,
      backgroundEffect: 'none',
      shaderVariant: 'matrix',
      backgroundIntensity: 0.6,
    },
  };
}

// =============================================================================
// LOAD / SAVE
// =============================================================================

/**
 * Load user preferences from localStorage, falling back to defaults.
 */
export function loadPreferences(): ThemePreferences {
  if (typeof window === 'undefined') {
    return getDefaultPreferences();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ThemePreferences; // safe downcast – structural boundary
      return { ...getDefaultPreferences(), ...parsed };
    }
  } catch (error) {
    logger.error('Failed to load preferences:', error);
  }

  return getDefaultPreferences();
}

/**
 * Persist preferences to localStorage.
 */
export function savePreferences(preferences: ThemePreferences): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    logger.error('Failed to save preferences:', error);
  }
}

// =============================================================================
// BROADCAST CHANNEL
// =============================================================================

/**
 * Create a BroadcastChannel for cross-tab theme synchronisation.
 *
 * @param onThemeChange Callback invoked when another tab changes the theme.
 * @returns The channel instance (or `null` if unavailable).
 */
export function initBroadcastChannel(
  onThemeChange: (theme: Theme) => void
): BroadcastChannel | null {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return null;

  try {
    const channel = new BroadcastChannel(BROADCAST_CHANNEL);
    channel.onmessage = (event) => {
      if (event.data.type === 'theme-change') {
        onThemeChange(event.data.theme);
      }
    };
    return channel;
  } catch (error) {
    logger.error('Failed to initialize broadcast channel:', error);
    return null;
  }
}

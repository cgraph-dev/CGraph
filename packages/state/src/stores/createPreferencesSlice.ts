/**
 * Preferences Store Slice
 * 
 * Manages user preferences and settings.
 */

import type { PreferencesState, SliceCreator } from '../types';

export interface PreferencesActions {
  setTheme: (theme: PreferencesState['theme']) => void;
  setLanguage: (language: string) => void;
  updateNotifications: (settings: Partial<PreferencesState['notifications']>) => void;
  updatePrivacy: (settings: Partial<PreferencesState['privacy']>) => void;
  updateAccessibility: (settings: Partial<PreferencesState['accessibility']>) => void;
  reset: () => void;
}

const initialPreferencesState: PreferencesState = {
  theme: 'system',
  language: 'en',
  notifications: {
    push: true,
    email: true,
    sounds: true,
    vibration: true,
  },
  privacy: {
    showOnlineStatus: true,
    showReadReceipts: true,
    showTypingIndicator: true,
  },
  accessibility: {
    reduceMotion: false,
    highContrast: false,
    fontSize: 'medium',
  },
};

export const createPreferencesSlice: SliceCreator<PreferencesState, PreferencesActions> = (set, get) => ({
  ...initialPreferencesState,

  setTheme: (theme) => set({ theme }),

  setLanguage: (language) => set({ language }),

  updateNotifications: (settings) =>
    set({
      notifications: {
        ...get().notifications,
        ...settings,
      },
    }),

  updatePrivacy: (settings) =>
    set({
      privacy: {
        ...get().privacy,
        ...settings,
      },
    }),

  updateAccessibility: (settings) =>
    set({
      accessibility: {
        ...get().accessibility,
        ...settings,
      },
    }),

  reset: () => set(initialPreferencesState),
});

export const preferencesSelectors = {
  theme: (state: PreferencesState) => state.theme,
  language: (state: PreferencesState) => state.language,
  notifications: (state: PreferencesState) => state.notifications,
  privacy: (state: PreferencesState) => state.privacy,
  accessibility: (state: PreferencesState) => state.accessibility,
  reduceMotion: (state: PreferencesState) => state.accessibility.reduceMotion,
  fontSize: (state: PreferencesState) => state.accessibility.fontSize,
};

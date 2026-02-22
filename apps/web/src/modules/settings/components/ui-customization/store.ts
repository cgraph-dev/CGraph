/**
 * UI Preferences Store
 * @module modules/settings/components/ui-customization
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeLocalStorage } from '@/lib/safeStorage';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { createLogger } from '@/lib/logger';
import { UIPreferences, defaultPreferences } from './types';

const logger = createLogger('UIPreferencesStore');

// Apply preferences to DOM
export function applyPreferencesToDOM(prefs: UIPreferences) {
  const root = document.documentElement;

  // Colors
  root.style.setProperty('--color-primary', prefs.primaryColor);
  root.style.setProperty('--color-secondary', prefs.secondaryColor);
  root.style.setProperty('--color-accent', prefs.accentColor);

  // Glass effect
  root.style.setProperty('--glass-blur', `${prefs.glassBlur}px`);
  root.style.setProperty('--glass-opacity', `${prefs.glassOpacity}%`);
  root.style.setProperty('--glass-border-width', `${prefs.glassBorderWidth}px`);
  root.style.setProperty('--glow-intensity', `${prefs.glowIntensity}%`);

  // Animation speed
  const speeds = { instant: '0s', fast: '0.15s', normal: '0.3s', slow: '0.6s', 'very-slow': '1s' };
  root.style.setProperty('--animation-speed', speeds[prefs.animationSpeed]);

  // Spacing
  const spacingValues = {
    compact: '0.5rem',
    normal: '1rem',
    comfortable: '1.5rem',
    spacious: '2rem',
  };
  root.style.setProperty('--spacing-unit', spacingValues[prefs.spacing]);

  // Border radius
  root.style.setProperty('--border-radius', `${prefs.borderRadius}px`);

  // Font size
  const fontSizes = { small: '14px', medium: '16px', large: '18px', xlarge: '20px' };
  root.style.setProperty('--font-size-base', fontSizes[prefs.fontSize]);

  // Reduced motion
  if (prefs.reducedMotion) {
    root.style.setProperty('--animation-speed', '0.01s');
  }
}

export interface UIPreferencesStore {
  preferences: UIPreferences;
  updatePreference: <K extends keyof UIPreferences>(key: K, value: UIPreferences[K]) => void;
  resetToDefaults: () => void;
  exportPreferences: () => string;
  importPreferences: (json: string) => void;
  reset: () => void;
}

export const useUIPreferences = create<UIPreferencesStore>()(
  persist(
    (set, get) => ({
      preferences: defaultPreferences,

      updatePreference: (key, value) => {
        set((state) => ({
          preferences: { ...state.preferences, [key]: value },
        }));

        // Apply changes to document
        applyPreferencesToDOM(get().preferences);
      },

      resetToDefaults: () => {
        set({ preferences: defaultPreferences });
        applyPreferencesToDOM(defaultPreferences);
        HapticFeedback.medium();
      },

      exportPreferences: () => {
        return JSON.stringify(get().preferences, null, 2);
      },

      importPreferences: (json) => {
        try {
          const imported = JSON.parse(json);
          set({ preferences: { ...defaultPreferences, ...imported } });
          applyPreferencesToDOM(get().preferences);
          HapticFeedback.success();
        } catch (error) {
          logger.error('Failed to import preferences:', error);
          HapticFeedback.error();
        }
      },
  reset: () => set({
    preferences: defaultPreferences,
  }),
}),
    {
      name: 'cgraph-ui-preferences',
      storage: createJSONStorage(() => safeLocalStorage),
    }
  )
);

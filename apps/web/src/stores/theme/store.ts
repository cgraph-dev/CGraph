/**
 * Theme Store - Store Instance
 *
 * Separated from themeStore.ts to break a circular dependency:
 *   themeStore.ts re-exports from selectors.ts,
 *   selectors.ts imports useThemeStore from themeStore.ts → TDZ crash.
 *
 * This file creates the Zustand store instance with no imports from
 * selectors.ts, so both selectors.ts and themeStore.ts can safely import it.
 *
 * @version 2.1.1
 * @since v0.9.7
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeLocalStorage } from '@/lib/safeStorage';

import type { ThemeStore } from './types';
import { createThemeActions } from './actions';

// =============================================================================
// STORE CREATION
// =============================================================================

export const useThemeStore = create<ThemeStore>()(
  persist(createThemeActions, {
    name: 'cgraph-theme',
    storage: createJSONStorage(() => safeLocalStorage),
    partialize: (state) => ({
      colorPreset: state.colorPreset,
      profileThemeId: state.profileThemeId,
      profileCardLayout: state.profileCardLayout,
      chatBubble: state.chatBubble,
      effectPreset: state.effectPreset,
      animationSpeed: state.animationSpeed,
      particlesEnabled: state.particlesEnabled,
      glowEnabled: state.glowEnabled,
      animatedBackground: state.animatedBackground,
    }),
  })
);

export default useThemeStore;

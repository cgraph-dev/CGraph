/**
 * Customization Store - Zustand store for UI customization state
 *
 * Manages:
 * - Current theme configuration
 * - Undo/redo history
 * - Live preview state
 * - Persistence
 *
 * @version 1.0.0
 * @since v0.10.0
 */

import { create } from 'zustand';
import {
  ThemeConfig,
  ThemeHistory,
  CustomizationEngine,
  DEFAULT_THEME,
} from '@/lib/customization/customization-engine';

// ============================================================================
// STATE INTERFACE
// ============================================================================

interface CustomizationState {
  // Current theme
  theme: ThemeConfig;

  // History for undo/redo
  history: ThemeHistory;

  // UI state
  isPreviewMode: boolean;
  previewTheme: ThemeConfig | null;
  isDirty: boolean; // Has unsaved changes
  isLoading: boolean;
  error: string | null;

  // Actions
  setTheme: (theme: ThemeConfig) => void;
  updateTheme: (partial: Partial<ThemeConfig>) => void;
  resetTheme: () => void;

  // History actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Preview actions
  enterPreviewMode: (theme: ThemeConfig) => void;
  exitPreviewMode: () => void;
  applyPreview: () => void;

  // Persistence actions
  saveTheme: () => Promise<void>;
  loadTheme: () => Promise<void>;

  // Import/Export actions
  exportTheme: () => string;
  importTheme: (json: string) => void;

  // Utility actions
  validateTheme: () => { valid: boolean; errors: string[] };
  isAccessible: () => { accessible: boolean; warnings: string[] };
  optimizeForDevice: (deviceTier: 'high' | 'mid' | 'low') => void;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useCustomizationStore = create<CustomizationState>((set, get) => ({
  // Initial state
  theme: DEFAULT_THEME,
  history: {
    past: [],
    present: DEFAULT_THEME,
    future: [],
  },
  isPreviewMode: false,
  previewTheme: null,
  isDirty: false,
  isLoading: false,
  error: null,

  // Set entire theme (replaces current theme)
  setTheme: (theme: ThemeConfig) => {
    const currentHistory = get().history;

    set({
      theme,
      history: {
        past: [...currentHistory.past, currentHistory.present].slice(-50), // Keep last 50
        present: theme,
        future: [], // Clear redo stack when new change is made
      },
      isDirty: true,
      error: null,
    });
  },

  // Update partial theme (merges with current)
  updateTheme: (partial: Partial<ThemeConfig>) => {
    const currentTheme = get().theme;
    const updatedTheme = CustomizationEngine.mergeTheme({
      ...currentTheme,
      ...partial,
    });

    get().setTheme(updatedTheme);
  },

  // Reset to default theme
  resetTheme: () => {
    get().setTheme(DEFAULT_THEME);
  },

  // Undo last change
  undo: () => {
    const currentHistory = get().history;

    if (currentHistory.past.length === 0) return;

    const previous = currentHistory.past[currentHistory.past.length - 1];
    const newPast = currentHistory.past.slice(0, -1);

    set({
      theme: previous,
      history: {
        past: newPast,
        present: previous,
        future: [currentHistory.present, ...currentHistory.future],
      },
      isDirty: true,
    });
  },

  // Redo previously undone change
  redo: () => {
    const currentHistory = get().history;

    if (currentHistory.future.length === 0) return;

    const next = currentHistory.future[0];
    const newFuture = currentHistory.future.slice(1);

    set({
      theme: next,
      history: {
        past: [...currentHistory.past, currentHistory.present],
        present: next,
        future: newFuture,
      },
      isDirty: true,
    });
  },

  // Check if undo is available
  canUndo: () => {
    return get().history.past.length > 0;
  },

  // Check if redo is available
  canRedo: () => {
    return get().history.future.length > 0;
  },

  // Enter preview mode with a theme
  enterPreviewMode: (theme: ThemeConfig) => {
    set({
      isPreviewMode: true,
      previewTheme: theme,
    });
  },

  // Exit preview mode (revert to original theme)
  exitPreviewMode: () => {
    set({
      isPreviewMode: false,
      previewTheme: null,
    });
  },

  // Apply previewed theme
  applyPreview: () => {
    const { previewTheme } = get();

    if (previewTheme) {
      get().setTheme(previewTheme);
      set({
        isPreviewMode: false,
        previewTheme: null,
      });
    }
  },

  // Save theme to AsyncStorage
  saveTheme: async () => {
    set({ isLoading: true, error: null });

    try {
      const { theme } = get();
      await CustomizationEngine.saveTheme(theme);

      set({
        isDirty: false,
        isLoading: false,
      });
    } catch (error: unknown) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to save theme',
      });
      throw error;
    }
  },

  // Load theme from AsyncStorage
  loadTheme: async () => {
    set({ isLoading: true, error: null });

    try {
      const loadedTheme = await CustomizationEngine.loadTheme();

      if (loadedTheme) {
        set({
          theme: loadedTheme,
          history: {
            past: [],
            present: loadedTheme,
            future: [],
          },
          isDirty: false,
          isLoading: false,
        });
      } else {
        // No saved theme, use default
        set({ isLoading: false });
      }
    } catch (error: unknown) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load theme',
      });
      throw error;
    }
  },

  // Export theme as JSON string
  exportTheme: () => {
    const { theme } = get();
    return CustomizationEngine.exportTheme(theme);
  },

  // Import theme from JSON string
  importTheme: (json: string) => {
    try {
      const importedTheme = CustomizationEngine.importTheme(json);
      get().setTheme(importedTheme);
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : 'Failed to import theme',
      });
      throw error;
    }
  },

  // Validate current theme
  validateTheme: () => {
    const { theme } = get();
    return CustomizationEngine.validateTheme(theme);
  },

  // Check if theme is accessible
  isAccessible: () => {
    const { theme } = get();
    return CustomizationEngine.isAccessible(theme);
  },

  // Optimize theme for device tier
  optimizeForDevice: (deviceTier: 'high' | 'mid' | 'low') => {
    const { theme } = get();
    const optimized = CustomizationEngine.optimizeForDevice(theme, deviceTier);
    get().setTheme(optimized);
  },
}));

// ============================================================================
// SELECTORS (for optimized access)
// ============================================================================

export const useTheme = () => useCustomizationStore((state) => state.theme);
export const useColors = () => useCustomizationStore((state) => state.theme.colors);
export const useTypography = () => useCustomizationStore((state) => state.theme.typography);
export const useSpacing = () => useCustomizationStore((state) => state.theme.spacing);
export const useBorderRadius = () => useCustomizationStore((state) => state.theme.borderRadius);
export const useEffects = () => useCustomizationStore((state) => state.theme.effects);
export const useAnimations = () => useCustomizationStore((state) => state.theme.animations);
export const useLayout = () => useCustomizationStore((state) => state.theme.layout);
export const useAccessibility = () => useCustomizationStore((state) => state.theme.accessibility);
export const usePerformance = () => useCustomizationStore((state) => state.theme.performance);

export const useIsPreviewMode = () => useCustomizationStore((state) => state.isPreviewMode);
export const useIsDirty = () => useCustomizationStore((state) => state.isDirty);
export const useCanUndo = () => useCustomizationStore((state) => state.canUndo());
export const useCanRedo = () => useCustomizationStore((state) => state.canRedo());

export default useCustomizationStore;

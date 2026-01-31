/**
 * ThemeContextEnhanced - Unit Tests
 *
 * Tests for the React context provider and hooks that wrap ThemeEngine.
 *
 * @version 4.0.1
 * @since v0.7.36
 */

import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React, { ReactNode } from 'react';

// =============================================================================
// MOCKS
// =============================================================================

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

// Mock BroadcastChannel
class MockBroadcastChannel {
  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(name: string) {
    this.name = name;
  }

  postMessage = vi.fn();
  close = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn(() => true);
}

// Mock matchMedia
const mockMatchMedia = vi.fn(() => ({
  matches: false,
  media: '',
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Save original globals
const originalLocalStorage = global.localStorage;
const originalBroadcastChannel = (global as any).BroadcastChannel;
const originalMatchMedia = global.matchMedia;

// =============================================================================
// TEST SETUP
// =============================================================================

beforeAll(() => {
  Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });
  (global as any).BroadcastChannel = MockBroadcastChannel;
  // Don't replace document - jsdom provides it and @testing-library/react needs document.body
  // Just mock documentElement.style methods on the existing document
  if (document.documentElement) {
    vi.spyOn(document.documentElement.style, 'setProperty').mockImplementation(() => {});
    vi.spyOn(document.documentElement.style, 'removeProperty').mockImplementation(() => '');
  }
  Object.defineProperty(global, 'matchMedia', { value: mockMatchMedia, writable: true });
});

afterAll(() => {
  Object.defineProperty(global, 'localStorage', { value: originalLocalStorage, writable: true });
  (global as any).BroadcastChannel = originalBroadcastChannel;
  Object.defineProperty(global, 'matchMedia', { value: originalMatchMedia, writable: true });
  vi.restoreAllMocks();
});

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

// =============================================================================
// IMPORT AFTER MOCKS
// =============================================================================

import {
  ThemeProviderEnhanced,
  useThemeEnhanced,
  useThemeColors,
  useReducedMotion,
} from '@/contexts/ThemeContextEnhanced';

// Wrapper for hook tests
const wrapper = ({ children }: { children: ReactNode }) =>
  React.createElement(ThemeProviderEnhanced, null, children);

// =============================================================================
// TESTS
// =============================================================================

describe('ThemeContextEnhanced', () => {
  // ===========================================================================
  // PROVIDER TESTS
  // ===========================================================================

  describe('ThemeProviderEnhanced', () => {
    it('should provide default theme context', () => {
      const { result } = renderHook(() => useThemeEnhanced(), { wrapper });

      expect(result.current.theme).toBeDefined();
      expect(result.current.theme.id).toBe('dark');
      expect(result.current.preferences).toBeDefined();
      expect(result.current.availableThemes).toBeDefined();
      expect(result.current.availableThemes.length).toBeGreaterThanOrEqual(7);
    });

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        renderHook(() => useThemeEnhanced());
      }).toThrow('useThemeEnhanced must be used within a ThemeProviderEnhanced');

      console.error = originalError;
    });
  });

  // ===========================================================================
  // THEME SWITCHING VIA CONTEXT
  // ===========================================================================

  describe('Theme Switching', () => {
    it('should switch theme via setTheme', () => {
      const { result } = renderHook(() => useThemeEnhanced(), { wrapper });

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme.id).toBe('light');
    });

    it('should switch to matrix theme', () => {
      const { result } = renderHook(() => useThemeEnhanced(), { wrapper });

      act(() => {
        result.current.setTheme('matrix');
      });

      expect(result.current.theme.id).toBe('matrix');
      expect(result.current.theme.category).toBe('special');
    });

    it('should switch to holographic themes', () => {
      const { result } = renderHook(() => useThemeEnhanced(), { wrapper });

      const holoThemes = ['holo-cyan', 'holo-purple', 'holo-gold', 'midnight'];

      for (const themeId of holoThemes) {
        act(() => {
          result.current.setTheme(themeId);
        });
        expect(result.current.theme.id).toBe(themeId);
      }
    });

    it('should toggle dark mode', () => {
      const { result } = renderHook(() => useThemeEnhanced(), { wrapper });

      act(() => {
        result.current.toggleDarkMode();
      });

      expect(result.current.theme.id).toBe('light');

      act(() => {
        result.current.toggleDarkMode();
      });

      expect(result.current.theme.id).toBe('dark');
    });
  });

  // ===========================================================================
  // PREFERENCE MANAGEMENT
  // ===========================================================================

  describe('Preference Management', () => {
    it('should update font scale', () => {
      const { result } = renderHook(() => useThemeEnhanced(), { wrapper });

      act(() => {
        result.current.setFontScale(1.25);
      });

      expect(result.current.preferences.settings.fontScale).toBe(1.25);
    });

    it('should update message display', () => {
      const { result } = renderHook(() => useThemeEnhanced(), { wrapper });

      act(() => {
        result.current.setMessageDisplay('compact');
      });

      expect(result.current.preferences.settings.messageDisplay).toBe('compact');
    });

    it('should update message spacing', () => {
      const { result } = renderHook(() => useThemeEnhanced(), { wrapper });

      act(() => {
        result.current.setMessageSpacing(1.5);
      });

      expect(result.current.preferences.settings.messageSpacing).toBe(1.5);
    });

    it('should toggle reduce motion', () => {
      const { result } = renderHook(() => useThemeEnhanced(), { wrapper });

      const initial = result.current.preferences.settings.reduceMotion;

      act(() => {
        result.current.toggleReduceMotion();
      });

      expect(result.current.preferences.settings.reduceMotion).toBe(!initial);
    });

    it('should toggle high contrast', () => {
      const { result } = renderHook(() => useThemeEnhanced(), { wrapper });

      const initial = result.current.preferences.settings.highContrast;

      act(() => {
        result.current.toggleHighContrast();
      });

      expect(result.current.preferences.settings.highContrast).toBe(!initial);
    });

    it('should toggle system preference', () => {
      const { result } = renderHook(() => useThemeEnhanced(), { wrapper });

      const initial = result.current.preferences.settings.respectSystemPreference;

      act(() => {
        result.current.toggleSystemPreference();
      });

      expect(result.current.preferences.settings.respectSystemPreference).toBe(!initial);
    });
  });

  // ===========================================================================
  // CUSTOM THEMES VIA CONTEXT
  // ===========================================================================

  describe('Custom Themes', () => {
    it('should have createCustomTheme method available', () => {
      const { result } = renderHook(() => useThemeEnhanced(), { wrapper });

      expect(typeof result.current.createCustomTheme).toBe('function');
    });

    it('should have deleteCustomTheme method available', () => {
      const { result } = renderHook(() => useThemeEnhanced(), { wrapper });

      expect(typeof result.current.deleteCustomTheme).toBe('function');
    });

    it('should not delete built-in themes', () => {
      const { result } = renderHook(() => useThemeEnhanced(), { wrapper });

      let deleteResult: boolean = false;
      act(() => {
        deleteResult = result.current.deleteCustomTheme('dark');
      });

      expect(deleteResult).toBe(false);
    });
  });

  // ===========================================================================
  // CONVENIENCE HOOKS
  // ===========================================================================

  describe('Convenience Hooks', () => {
    it('useThemeColors should return color object', () => {
      const { result } = renderHook(() => useThemeColors(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.primary).toBeDefined();
      expect(result.current.background).toBeDefined();
      expect(result.current.textPrimary).toBeDefined();
    });

    it('useReducedMotion should return boolean', () => {
      const { result } = renderHook(() => useReducedMotion(), { wrapper });

      expect(typeof result.current).toBe('boolean');
    });

    it('useReducedMotion should update when preference changes', () => {
      const { result: themeResult } = renderHook(() => useThemeEnhanced(), { wrapper });
      const { result: motionResult } = renderHook(() => useReducedMotion(), { wrapper });

      const initial = motionResult.current;

      act(() => {
        themeResult.current.toggleReduceMotion();
      });

      // Re-render hook to get updated value
      const { result: updatedResult } = renderHook(() => useReducedMotion(), { wrapper });
      expect(updatedResult.current).toBe(!initial);
    });
  });

  // ===========================================================================
  // DERIVED VALUES
  // ===========================================================================

  describe('Derived Values', () => {
    it('should compute isSystemPreference correctly', () => {
      const { result } = renderHook(() => useThemeEnhanced(), { wrapper });

      expect(typeof result.current.isSystemPreference).toBe('boolean');
    });

    it('should compute resolvedBaseTheme correctly for dark themes', () => {
      const { result } = renderHook(() => useThemeEnhanced(), { wrapper });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.resolvedBaseTheme).toBe('dark');
    });

    it('should compute resolvedBaseTheme correctly for light themes', () => {
      const { result } = renderHook(() => useThemeEnhanced(), { wrapper });

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.resolvedBaseTheme).toBe('light');
    });
  });

  // ===========================================================================
  // THEME COLORS UPDATE
  // ===========================================================================

  describe('Color Updates', () => {
    it('should have different colors for different themes', () => {
      const { result } = renderHook(() => useThemeEnhanced(), { wrapper });

      act(() => {
        result.current.setTheme('dark');
      });
      const darkBg = result.current.theme.colors.background;

      act(() => {
        result.current.setTheme('light');
      });
      const lightBg = result.current.theme.colors.background;

      expect(darkBg).not.toBe(lightBg);
    });

    it('should have holographic colors for holo themes', () => {
      const { result } = renderHook(() => useThemeEnhanced(), { wrapper });

      act(() => {
        result.current.setTheme('holo-cyan');
      });

      expect(result.current.theme.colors.holoGlow).toBeDefined();
      expect(result.current.theme.colors.holoAccent).toBeDefined();
    });
  });
});

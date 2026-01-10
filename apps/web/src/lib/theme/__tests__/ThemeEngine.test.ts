/**
 * Theme Engine v4.0 - Unit Tests
 *
 * Comprehensive test suite for the ThemeEngine covering:
 * - Theme initialization and defaults
 * - Theme switching and persistence
 * - Custom theme creation/deletion
 * - Preference management
 * - CSS variable injection
 * - Cross-tab synchronization (mocked)
 * - Error handling and edge cases
 *
 * @version 4.0.1
 * @since v0.7.36
 */

import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest';

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

// Mock document
const mockDocument = {
  documentElement: {
    style: {
      setProperty: vi.fn(),
      removeProperty: vi.fn(),
    },
  },
};

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
const originalDocument = global.document;
const originalMatchMedia = global.matchMedia;

// =============================================================================
// TEST SETUP
// =============================================================================

beforeAll(() => {
  Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });
  (global as any).BroadcastChannel = MockBroadcastChannel;
  Object.defineProperty(global, 'document', { value: mockDocument, writable: true });
  Object.defineProperty(global, 'matchMedia', { value: mockMatchMedia, writable: true });
});

afterAll(() => {
  Object.defineProperty(global, 'localStorage', { value: originalLocalStorage, writable: true });
  (global as any).BroadcastChannel = originalBroadcastChannel;
  Object.defineProperty(global, 'document', { value: originalDocument, writable: true });
  Object.defineProperty(global, 'matchMedia', { value: originalMatchMedia, writable: true });
});

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

// =============================================================================
// IMPORT AFTER MOCKS ARE SET UP
// =============================================================================

// We need to import dynamically after mocks are set up
let themeEngine: any;
let setTheme: any;
let getCurrentTheme: any;
let getAllThemes: any;
let subscribeToTheme: any;

describe('ThemeEngine', () => {
  beforeAll(async () => {
    // Dynamic import to ensure mocks are in place
    const module = await import('../ThemeEngine');
    themeEngine = module.themeEngine;
    setTheme = module.setTheme;
    getCurrentTheme = module.getCurrentTheme;
    getAllThemes = module.getAllThemes;
    subscribeToTheme = module.subscribeToTheme;
  });

  // ===========================================================================
  // INITIALIZATION TESTS
  // ===========================================================================

  describe('Initialization', () => {
    it('should initialize with default dark theme', () => {
      const theme = themeEngine.getCurrentTheme();
      expect(theme).toBeDefined();
      expect(theme.id).toBe('dark');
      expect(theme.name).toBe('Dark');
      expect(theme.category).toBe('dark');
      expect(theme.isBuiltIn).toBe(true);
    });

    it('should have 7 built-in themes', () => {
      const themes = themeEngine.getAllThemes();
      const builtInThemes = themes.filter((t: any) => t.isBuiltIn);
      expect(builtInThemes.length).toBe(7);
    });

    it('should have required theme categories', () => {
      const themes = themeEngine.getAllThemes();
      const categories = [...new Set(themes.map((t: any) => t.category))];
      expect(categories).toContain('dark');
      expect(categories).toContain('light');
      expect(categories).toContain('matrix');
      expect(categories).toContain('holographic');
    });

    it('should initialize default preferences', () => {
      const prefs = themeEngine.getPreferences();
      expect(prefs.currentThemeId).toBe('dark');
      expect(prefs.settings).toBeDefined();
      expect(prefs.settings.fontScale).toBe(1);
      expect(prefs.settings.messageDisplay).toBe('comfortable');
      expect(prefs.settings.messageSpacing).toBe(1);
      expect(prefs.settings.reduceMotion).toBe(false);
      expect(prefs.settings.highContrast).toBe(false);
    });
  });

  // ===========================================================================
  // THEME SWITCHING TESTS
  // ===========================================================================

  describe('Theme Switching', () => {
    it('should switch to light theme', () => {
      themeEngine.setTheme('light');
      const theme = themeEngine.getCurrentTheme();
      expect(theme.id).toBe('light');
      expect(theme.name).toBe('Light');
      expect(theme.category).toBe('light');
    });

    it('should switch to matrix theme', () => {
      themeEngine.setTheme('matrix');
      const theme = themeEngine.getCurrentTheme();
      expect(theme.id).toBe('matrix');
      expect(theme.name).toBe('Matrix');
      expect(theme.category).toBe('matrix');
    });

    it('should switch to holographic themes', () => {
      const holoThemes = ['holo-cyan', 'holo-purple', 'holo-gold', 'midnight'];
      for (const themeId of holoThemes) {
        themeEngine.setTheme(themeId);
        const theme = themeEngine.getCurrentTheme();
        expect(theme.id).toBe(themeId);
        expect(theme.category).toBe('holographic');
      }
    });

    it('should fallback to dark theme for invalid theme ID', () => {
      themeEngine.setTheme('non-existent-theme');
      const theme = themeEngine.getCurrentTheme();
      expect(theme.id).toBe('dark');
    });

    it('should persist theme choice to localStorage', () => {
      themeEngine.setTheme('matrix');
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should apply CSS variables when switching themes', () => {
      themeEngine.setTheme('holo-cyan');
      expect(mockDocument.documentElement.style.setProperty).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // THEME COLOR VALIDATION
  // ===========================================================================

  describe('Theme Colors', () => {
    it('should have all required color properties', () => {
      const themes = themeEngine.getAllThemes();
      const requiredColors = [
        'primary', 'secondary', 'background', 'surface',
        'textPrimary', 'textSecondary', 'border',
        'error', 'warning', 'success', 'info',
      ];

      for (const theme of themes) {
        for (const colorKey of requiredColors) {
          expect(theme.colors[colorKey]).toBeDefined();
          expect(typeof theme.colors[colorKey]).toBe('string');
        }
      }
    });

    it('should have holographic colors for holographic themes', () => {
      const holoThemes = ['holo-cyan', 'holo-purple', 'holo-gold', 'midnight'];
      const holoColors = ['holoGlow', 'holoAccent', 'holoScanline'];

      for (const themeId of holoThemes) {
        themeEngine.setTheme(themeId);
        const theme = themeEngine.getCurrentTheme();
        for (const holoColor of holoColors) {
          expect(theme.colors[holoColor]).toBeDefined();
        }
      }
    });

    it('should have matrix-specific colors for matrix theme', () => {
      themeEngine.setTheme('matrix');
      const theme = themeEngine.getCurrentTheme();
      expect(theme.colors.matrixGreen).toBeDefined();
      expect(theme.colors.matrixDarkGreen).toBeDefined();
    });
  });

  // ===========================================================================
  // ANIMATION CONFIGURATION
  // ===========================================================================

  describe('Animation Configuration', () => {
    it('should have animation settings for each theme', () => {
      const themes = themeEngine.getAllThemes();
      for (const theme of themes) {
        expect(theme.animations).toBeDefined();
        expect(typeof theme.animations.enableGlow).toBe('boolean');
        expect(typeof theme.animations.enableScanlines).toBe('boolean');
        expect(typeof theme.animations.enableParticles).toBe('boolean');
        expect(typeof theme.animations.pulseIntensity).toBe('number');
        expect(typeof theme.animations.transitionSpeed).toBe('number');
      }
    });

    it('should have particles enabled for holographic themes', () => {
      const holoThemes = ['holo-cyan', 'holo-purple', 'holo-gold'];
      for (const themeId of holoThemes) {
        themeEngine.setTheme(themeId);
        const theme = themeEngine.getCurrentTheme();
        expect(theme.animations.enableParticles).toBe(true);
      }
    });

    it('should have scanlines enabled for matrix theme', () => {
      themeEngine.setTheme('matrix');
      const theme = themeEngine.getCurrentTheme();
      expect(theme.animations.enableScanlines).toBe(true);
    });
  });

  // ===========================================================================
  // PREFERENCES MANAGEMENT
  // ===========================================================================

  describe('Preferences Management', () => {
    it('should update font scale', () => {
      themeEngine.updateSettings({ fontScale: 1.25 });
      const prefs = themeEngine.getPreferences();
      expect(prefs.settings.fontScale).toBe(1.25);
    });

    it('should clamp font scale to valid range', () => {
      themeEngine.updateSettings({ fontScale: 0.3 }); // Below min
      expect(themeEngine.getPreferences().settings.fontScale).toBeGreaterThanOrEqual(0.75);
      
      themeEngine.updateSettings({ fontScale: 5 }); // Above max
      expect(themeEngine.getPreferences().settings.fontScale).toBeLessThanOrEqual(1.5);
    });

    it('should update message display mode', () => {
      themeEngine.updateSettings({ messageDisplay: 'compact' });
      expect(themeEngine.getPreferences().settings.messageDisplay).toBe('compact');
    });

    it('should toggle reduce motion', () => {
      const initialValue = themeEngine.getPreferences().settings.reduceMotion;
      themeEngine.updateSettings({ reduceMotion: !initialValue });
      expect(themeEngine.getPreferences().settings.reduceMotion).toBe(!initialValue);
    });

    it('should toggle high contrast', () => {
      const initialValue = themeEngine.getPreferences().settings.highContrast;
      themeEngine.updateSettings({ highContrast: !initialValue });
      expect(themeEngine.getPreferences().settings.highContrast).toBe(!initialValue);
    });

    it('should persist preferences to localStorage', () => {
      themeEngine.updateSettings({ fontScale: 1.1 });
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // CUSTOM THEMES
  // ===========================================================================

  describe('Custom Themes', () => {
    it('should create a custom theme', () => {
      const customTheme = {
        id: 'my-custom',
        name: 'My Custom Theme',
        category: 'dark' as const,
        colors: {
          primary: '#ff0000',
          secondary: '#00ff00',
          background: '#000000',
          surface: '#111111',
          textPrimary: '#ffffff',
          textSecondary: '#cccccc',
          border: '#333333',
          error: '#ff4444',
          warning: '#ffaa00',
          success: '#00ff00',
          info: '#0099ff',
          holoGlow: '#ff0000',
          holoAccent: '#ff6600',
          holoScanline: 'rgba(255,0,0,0.1)',
          matrixGreen: '#00ff00',
          matrixDarkGreen: '#003300',
        },
        animations: {
          enableGlow: true,
          enableScanlines: false,
          enableParticles: false,
          pulseIntensity: 0.5,
          transitionSpeed: 0.3,
        },
        typography: {
          fontFamily: 'system-ui',
          fontFamilyMono: 'monospace',
          baseFontSize: 16,
          lineHeight: 1.5,
        },
      };

      const created = themeEngine.createCustomTheme(customTheme);
      expect(created).toBeDefined();
      expect(created.isBuiltIn).toBe(false);
    });

    it('should delete a custom theme', () => {
      const customTheme = {
        id: 'to-delete',
        name: 'To Delete',
        category: 'dark' as const,
        colors: {
          primary: '#ff0000',
          secondary: '#00ff00',
          background: '#000000',
          surface: '#111111',
          textPrimary: '#ffffff',
          textSecondary: '#cccccc',
          border: '#333333',
          error: '#ff4444',
          warning: '#ffaa00',
          success: '#00ff00',
          info: '#0099ff',
          holoGlow: '#ff0000',
          holoAccent: '#ff6600',
          holoScanline: 'rgba(255,0,0,0.1)',
          matrixGreen: '#00ff00',
          matrixDarkGreen: '#003300',
        },
        animations: {
          enableGlow: false,
          enableScanlines: false,
          enableParticles: false,
          pulseIntensity: 0.5,
          transitionSpeed: 0.3,
        },
        typography: {
          fontFamily: 'system-ui',
          fontFamilyMono: 'monospace',
          baseFontSize: 16,
          lineHeight: 1.5,
        },
      };

      const created = themeEngine.createCustomTheme(customTheme);
      const initialCount = themeEngine.getAllThemes().length;
      
      const result = themeEngine.deleteCustomTheme(created.id);
      expect(result).toBe(true);
      expect(themeEngine.getAllThemes().length).toBe(initialCount - 1);
    });

    it('should not delete built-in themes', () => {
      const result = themeEngine.deleteCustomTheme('dark');
      expect(result).toBe(false);
      
      const theme = themeEngine.getAllThemes().find((t: any) => t.id === 'dark');
      expect(theme).toBeDefined();
    });

    it('should switch to dark theme when active custom theme is deleted', () => {
      const customTheme = {
        id: 'active-custom',
        name: 'Active Custom',
        category: 'dark' as const,
        colors: {
          primary: '#ff0000',
          secondary: '#00ff00',
          background: '#000000',
          surface: '#111111',
          textPrimary: '#ffffff',
          textSecondary: '#cccccc',
          border: '#333333',
          error: '#ff4444',
          warning: '#ffaa00',
          success: '#00ff00',
          info: '#0099ff',
          holoGlow: '#ff0000',
          holoAccent: '#ff6600',
          holoScanline: 'rgba(255,0,0,0.1)',
          matrixGreen: '#00ff00',
          matrixDarkGreen: '#003300',
        },
        animations: {
          enableGlow: false,
          enableScanlines: false,
          enableParticles: false,
          pulseIntensity: 0.5,
          transitionSpeed: 0.3,
        },
        typography: {
          fontFamily: 'system-ui',
          fontFamilyMono: 'monospace',
          baseFontSize: 16,
          lineHeight: 1.5,
        },
      };

      const created = themeEngine.createCustomTheme(customTheme);
      themeEngine.setTheme(created.id);
      expect(themeEngine.getCurrentTheme().id).toBe(created.id);
      
      themeEngine.deleteCustomTheme(created.id);
      expect(themeEngine.getCurrentTheme().id).toBe('dark');
    });
  });

  // ===========================================================================
  // SUBSCRIPTION SYSTEM
  // ===========================================================================

  describe('Subscription System', () => {
    it('should notify subscribers when theme changes', () => {
      const listener = vi.fn();
      const unsubscribe = themeEngine.subscribe(listener);
      
      themeEngine.setTheme('light');
      expect(listener).toHaveBeenCalled();
      
      unsubscribe();
    });

    it('should not notify after unsubscribe', () => {
      const listener = vi.fn();
      const unsubscribe = themeEngine.subscribe(listener);
      
      themeEngine.setTheme('matrix');
      expect(listener).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      listener.mockClear();
      
      themeEngine.setTheme('dark');
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle multiple subscribers', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      const unsub1 = themeEngine.subscribe(listener1);
      const unsub2 = themeEngine.subscribe(listener2);
      
      themeEngine.setTheme('holo-cyan');
      
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
      
      unsub1();
      unsub2();
    });
  });

  // ===========================================================================
  // CONVENIENCE FUNCTIONS
  // ===========================================================================

  describe('Convenience Functions', () => {
    it('setTheme should work as convenience function', () => {
      setTheme('matrix');
      expect(getCurrentTheme().id).toBe('matrix');
    });

    it('getCurrentTheme should return current theme', () => {
      setTheme('light');
      const theme = getCurrentTheme();
      expect(theme.id).toBe('light');
    });

    it('getAllThemes should return all themes', () => {
      const themes = getAllThemes();
      expect(Array.isArray(themes)).toBe(true);
      expect(themes.length).toBeGreaterThanOrEqual(7);
    });

    it('subscribeToTheme should work', () => {
      const listener = vi.fn();
      const unsubscribe = subscribeToTheme(listener);
      
      setTheme('holo-purple');
      expect(listener).toHaveBeenCalled();
      
      unsubscribe();
    });
  });

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('should handle empty theme ID gracefully', () => {
      themeEngine.setTheme('');
      // Should fallback to dark
      expect(themeEngine.getCurrentTheme().id).toBe('dark');
    });

    it('should handle null/undefined settings gracefully', () => {
      expect(() => themeEngine.updateSettings(null)).not.toThrow();
      expect(() => themeEngine.updateSettings(undefined)).not.toThrow();
    });

    it('should validate message display values', () => {
      themeEngine.updateSettings({ messageDisplay: 'invalid' as any });
      const validDisplays = ['compact', 'comfortable', 'spacious'];
      expect(validDisplays).toContain(themeEngine.getPreferences().settings.messageDisplay);
    });

    it('should handle rapid theme switches', () => {
      for (let i = 0; i < 10; i++) {
        themeEngine.setTheme('light');
        themeEngine.setTheme('dark');
        themeEngine.setTheme('matrix');
      }
      // Should still be in valid state
      expect(themeEngine.getCurrentTheme()).toBeDefined();
    });
  });
});

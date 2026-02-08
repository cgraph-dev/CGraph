/**
 * Theme Utilities - Unit Tests
 *
 * Tests for CSS variable injection, document class management,
 * preferences persistence, and theme definitions.
 * (ThemeEngine tested separately in ThemeEngine.test.ts)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  getDefaultPreferences,
  loadPreferences,
  savePreferences,
  STORAGE_KEY,
  BROADCAST_CHANNEL,
  initBroadcastChannel,
} from '../preferences';
import {
  DEFAULT_TYPOGRAPHY,
  DEFAULT_SPACING,
  DEFAULT_ANIMATIONS,
  THEME_DARK,
  THEME_LIGHT,
  THEME_MATRIX,
  THEME_REGISTRY,
} from '../themes';
import type { Theme, ThemePreferences } from '../types';

// =============================================================================
// MOCKS
// =============================================================================

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
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

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// =============================================================================
// PREFERENCES
// =============================================================================

describe('getDefaultPreferences', () => {
  it('should return default activeThemeId of "dark"', () => {
    const prefs = getDefaultPreferences();
    expect(prefs.activeThemeId).toBe('dark');
  });

  it('should return empty customThemes array', () => {
    expect(getDefaultPreferences().customThemes).toEqual([]);
  });

  it('should have fontScale of 1 and messageSpacing of 1', () => {
    const { settings } = getDefaultPreferences();
    expect(settings.fontScale).toBe(1);
    expect(settings.messageSpacing).toBe(1);
  });

  it('should default reduceMotion and highContrast to false', () => {
    const { settings } = getDefaultPreferences();
    expect(settings.reduceMotion).toBe(false);
    expect(settings.highContrast).toBe(false);
  });

  it('should return a fresh object each call (no shared reference)', () => {
    const a = getDefaultPreferences();
    const b = getDefaultPreferences();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});

describe('loadPreferences', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should return defaults when nothing is stored', () => {
    const prefs = loadPreferences();
    expect(prefs.activeThemeId).toBe('dark');
  });

  it('should merge stored preferences with defaults', () => {
    const partial: Partial<ThemePreferences> = { activeThemeId: 'matrix' };
    localStorageMock.setItem(STORAGE_KEY, JSON.stringify(partial));
    const prefs = loadPreferences();
    expect(prefs.activeThemeId).toBe('matrix');
    // Defaults should still be present
    expect(prefs.settings).toBeDefined();
    expect(prefs.customThemes).toEqual([]);
  });

  it('should handle corrupted JSON gracefully', () => {
    localStorageMock.setItem(STORAGE_KEY, '{not valid json!!!');
    const prefs = loadPreferences();
    // Falls back to defaults
    expect(prefs.activeThemeId).toBe('dark');
  });
});

describe('savePreferences', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should persist preferences to localStorage', () => {
    const prefs = getDefaultPreferences();
    prefs.activeThemeId = 'light';
    savePreferences(prefs);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.stringContaining('"activeThemeId":"light"')
    );
  });
});

describe('initBroadcastChannel', () => {
  it('should return null when BroadcastChannel is unavailable', () => {
    // In the test env BroadcastChannel is typically not defined
    const original = (globalThis as Record<string, unknown>).BroadcastChannel;
    delete (globalThis as Record<string, unknown>).BroadcastChannel;
    const result = initBroadcastChannel(() => {});
    expect(result).toBeNull();
    if (original) {
      (globalThis as Record<string, unknown>).BroadcastChannel = original;
    }
  });
});

describe('constants', () => {
  it('should export expected storage key', () => {
    expect(STORAGE_KEY).toBe('cgraph-theme-preferences');
  });

  it('should export expected broadcast channel name', () => {
    expect(BROADCAST_CHANNEL).toBe('cgraph-theme-sync');
  });
});

// =============================================================================
// THEME DEFINITIONS
// =============================================================================

describe('DEFAULT_TYPOGRAPHY', () => {
  it('should use Inter as primary font family', () => {
    expect(DEFAULT_TYPOGRAPHY.fontFamily).toContain('Inter');
  });

  it('should define all font size properties', () => {
    expect(DEFAULT_TYPOGRAPHY.fontSizeBase).toBe('14px');
    expect(DEFAULT_TYPOGRAPHY.fontSizeSmall).toBe('12px');
    expect(DEFAULT_TYPOGRAPHY.fontSizeLarge).toBe('16px');
    expect(DEFAULT_TYPOGRAPHY.fontSizeXL).toBe('20px');
    expect(DEFAULT_TYPOGRAPHY.fontSizeXXL).toBe('28px');
  });
});

describe('DEFAULT_SPACING', () => {
  it('should use 4 as the base unit', () => {
    expect(DEFAULT_SPACING.unit).toBe(4);
  });

  it('should define progressive spacing scale', () => {
    const px = (s: string) => parseInt(s, 10);
    expect(px(DEFAULT_SPACING.xs)).toBeLessThan(px(DEFAULT_SPACING.sm));
    expect(px(DEFAULT_SPACING.sm)).toBeLessThan(px(DEFAULT_SPACING.md));
    expect(px(DEFAULT_SPACING.md)).toBeLessThan(px(DEFAULT_SPACING.lg));
  });

  it('should set borderRadiusFull to 9999px', () => {
    expect(DEFAULT_SPACING.borderRadiusFull).toBe('9999px');
  });
});

describe('DEFAULT_ANIMATIONS', () => {
  it('should have increasing duration values', () => {
    const ms = (s: string) => parseInt(s, 10);
    expect(ms(DEFAULT_ANIMATIONS.durationFast)).toBeLessThan(ms(DEFAULT_ANIMATIONS.durationNormal));
    expect(ms(DEFAULT_ANIMATIONS.durationNormal)).toBeLessThan(ms(DEFAULT_ANIMATIONS.durationSlow));
  });

  it('should enable motion and glow by default', () => {
    expect(DEFAULT_ANIMATIONS.enableMotion).toBe(true);
    expect(DEFAULT_ANIMATIONS.enableGlow).toBe(true);
  });
});

describe('built-in themes', () => {
  it('THEME_DARK should be a built-in dark theme', () => {
    expect(THEME_DARK.id).toBe('dark');
    expect(THEME_DARK.category).toBe('dark');
    expect(THEME_DARK.isBuiltIn).toBe(true);
    expect(THEME_DARK.isPremium).toBe(false);
  });

  it('THEME_LIGHT should be a built-in light theme', () => {
    expect(THEME_LIGHT.id).toBe('light');
    expect(THEME_LIGHT.category).toBe('light');
    expect(THEME_LIGHT.isBuiltIn).toBe(true);
  });

  it('THEME_LIGHT should disable glow', () => {
    expect(THEME_LIGHT.animations.enableGlow).toBe(false);
  });

  it('THEME_MATRIX should be a special category theme', () => {
    expect(THEME_MATRIX.id).toBe('matrix');
    expect(THEME_MATRIX.category).toBe('special');
    expect(THEME_MATRIX.colors.primary).toBe('#00ff41');
  });

  it('all themes should have required structure', () => {
    const themes: Theme[] = [THEME_DARK, THEME_LIGHT, THEME_MATRIX];
    for (const theme of themes) {
      expect(theme).toHaveProperty('colors');
      expect(theme).toHaveProperty('typography');
      expect(theme).toHaveProperty('spacing');
      expect(theme).toHaveProperty('animations');
      expect(theme).toHaveProperty('metadata');
      expect(theme.metadata).toHaveProperty('author');
      expect(theme.metadata).toHaveProperty('version');
    }
  });
});

describe('THEME_REGISTRY', () => {
  it('should contain at least dark and light themes', () => {
    expect(THEME_REGISTRY).toHaveProperty('dark');
    expect(THEME_REGISTRY).toHaveProperty('light');
  });

  it('should map each theme by its id', () => {
    for (const [id, theme] of Object.entries(THEME_REGISTRY)) {
      expect(theme.id).toBe(id);
    }
  });
});

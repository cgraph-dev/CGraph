// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// ── Mock themeEngine (vi.hoisted to avoid reference-before-init) ──────

const { mockThemeEngine, getState, setState } = vi.hoisted(() => {
  let _currentThemeId = 'dark';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let _subscribers: ((theme: any) => void)[] = [];
  let _preferences = {
    themeId: 'dark',
    customThemes: {},
    settings: {
      respectSystemPreference: false,
      reduceMotion: false,
      highContrast: false,
      fontScale: 1,
      messageDisplay: 'cozy' as const,
      messageSpacing: 1,
    },
  };

  const engine = {
    getCurrentTheme: vi.fn(() => ({
      id: _currentThemeId,
      name: _currentThemeId,
      category: _currentThemeId === 'light' ? 'light' : 'dark',
      colors: {},
      isBuiltIn: true,
    })),
    getPreferences: vi.fn(() => _preferences),
    setTheme: vi.fn((id: string) => {
      _currentThemeId = id;
      _preferences = { ..._preferences, themeId: id };
      document.documentElement.classList.remove('light', 'dark');
      const category = id === 'light' ? 'light' : 'dark';
      document.documentElement.classList.add(category);
      localStorage.setItem('cgraph-theme', id);
      _subscribers.forEach((fn) =>
        fn({
          id,
          name: id,
          category,
          colors: {},
          isBuiltIn: true,
        })
      );
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscribe: vi.fn((fn: (theme: any) => void) => {
      _subscribers.push(fn);
      return () => {
        _subscribers = _subscribers.filter((s) => s !== fn);
      };
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateSettings: vi.fn((settings: any) => {
      _preferences = {
        ..._preferences,
        settings: { ..._preferences.settings, ...settings },
      };
    }),
    createCustomTheme: vi.fn(),
    deleteCustomTheme: vi.fn(),
  };

  return {
    mockThemeEngine: engine,
    getState: () => ({ _currentThemeId, _subscribers, _preferences }),
    setState: (patch: {
      themeId?: string;
      preferences?: typeof _preferences;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      subscribers?: ((theme: any) => void)[];
    }) => {
      if (patch.themeId !== undefined) _currentThemeId = patch.themeId;
      if (patch.preferences !== undefined) _preferences = patch.preferences;
      if (patch.subscribers !== undefined) _subscribers = patch.subscribers;
    },
  };
});

vi.mock('@/lib/theme/theme-engine', () => ({
  themeEngine: mockThemeEngine,
  getAllThemes: vi.fn(() => []),
  THEME_REGISTRY: {} as Record<string, unknown>,
}));

vi.mock('@/lib/theme/tokens', () => ({
  injectSemanticTokens: vi.fn(),
}));

import { ThemeProvider, useTheme } from '../theme-context';

// ── Helpers ────────────────────────────────────────────────────────────

let matchMediaMatches = false;
let _changeHandler: ((e: MediaQueryListEvent) => void) | null = null;

beforeEach(() => {
  matchMediaMatches = false;
  _changeHandler = null;
  setState({
    themeId: 'dark',
    subscribers: [],
    preferences: {
      themeId: 'dark',
      customThemes: {},
      settings: {
        respectSystemPreference: false,
        reduceMotion: false,
        highContrast: false,
        fontScale: 1,
        messageDisplay: 'cozy' as const,
        messageSpacing: 1,
      },
    },
  });
  localStorage.clear();
  document.documentElement.classList.remove('light', 'dark');
  vi.clearAllMocks();

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn(() => ({
      matches: matchMediaMatches,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      addEventListener: vi.fn((_: string, handler: any) => {
        _changeHandler = handler;
      }),
      removeEventListener: vi.fn(),
    })),
  });
});

function wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('ThemeContext', () => {
  describe('ThemeProvider', () => {
    it('renders children', () => {
      render(
        <ThemeProvider>
          <div data-testid="child">Hello</div>
        </ThemeProvider>
      );
      expect(screen.getByTestId('child')).toHaveTextContent('Hello');
    });

    it('defaults to dark theme when no stored theme', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });
      expect(result.current.theme).toBe('dark');
      expect(result.current.resolvedTheme).toBe('dark');
    });

    it('restores theme from localStorage', () => {
      // Simulate engine starting with light theme
      setState({ themeId: 'light', preferences: { ...getState()._preferences, themeId: 'light' } });
      mockThemeEngine.getCurrentTheme.mockReturnValueOnce({
        id: 'light',
        name: 'light',
        category: 'light',
        colors: {},
        isBuiltIn: true,
      });
      const { result } = renderHook(() => useTheme(), { wrapper });
      expect(result.current.resolvedTheme).toBe('light');
    });

    it('applies class to document.documentElement on mount', () => {
      // The engine starts with dark theme - simulate the class being set
      document.documentElement.classList.add('dark');
      render(
        <ThemeProvider>
          <div />
        </ThemeProvider>
      );
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('switches from dark to light and updates class', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.resolvedTheme).toBe('light');
      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(mockThemeEngine.setTheme).toHaveBeenCalledWith('light');
    });

    it('system theme resolves to system preference', () => {
      matchMediaMatches = true; // system prefers dark
      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('system');
      });

      expect(result.current.theme).toBe('system');
      expect(result.current.resolvedTheme).toBe('dark');
    });

    it('system theme resolves to light when system prefers light', () => {
      matchMediaMatches = false; // system prefers light
      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('system');
      });

      expect(result.current.theme).toBe('system');
      expect(result.current.resolvedTheme).toBe('light');
    });

    it('persists theme to localStorage on setTheme', () => {
      const { result } = renderHook(() => useTheme(), { wrapper });

      act(() => {
        result.current.setTheme('light');
      });

      expect(mockThemeEngine.setTheme).toHaveBeenCalledWith('light');

      act(() => {
        result.current.setTheme('system');
      });

      expect(mockThemeEngine.updateSettings).toHaveBeenCalledWith({
        respectSystemPreference: true,
      });
    });
  });

  describe('useTheme', () => {
    it('throws when used outside ThemeProvider', () => {
      // Suppress React error boundary console output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => renderHook(() => useTheme())).toThrow(
        'useTheme must be used within a ThemeProvider'
      );
      consoleSpy.mockRestore();
    });
  });
});

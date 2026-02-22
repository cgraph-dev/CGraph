import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { renderHook } from '@testing-library/react';
import {
  ThemeProviderEnhanced,
  useThemeEnhanced,
  useThemeColors,
  useIsSpecialTheme,
  useReducedMotion,
} from '../theme-context-enhanced';

// ---------------------------------------------------------------------------
// Shared theme fixtures (used inside and outside the factory)
// ---------------------------------------------------------------------------

const DARK_THEME = {
  id: 'dark',
  name: 'Dark',
  category: 'dark' as const,
  isBuiltIn: true,
  colors: {
    holoPrimary: '#00ff88',
    holoSecondary: '#00ccff',
    holoAccent: '#ff00ff',
    holoGlow: 'rgba(0,255,136,0.3)',
    holoScanline: 'rgba(0,255,136,0.05)',
    holoBackground: '#0a0a0a',
    primary: '#00ff88',
    background: '#121212',
  },
  animations: {
    enableScanlines: true,
    enableFlicker: false,
    enableGlow: true,
    enableParallax: false,
  },
};

const LIGHT_THEME = { ...DARK_THEME, id: 'light', name: 'Light', category: 'light' as const };
const SPECIAL_THEME = { ...DARK_THEME, id: 'neon', name: 'Neon', category: 'special' as const };

const DEFAULT_PREFS = {
  activeThemeId: 'dark',
  settings: {
    fontScale: 1,
    messageDisplay: 'cozy' as const,
    messageSpacing: 1,
    reduceMotion: false,
    highContrast: false,
    respectSystemPreference: false,
  },
  customThemes: [],
};

// ---------------------------------------------------------------------------
// vi.mock – factory must be self-contained (hoisted above all declarations)
// ---------------------------------------------------------------------------

vi.mock('@/lib/theme/ThemeEngine', () => {
  const dark = {
    id: 'dark',
    name: 'Dark',
    category: 'dark',
    isBuiltIn: true,
    colors: {
      holoPrimary: '#00ff88',
      holoSecondary: '#00ccff',
      holoAccent: '#ff00ff',
      holoGlow: 'rgba(0,255,136,0.3)',
      holoScanline: 'rgba(0,255,136,0.05)',
      holoBackground: '#0a0a0a',
      primary: '#00ff88',
      background: '#121212',
    },
    animations: {
      enableScanlines: true,
      enableFlicker: false,
      enableGlow: true,
      enableParallax: false,
    },
  };
  const light = { ...dark, id: 'light', name: 'Light', category: 'light' };
  const prefs = {
    activeThemeId: 'dark',
    settings: {
      fontScale: 1,
      messageDisplay: 'cozy',
      messageSpacing: 1,
      reduceMotion: false,
      highContrast: false,
      respectSystemPreference: false,
    },
    customThemes: [],
  };
  return {
    themeEngine: {
      getCurrentTheme: vi.fn(() => dark),
      getPreferences: vi.fn(() => prefs),
      setTheme: vi.fn(),
      updateSettings: vi.fn(),
      subscribe: vi.fn(() => vi.fn()),
      createCustomTheme: vi.fn((t: Record<string, unknown>) => ({ ...t, isBuiltIn: false })),
      deleteCustomTheme: vi.fn(() => true),
    },
    getAllThemes: vi.fn(() => [dark, light]),
    THEME_REGISTRY: { dark, light } as Record<string, unknown>,
  };
});

// Re-import the mocked module so we can access the spies in tests
import { themeEngine } from '@/lib/theme/theme-engine';
const mockEngine = themeEngine as unknown as {
  getCurrentTheme: ReturnType<typeof vi.fn>;
  getPreferences: ReturnType<typeof vi.fn>;
  setTheme: ReturnType<typeof vi.fn>;
  updateSettings: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
  createCustomTheme: ReturnType<typeof vi.fn>;
  deleteCustomTheme: ReturnType<typeof vi.fn>;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProviderEnhanced>{children}</ThemeProviderEnhanced>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ThemeProviderEnhanced', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEngine.getCurrentTheme.mockReturnValue(DARK_THEME);
    mockEngine.getPreferences.mockReturnValue(DEFAULT_PREFS);
  });

  // --- Rendering ---

  it('renders children', () => {
    render(
      <ThemeProviderEnhanced>
        <div data-testid="child">Hello</div>
      </ThemeProviderEnhanced>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    render(
      <ThemeProviderEnhanced>
        <span data-testid="a">A</span>
        <span data-testid="b">B</span>
      </ThemeProviderEnhanced>
    );
    expect(screen.getByTestId('a')).toBeInTheDocument();
    expect(screen.getByTestId('b')).toBeInTheDocument();
  });

  // --- Context values ---

  it('provides the current theme through context', () => {
    const { result } = renderHook(() => useThemeEnhanced(), { wrapper });
    expect(result.current.theme).toEqual(DARK_THEME);
  });

  it('provides preferences through context', () => {
    const { result } = renderHook(() => useThemeEnhanced(), { wrapper });
    expect(result.current.preferences).toEqual(DEFAULT_PREFS);
  });

  it('provides available themes', () => {
    const { result } = renderHook(() => useThemeEnhanced(), { wrapper });
    expect(result.current.availableThemes).toHaveLength(2);
  });

  it('resolves base theme to dark when category is dark', () => {
    const { result } = renderHook(() => useThemeEnhanced(), { wrapper });
    expect(result.current.resolvedBaseTheme).toBe('dark');
  });

  it('resolves base theme to light when category is light', () => {
    mockEngine.getCurrentTheme.mockReturnValue(LIGHT_THEME);
    const { result } = renderHook(() => useThemeEnhanced(), { wrapper });
    expect(result.current.resolvedBaseTheme).toBe('light');
  });

  it('reports isSystemPreference from settings', () => {
    const { result } = renderHook(() => useThemeEnhanced(), { wrapper });
    expect(result.current.isSystemPreference).toBe(false);
  });

  // --- Theme switching ---

  it('calls themeEngine.setTheme when setTheme is invoked', () => {
    const { result } = renderHook(() => useThemeEnhanced(), { wrapper });
    act(() => result.current.setTheme('light'));
    expect(mockEngine.setTheme).toHaveBeenCalledWith('light');
  });

  it('toggleDarkMode switches from dark to light', () => {
    const { result } = renderHook(() => useThemeEnhanced(), { wrapper });
    act(() => result.current.toggleDarkMode());
    expect(mockEngine.setTheme).toHaveBeenCalledWith('light');
  });

  it('toggleDarkMode switches from light to dark', () => {
    mockEngine.getCurrentTheme.mockReturnValue(LIGHT_THEME);
    const { result } = renderHook(() => useThemeEnhanced(), { wrapper });
    act(() => result.current.toggleDarkMode());
    expect(mockEngine.setTheme).toHaveBeenCalledWith('dark');
  });

  // --- Settings ---

  it('setFontScale clamps upper bound to 1.4', () => {
    const { result } = renderHook(() => useThemeEnhanced(), { wrapper });
    act(() => result.current.setFontScale(2.0));
    expect(mockEngine.updateSettings).toHaveBeenCalledWith({ fontScale: 1.4 });
  });

  it('setFontScale clamps lower bound to 0.8', () => {
    const { result } = renderHook(() => useThemeEnhanced(), { wrapper });
    act(() => result.current.setFontScale(0.3));
    expect(mockEngine.updateSettings).toHaveBeenCalledWith({ fontScale: 0.8 });
  });

  it('setMessageDisplay updates display mode', () => {
    const { result } = renderHook(() => useThemeEnhanced(), { wrapper });
    act(() => result.current.setMessageDisplay('compact'));
    expect(mockEngine.updateSettings).toHaveBeenCalledWith({ messageDisplay: 'compact' });
  });

  it('setMessageSpacing clamps value to max 2', () => {
    const { result } = renderHook(() => useThemeEnhanced(), { wrapper });
    act(() => result.current.setMessageSpacing(5));
    expect(mockEngine.updateSettings).toHaveBeenCalledWith({ messageSpacing: 2 });
  });

  it('toggleReduceMotion flips the current value', () => {
    const { result } = renderHook(() => useThemeEnhanced(), { wrapper });
    act(() => result.current.toggleReduceMotion());
    expect(mockEngine.updateSettings).toHaveBeenCalledWith({ reduceMotion: true });
  });

  it('toggleHighContrast flips the current value', () => {
    const { result } = renderHook(() => useThemeEnhanced(), { wrapper });
    act(() => result.current.toggleHighContrast());
    expect(mockEngine.updateSettings).toHaveBeenCalledWith({ highContrast: true });
  });

  it('toggleSystemPreference flips the current value', () => {
    const { result } = renderHook(() => useThemeEnhanced(), { wrapper });
    act(() => result.current.toggleSystemPreference());
    expect(mockEngine.updateSettings).toHaveBeenCalledWith({
      respectSystemPreference: true,
    });
  });

  // --- Custom themes ---

  it('createCustomTheme delegates to themeEngine', () => {
    const newTheme = {
      id: 'custom-1',
      name: 'My Theme',
      category: 'dark' as const,
      colors: {},
      animations: {},
    };
    const { result } = renderHook(() => useThemeEnhanced(), { wrapper });
    act(() => result.current.createCustomTheme(newTheme as never));
    expect(mockEngine.createCustomTheme).toHaveBeenCalledWith(newTheme);
  });

  it('deleteCustomTheme delegates to themeEngine and returns result', () => {
    const { result } = renderHook(() => useThemeEnhanced(), { wrapper });
    let deleted: boolean | undefined;
    act(() => {
      deleted = result.current.deleteCustomTheme('custom-1');
    });
    expect(mockEngine.deleteCustomTheme).toHaveBeenCalledWith('custom-1');
    expect(deleted).toBe(true);
  });

  // --- Subscription ---

  it('subscribes to theme changes on mount', () => {
    renderHook(() => useThemeEnhanced(), { wrapper });
    expect(mockEngine.subscribe).toHaveBeenCalledTimes(1);
  });

  // --- Initial theme ---

  it('applies initialTheme when provided and in registry', () => {
    function wrapperWithInitial({ children }: { children: React.ReactNode }) {
      return <ThemeProviderEnhanced initialTheme="light">{children}</ThemeProviderEnhanced>;
    }
    renderHook(() => useThemeEnhanced(), { wrapper: wrapperWithInitial });
    expect(mockEngine.setTheme).toHaveBeenCalledWith('light');
  });

  it('does not apply initialTheme when ID is not in registry', () => {
    function wrapperBad({ children }: { children: React.ReactNode }) {
      return <ThemeProviderEnhanced initialTheme="nonexistent">{children}</ThemeProviderEnhanced>;
    }
    renderHook(() => useThemeEnhanced(), { wrapper: wrapperBad });
    expect(mockEngine.setTheme).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Hook error boundary
// ---------------------------------------------------------------------------

describe('useThemeEnhanced', () => {
  it('throws when used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useThemeEnhanced())).toThrow(
      'useThemeEnhanced must be used within a ThemeProviderEnhanced'
    );
    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Convenience hooks
// ---------------------------------------------------------------------------

describe('useThemeColors', () => {
  it('returns the theme colors object', () => {
    const { result } = renderHook(() => useThemeColors(), { wrapper });
    expect(result.current).toEqual(DARK_THEME.colors);
  });
});

describe('useIsSpecialTheme', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEngine.getCurrentTheme.mockReturnValue(DARK_THEME);
    mockEngine.getPreferences.mockReturnValue(DEFAULT_PREFS);
  });

  it('returns false for non-special themes', () => {
    const { result } = renderHook(() => useIsSpecialTheme(), { wrapper });
    expect(result.current).toBe(false);
  });

  it('returns true for special themes', () => {
    mockEngine.getCurrentTheme.mockReturnValue(SPECIAL_THEME);
    const { result } = renderHook(() => useIsSpecialTheme(), { wrapper });
    expect(result.current).toBe(true);
  });
});

describe('useReducedMotion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEngine.getCurrentTheme.mockReturnValue(DARK_THEME);
    mockEngine.getPreferences.mockReturnValue(DEFAULT_PREFS);
  });

  it('returns false when reduceMotion is off', () => {
    const { result } = renderHook(() => useReducedMotion(), { wrapper });
    expect(result.current).toBe(false);
  });

  it('returns true when reduceMotion is on', () => {
    mockEngine.getPreferences.mockReturnValue({
      ...DEFAULT_PREFS,
      settings: { ...DEFAULT_PREFS.settings, reduceMotion: true },
    });
    const { result } = renderHook(() => useReducedMotion(), { wrapper });
    expect(result.current).toBe(true);
  });
});

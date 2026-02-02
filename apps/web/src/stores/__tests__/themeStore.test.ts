import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useThemeStore, COLORS, THEME_PRESETS } from '../theme/themeStore';
import type { ColorPreset } from '../theme/themeStore';

// Mock API
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock safeStorage
vi.mock('@/lib/safeStorage', () => ({
  safeLocalStorage: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe('Theme Store', () => {
  beforeEach(() => {
    // Reset store state
    useThemeStore.setState({
      colorPreset: 'emerald',
      profileThemeId: 'default',
      effectPreset: 'none',
      profileCardLayout: 'default',
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have default color preset', () => {
      const state = useThemeStore.getState();
      expect(state.colorPreset).toBe('emerald');
    });

    it('should have default profile theme', () => {
      const state = useThemeStore.getState();
      expect(state.profileThemeId).toBe('default');
    });

    it('should have no effect preset by default', () => {
      const state = useThemeStore.getState();
      expect(state.effectPreset).toBe('none');
    });

    it('should not be loading initially', () => {
      const state = useThemeStore.getState();
      expect(state.isLoading).toBe(false);
    });

    it('should have no error initially', () => {
      const state = useThemeStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('Color Presets', () => {
    it('should have all color presets defined', () => {
      const colorNames: ColorPreset[] = [
        'emerald',
        'purple',
        'cyan',
        'orange',
        'pink',
        'gold',
        'crimson',
        'arctic',
        'sunset',
        'midnight',
        'forest',
        'ocean',
      ];

      colorNames.forEach((color) => {
        expect(COLORS[color]).toBeDefined();
        expect(COLORS[color].primary).toBeDefined();
        expect(COLORS[color].secondary).toBeDefined();
        expect(COLORS[color].glow).toBeDefined();
        expect(COLORS[color].name).toBeDefined();
        expect(COLORS[color].gradient).toBeDefined();
      });
    });

    it('should set color preset', () => {
      useThemeStore.getState().setColorPreset('purple');
      expect(useThemeStore.getState().colorPreset).toBe('purple');
    });

    it('should set different color presets', () => {
      const colors: ColorPreset[] = ['cyan', 'orange', 'pink'];
      colors.forEach((color) => {
        useThemeStore.getState().setColorPreset(color);
        expect(useThemeStore.getState().colorPreset).toBe(color);
      });
    });
  });

  describe('Theme Presets', () => {
    it('should have theme presets defined', () => {
      expect(THEME_PRESETS).toBeDefined();
      expect(Object.keys(THEME_PRESETS).length).toBeGreaterThan(0);
    });

    it('should set profile theme', () => {
      useThemeStore.getState().setProfileTheme('minimal');
      expect(useThemeStore.getState().profileThemeId).toBe('minimal');
    });

    it('should set profile card layout', () => {
      useThemeStore.getState().setProfileCardLayout('compact');
      expect(useThemeStore.getState().profileCardLayout).toBe('compact');
    });
  });

  describe('Effect Presets', () => {
    it('should set effect preset', () => {
      useThemeStore.getState().setEffectPreset('matrix');
      expect(useThemeStore.getState().effectPreset).toBe('matrix');
    });

    it('should set different effect presets', () => {
      const effects = ['none', 'matrix', 'particles'] as const;
      effects.forEach((effect) => {
        useThemeStore.getState().setEffectPreset(effect);
        expect(useThemeStore.getState().effectPreset).toBe(effect);
      });
    });
  });

  describe('Animation Speed', () => {
    it('should set animation speed', () => {
      useThemeStore.getState().setAnimationSpeed('fast');
      expect(useThemeStore.getState().animationSpeed).toBe('fast');
    });
  });

  describe('Error Handling', () => {
    it('should clear error', () => {
      useThemeStore.setState({ error: 'Some error' });
      useThemeStore.getState().clearError();
      expect(useThemeStore.getState().error).toBeNull();
    });
  });

  describe('Reset Theme', () => {
    it('should have resetTheme function', () => {
      expect(typeof useThemeStore.getState().resetTheme).toBe('function');
    });
  });
});

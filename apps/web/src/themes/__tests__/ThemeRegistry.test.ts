import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AppTheme, ThemeCategory } from '../theme-types';
import { defaultTheme } from '../presets/default-theme';
import { matrixTheme } from '../presets/matrix-theme';
import { getCSSVariables, kebabCase } from '../css-variables';
import { hexToRgb, getLuminance, getContrastRatio, validateAccessibility } from '../accessibility';

// Fresh registry per test – dynamic import busts the singleton cache
async function freshRegistry() {
  vi.resetModules();
  const mod = await import('../ThemeRegistry');
  return { ThemeRegistry: mod.ThemeRegistry, themeAPI: mod.themeAPI };
}

// Minimal valid theme stub for registration tests
function stubTheme(overrides: Partial<AppTheme> = {}): AppTheme {
  return {
    ...defaultTheme,
    id: overrides.id ?? 'stub-theme',
    name: overrides.name ?? 'Stub',
    category: overrides.category ?? 'custom',
    isPremium: overrides.isPremium ?? false,
    ...overrides,
  } as AppTheme;
}

// ---------------------------------------------------------------------------
// Theme Registration & Retrieval
// ---------------------------------------------------------------------------
describe('ThemeRegistry – registration & retrieval', () => {
  let ThemeRegistry: Awaited<ReturnType<typeof freshRegistry>>['ThemeRegistry'];

  beforeEach(async () => {
    ({ ThemeRegistry } = await freshRegistry());
  });

  it('has the default theme registered on init', () => {
    expect(ThemeRegistry.getTheme('default')).toBeDefined();
    expect(ThemeRegistry.getTheme('default')!.id).toBe('default');
  });

  it('has the matrix theme registered on init', () => {
    expect(ThemeRegistry.getTheme('matrix')).toBeDefined();
    expect(ThemeRegistry.getTheme('matrix')!.id).toBe('matrix');
  });

  it('returns undefined for unknown theme ids', () => {
    expect(ThemeRegistry.getTheme('nonexistent')).toBeUndefined();
  });

  it('registers a new custom theme', () => {
    const custom = stubTheme({ id: 'my-custom' });
    ThemeRegistry.registerTheme(custom);
    expect(ThemeRegistry.getTheme('my-custom')).toEqual(custom);
  });

  it('getAllThemes returns at least the two built-in themes', () => {
    const all = ThemeRegistry.getAllThemes();
    expect(all.length).toBeGreaterThanOrEqual(2);
    const ids = all.map((t) => t.id);
    expect(ids).toContain('default');
    expect(ids).toContain('matrix');
  });

  it('overwrites a theme when re-registered with same id', () => {
    const v1 = stubTheme({ id: 'dup', name: 'V1' });
    const v2 = stubTheme({ id: 'dup', name: 'V2' });
    ThemeRegistry.registerTheme(v1);
    ThemeRegistry.registerTheme(v2);
    expect(ThemeRegistry.getTheme('dup')!.name).toBe('V2');
  });
});

// ---------------------------------------------------------------------------
// Unregister
// ---------------------------------------------------------------------------
describe('ThemeRegistry – unregisterTheme', () => {
  let ThemeRegistry: Awaited<ReturnType<typeof freshRegistry>>['ThemeRegistry'];

  beforeEach(async () => {
    ({ ThemeRegistry } = await freshRegistry());
  });

  it('prevents unregistering the default theme', () => {
    const result = ThemeRegistry.unregisterTheme('default');
    expect(result).toBe(false);
    expect(ThemeRegistry.getTheme('default')).toBeDefined();
  });

  it('unregisters a non-default theme successfully', () => {
    ThemeRegistry.registerTheme(stubTheme({ id: 'removable' }));
    expect(ThemeRegistry.unregisterTheme('removable')).toBe(true);
    expect(ThemeRegistry.getTheme('removable')).toBeUndefined();
  });

  it('returns false when unregistering a non-existent theme', () => {
    expect(ThemeRegistry.unregisterTheme('ghost')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Category / Premium Filtering
// ---------------------------------------------------------------------------
describe('ThemeRegistry – filtering', () => {
  let ThemeRegistry: Awaited<ReturnType<typeof freshRegistry>>['ThemeRegistry'];

  beforeEach(async () => {
    ({ ThemeRegistry } = await freshRegistry());
  });

  it('getThemesByCategory returns only matching themes', () => {
    const specials = ThemeRegistry.getThemesByCategory('special');
    specials.forEach((t) => expect(t.category).toBe('special'));
  });

  it('getThemesByCategory returns empty array for unused category', () => {
    expect(ThemeRegistry.getThemesByCategory('retro' as ThemeCategory)).toHaveLength(0);
  });

  it('getPremiumThemes returns only premium themes', () => {
    const premium = ThemeRegistry.getPremiumThemes();
    premium.forEach((t) => expect(t.isPremium).toBe(true));
    expect(premium.some((t) => t.id === 'matrix')).toBe(true);
  });

  it('getFreeThemes returns only free themes', () => {
    const free = ThemeRegistry.getFreeThemes();
    free.forEach((t) => expect(t.isPremium).toBe(false));
    expect(free.some((t) => t.id === 'default')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Current Theme
// ---------------------------------------------------------------------------
describe('ThemeRegistry – getCurrentTheme', () => {
  let ThemeRegistry: Awaited<ReturnType<typeof freshRegistry>>['ThemeRegistry'];

  beforeEach(async () => {
    ({ ThemeRegistry } = await freshRegistry());
  });

  it('returns default theme when no theme has been applied', () => {
    expect(ThemeRegistry.getCurrentTheme().id).toBe('default');
  });
});

// ---------------------------------------------------------------------------
// Validate Theme
// ---------------------------------------------------------------------------
describe('ThemeRegistry – validateTheme', () => {
  let ThemeRegistry: Awaited<ReturnType<typeof freshRegistry>>['ThemeRegistry'];

  beforeEach(async () => {
    ({ ThemeRegistry } = await freshRegistry());
  });

  it('validates a complete theme as true', () => {
    expect(ThemeRegistry.validateTheme(defaultTheme)).toBe(true);
  });

  it('rejects a theme missing id', () => {
    expect(ThemeRegistry.validateTheme({ name: 'X', colors: {} as any })).toBe(false);
  });

  it('rejects a theme missing name', () => {
    expect(ThemeRegistry.validateTheme({ id: 'x', colors: {} as any })).toBe(false);
  });

  it('rejects a theme missing colors', () => {
    expect(ThemeRegistry.validateTheme({ id: 'x', name: 'X' })).toBe(false);
  });

  it('rejects an empty object', () => {
    expect(ThemeRegistry.validateTheme({})).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Custom Theme Creation
// ---------------------------------------------------------------------------
describe('ThemeRegistry – createCustomTheme', () => {
  let ThemeRegistry: Awaited<ReturnType<typeof freshRegistry>>['ThemeRegistry'];

  beforeEach(async () => {
    ({ ThemeRegistry } = await freshRegistry());
  });

  it('creates a custom theme based on an existing theme', () => {
    const custom = ThemeRegistry.createCustomTheme('default', {
      id: 'my-variant',
      name: 'My Variant',
    });
    expect(custom.id).toBe('my-variant');
    expect(custom.name).toBe('My Variant');
    expect(custom.category).toBe('custom');
    expect(custom.colors.primary).toBe(defaultTheme.colors.primary);
  });

  it('merges color overrides into the base theme', () => {
    const custom = ThemeRegistry.createCustomTheme('default', {
      colors: { primary: '#ff0000' } as any,
    });
    expect(custom.colors.primary).toBe('#ff0000');
    expect(custom.colors.secondary).toBe(defaultTheme.colors.secondary);
  });

  it('throws when base theme does not exist', () => {
    expect(() => ThemeRegistry.createCustomTheme('nope', {})).toThrow(
      "Base theme 'nope' not found"
    );
  });

  it('generates an id when none is provided', () => {
    const custom = ThemeRegistry.createCustomTheme('default', { name: 'Auto ID' });
    expect(custom.id).toMatch(/^custom-\d+$/);
  });
});

// ---------------------------------------------------------------------------
// Export / Import
// ---------------------------------------------------------------------------
describe('ThemeRegistry – export & import', () => {
  let ThemeRegistry: Awaited<ReturnType<typeof freshRegistry>>['ThemeRegistry'];

  beforeEach(async () => {
    ({ ThemeRegistry } = await freshRegistry());
  });

  it('exports a theme as valid JSON', () => {
    const json = ThemeRegistry.exportTheme('default');
    const parsed = JSON.parse(json);
    expect(parsed.id).toBe('default');
  });

  it('throws when exporting a non-existent theme', () => {
    expect(() => ThemeRegistry.exportTheme('nope')).toThrow("Theme 'nope' not found");
  });

  it('imports a valid theme from JSON', () => {
    const theme = stubTheme({ id: 'imported' });
    const json = JSON.stringify(theme);
    const result = ThemeRegistry.importTheme(json);
    expect(result.id).toBe('imported');
    expect(ThemeRegistry.getTheme('imported')).toBeDefined();
  });

  it('throws on invalid JSON', () => {
    expect(() => ThemeRegistry.importTheme('{')).toThrow('Failed to import theme');
  });

  it('throws when imported JSON lacks required fields', () => {
    expect(() => ThemeRegistry.importTheme(JSON.stringify({ id: 'x' }))).toThrow(
      'Invalid theme structure'
    );
  });
});

// ---------------------------------------------------------------------------
// CSS Variable Generation
// ---------------------------------------------------------------------------
describe('CSS variable generation', () => {
  it('generates color variables prefixed with --theme-color-', () => {
    const vars = getCSSVariables(defaultTheme);
    expect(vars['--theme-color-primary']).toBe(defaultTheme.colors.primary);
    expect(vars['--theme-color-background']).toBe(defaultTheme.colors.background);
  });

  it('generates font family variables', () => {
    const vars = getCSSVariables(defaultTheme);
    expect(vars['--theme-font-primary']).toBe(defaultTheme.typography.fontFamily.primary);
    expect(vars['--theme-font-monospace']).toBe(defaultTheme.typography.fontFamily.monospace);
  });

  it('generates spacing variables', () => {
    const vars = getCSSVariables(defaultTheme);
    expect(vars['--theme-spacing-md']).toBe(defaultTheme.layout.spacing.md);
  });

  it('generates component variables for navbar', () => {
    const vars = getCSSVariables(defaultTheme);
    expect(vars['--theme-navbar-background']).toBe(defaultTheme.components.navbar.background);
  });

  it('converts camelCase keys to kebab-case', () => {
    const vars = getCSSVariables(defaultTheme);
    expect(vars['--theme-color-primary-dark']).toBe(defaultTheme.colors.primaryDark);
    expect(vars['--theme-color-text-primary']).toBe(defaultTheme.colors.textPrimary);
  });
});

describe('kebabCase utility', () => {
  it('converts camelCase to kebab-case', () => {
    expect(kebabCase('primaryDark')).toBe('primary-dark');
  });

  it('handles all-lowercase strings', () => {
    expect(kebabCase('primary')).toBe('primary');
  });

  it('handles multiple uppercase letters', () => {
    expect(kebabCase('textPrimaryDark')).toBe('text-primary-dark');
  });
});

// ---------------------------------------------------------------------------
// Accessibility Utilities
// ---------------------------------------------------------------------------
describe('hexToRgb', () => {
  it('parses a standard hex color', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses hex without hash', () => {
    expect(hexToRgb('00ff00')).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('returns null for invalid hex', () => {
    expect(hexToRgb('notacolor')).toBeNull();
  });
});

describe('getLuminance', () => {
  it('returns ~1 for white', () => {
    expect(getLuminance('#ffffff')).toBeCloseTo(1, 1);
  });

  it('returns 0 for black', () => {
    expect(getLuminance('#000000')).toBe(0);
  });

  it('returns 0 for invalid color', () => {
    expect(getLuminance('invalid')).toBe(0);
  });
});

describe('getContrastRatio', () => {
  it('returns 21 for black on white', () => {
    const ratio = getContrastRatio(1, 0);
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('returns 1 for same luminance', () => {
    expect(getContrastRatio(0.5, 0.5)).toBeCloseTo(1, 1);
  });

  it('is order-independent', () => {
    expect(getContrastRatio(0.2, 0.8)).toBe(getContrastRatio(0.8, 0.2));
  });
});

describe('validateAccessibility', () => {
  it('passes for the default theme', () => {
    const result = validateAccessibility(defaultTheme);
    expect(result.valid).toBe(true);
  });

  it('reports error when focus indicators are disabled', () => {
    const badTheme = stubTheme({
      accessibility: { highContrast: false, colorBlindMode: 'none', focusIndicators: false },
    });
    const result = validateAccessibility(badTheme);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Focus indicators'))).toBe(true);
  });

  it('reports error for low contrast text', () => {
    const lowContrast = stubTheme({
      colors: { ...defaultTheme.colors, background: '#777777', textPrimary: '#888888' },
    });
    const result = validateAccessibility(lowContrast);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('contrast ratio'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Theme Presets
// ---------------------------------------------------------------------------
describe('Theme presets', () => {
  it('default theme has expected metadata', () => {
    expect(defaultTheme.id).toBe('default');
    expect(defaultTheme.category).toBe('default');
    expect(defaultTheme.isPremium).toBe(false);
  });

  it('matrix theme has expected metadata', () => {
    expect(matrixTheme.id).toBe('matrix');
    expect(matrixTheme.category).toBe('special');
    expect(matrixTheme.isPremium).toBe(true);
  });

  it('matrix theme includes matrix config', () => {
    expect(matrixTheme.matrix).toBeDefined();
    expect(matrixTheme.matrix!.enabled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// themeAPI public interface
// ---------------------------------------------------------------------------
describe('themeAPI', () => {
  let themeAPI: Awaited<ReturnType<typeof freshRegistry>>['themeAPI'];

  beforeEach(async () => {
    ({ themeAPI } = await freshRegistry());
  });

  it('getTheme delegates correctly', () => {
    expect(themeAPI.getTheme('default')?.id).toBe('default');
  });

  it('getAllThemes returns array', () => {
    expect(Array.isArray(themeAPI.getAllThemes())).toBe(true);
  });

  it('getThemesByCategory filters', () => {
    const defaults = themeAPI.getThemesByCategory('default');
    defaults.forEach((t) => expect(t.category).toBe('default'));
  });

  it('registerTheme + getTheme round-trip', () => {
    const t = stubTheme({ id: 'api-test' });
    themeAPI.registerTheme(t);
    expect(themeAPI.getTheme('api-test')).toBeDefined();
  });

  it('validateTheme works through API', () => {
    expect(themeAPI.validateTheme(defaultTheme)).toBe(true);
    expect(themeAPI.validateTheme({})).toBe(false);
  });

  it('getCSSVariables works through API', () => {
    const vars = themeAPI.getCSSVariables(defaultTheme);
    expect(vars['--theme-color-primary']).toBe(defaultTheme.colors.primary);
  });

  it('exportTheme + importTheme round-trip', () => {
    const json = themeAPI.exportTheme('default');
    const imported = themeAPI.importTheme(json);
    expect(imported.id).toBe('default');
  });
});

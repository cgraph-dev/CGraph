import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createToggle, createToggles } from '../toggle';
import {
  toApiParams,
  fromApiParams,
  createSchemaMapper,
  createDebouncedSave,
} from '../schema-mapper';
import { createConfigPresets, classifyByRules } from '../presets';
import type { BaseStoreState, FieldSchema, ZustandSet } from '../types';

// =============================================================================
// Toggle Tests
// =============================================================================

describe('Toggle Utilities', () => {
  it('should toggle a boolean field from false to true', () => {
    const state = { isEnabled: false, isDirty: false };
    const set = vi.fn((updater: (s: typeof state) => Partial<typeof state>) => {
      Object.assign(state, updater(state));
    });

    const toggle = createToggle(set as unknown as ZustandSet, 'isEnabled');
    toggle();

    expect(set).toHaveBeenCalledOnce();
    expect(state.isEnabled).toBe(true);
    expect(state.isDirty).toBe(true);
  });

  it('should toggle a boolean field from true to false', () => {
    const state = { isEnabled: true, isDirty: false };
    const set = vi.fn((updater: (s: typeof state) => Partial<typeof state>) => {
      Object.assign(state, updater(state));
    });

    const toggle = createToggle(set as unknown as ZustandSet, 'isEnabled');
    toggle();

    expect(state.isEnabled).toBe(false);
    expect(state.isDirty).toBe(true);
  });

  it('should not mark dirty when markDirty is false', () => {
    const state = { isEnabled: false, isDirty: false };
    const set = vi.fn((updater: (s: typeof state) => Partial<typeof state>) => {
      Object.assign(state, updater(state));
    });

    const toggle = createToggle(set as unknown as ZustandSet, 'isEnabled', false);
    toggle();

    expect(state.isEnabled).toBe(true);
    expect(state.isDirty).toBe(false);
  });

  it('should create multiple named toggles from field list', () => {
    const set = vi.fn();
    const toggles = createToggles(set, ['showLevel', 'darkMode', 'compact']);

    expect(toggles).toHaveProperty('toggleShowLevel');
    expect(toggles).toHaveProperty('toggleDarkMode');
    expect(toggles).toHaveProperty('toggleCompact');
    expect(typeof toggles.toggleShowLevel).toBe('function');
    expect(typeof toggles.toggleDarkMode).toBe('function');
    expect(typeof toggles.toggleCompact).toBe('function');
  });

  it('should invoke set when calling a generated toggle', () => {
    const set = vi.fn();
    const toggles = createToggles(set, ['active']);
    toggles.toggleActive();
    expect(set).toHaveBeenCalledOnce();
  });
});

// =============================================================================
// Schema Mapper Tests
// =============================================================================

describe('Schema Mapper', () => {
  const schema: FieldSchema = {
    showLevel: 'show_level',
    maxBadges: 'max_badges',
    displayName: 'display_name',
  };

  describe('toApiParams', () => {
    it('should convert camelCase keys to snake_case using schema', () => {
      const result = toApiParams({ showLevel: true, maxBadges: 5 }, schema);
      expect(result).toEqual({ show_level: true, max_badges: 5 });
    });

    it('should fall back to automatic camelToSnake conversion for unmapped keys', () => {
      const result = toApiParams({ showLevel: true, fontSize: 14 }, schema);
      expect(result).toEqual({ show_level: true, font_size: 14 });
    });
  });

  describe('fromApiParams', () => {
    it('should convert snake_case API data to camelCase using schema', () => {
      const defaults = { showLevel: false, maxBadges: 0, displayName: '' };
      const apiData = { show_level: true, max_badges: 3, display_name: 'Test' };
      const result = fromApiParams(apiData, schema, defaults);
      expect(result).toEqual({ showLevel: true, maxBadges: 3, displayName: 'Test' });
    });

    it('should ignore API keys not present in defaults', () => {
      const defaults = { showLevel: false };
      const apiData = { show_level: true, unknown_field: 'ignored' };
      const result = fromApiParams(apiData, schema, defaults);
      expect(result).toEqual({ showLevel: true });
    });

    it('should use defaults for missing API keys', () => {
      const defaults = { showLevel: false, maxBadges: 10 };
      const apiData = { show_level: true };
      const result = fromApiParams(apiData, schema, defaults);
      expect(result).toEqual({ showLevel: true, maxBadges: 10 });
    });
  });

  describe('createSchemaMapper', () => {
    it('should create a mapper with toApi and fromApi methods', () => {
      const mapper = createSchemaMapper(schema);
      expect(mapper).toHaveProperty('toApi');
      expect(mapper).toHaveProperty('fromApi');
      expect(mapper).toHaveProperty('schema');
      expect(mapper.schema).toBe(schema);
    });

    it('should round-trip data through toApi and fromApi', () => {
      const mapper = createSchemaMapper(schema);
      const original = { showLevel: true, maxBadges: 5, displayName: 'Hello' };
      const apiForm = mapper.toApi(original);
      const restored = mapper.fromApi(apiForm, { showLevel: false, maxBadges: 0, displayName: '' });
      expect(restored).toEqual(original);
    });
  });
});

// =============================================================================
// Debounced Save Tests
// =============================================================================

describe('createDebouncedSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should set isSaving immediately and call saveFn after delay', async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn();
    const state = { isDirty: true, isSaving: false, error: null } as BaseStoreState;

    const debouncedSave = createDebouncedSave(saveFn, { delay: 300 });
    debouncedSave(state, set);

    // isSaving should be set immediately
    expect(set).toHaveBeenCalledWith({ isSaving: true, error: null });

    // saveFn not called yet
    expect(saveFn).not.toHaveBeenCalled();

    // Advance past delay
    await vi.advanceTimersByTimeAsync(300);

    expect(saveFn).toHaveBeenCalledWith(state, set);
  });

  it('should set error on save failure', async () => {
    const saveFn = vi.fn().mockRejectedValue(new Error('Network error'));
    const set = vi.fn();
    const state = {} as BaseStoreState;

    const debouncedSave = createDebouncedSave(saveFn, { delay: 100 });
    debouncedSave(state, set);

    await vi.advanceTimersByTimeAsync(100);

    expect(set).toHaveBeenCalledWith({ isSaving: false, error: 'Network error' });
  });
});

// =============================================================================
// Preset Tests
// =============================================================================

describe('Preset Utilities', () => {
  describe('createConfigPresets', () => {
    it('should create presets by merging base with overrides', () => {
      const base = { layout: 'default', showLevel: true, maxBadges: 5 };
      const presets = createConfigPresets(base, {
        minimal: { layout: 'minimal', showLevel: false },
        compact: { layout: 'compact', maxBadges: 3 },
      });

      expect(presets.minimal).toEqual({ layout: 'minimal', showLevel: false, maxBadges: 5 });
      expect(presets.compact).toEqual({ layout: 'compact', showLevel: true, maxBadges: 3 });
    });

    it('should return empty object for empty overrides map', () => {
      const presets = createConfigPresets({ x: 1 }, {});
      expect(presets).toEqual({});
    });
  });

  describe('classifyByRules', () => {
    it('should group array items by matching rules', () => {
      const rules = [
        { name: 'even', test: (n: number) => n % 2 === 0 },
        { name: 'odd', test: (n: number) => n % 2 !== 0 },
      ];
      const result = classifyByRules([1, 2, 3, 4, 5], rules);
      expect(result.even).toEqual([2, 4]);
      expect(result.odd).toEqual([1, 3, 5]);
      expect(result.other).toEqual([]);
    });

    it('should put unmatched items in "other"', () => {
      const rules = [{ name: 'positive', test: (n: number) => n > 0 }];
      const result = classifyByRules([1, -1, 2, -2], rules);
      expect(result.positive).toEqual([1, 2]);
      expect(result.other).toEqual([-1, -2]);
    });

    it('should classify a single item and return a category string', () => {
      const rules = [
        { category: 'fruit', test: (s: string) => s === 'apple' },
        { category: 'veggie', test: (s: string) => s === 'carrot' },
      ];
      expect(classifyByRules('apple', rules, 'unknown')).toBe('fruit');
      expect(classifyByRules('carrot', rules, 'unknown')).toBe('veggie');
    });

    it('should return defaultCategory for single item when no rule matches', () => {
      const rules = [{ category: 'fruit', test: (s: string) => s === 'apple' }];
      expect(classifyByRules('rock', rules, 'misc')).toBe('misc');
    });
  });
});

/**
 * Preset & Classification Utilities
 *
 * Provides preset generation and rule-based classification for store configs.
 *
 * @version 1.0.0
 * @since v0.9.7
 */

// =============================================================================
// PRESET UTILITIES
// =============================================================================

export interface PresetConfig<T> {
  id: string;
  name: string;
  category?: string;
  config: T;
}

/**
 * Creates preset configurations from a base config and a map of overrides.
 * Each key in the overrides becomes a preset ID, and its value is merged with the base.
 *
 * @example
 * const presets = createConfigPresets(baseConfig, {
 *   minimal: { layout: 'minimal', showLevel: false },
 *   compact: { layout: 'compact', maxBadges: 3 },
 * });
 * // Result: { minimal: { ...baseConfig, layout: 'minimal', showLevel: false }, ... }
 */
export function createConfigPresets<T extends Record<string, any>>(
  baseConfig: T,
  overridesMap: Record<string, Partial<T>>
): Record<string, T> {
  const presets: Record<string, T> = {};

  for (const [id, overrides] of Object.entries(overridesMap)) {
    presets[id] = { ...baseConfig, ...overrides };
  }

  return presets;
}

interface ClassifyRule<T> {
  name?: string;
  category?: string;
  test: (item: T) => boolean;
}

/**
 * Classifies items by rules.
 *
 * - If `items` is an array, returns a Record grouping items by matched rule name/category.
 * - If `items` is a single item and `defaultCategory` is provided, returns the matched category string.
 *
 * @example
 * // Array classification
 * const groups = classifyByRules(['apple', 'banana'], [{ name: 'fruit', test: () => true }]);
 * // => { fruit: ['apple', 'banana'], other: [] }
 *
 * @example
 * // Single item classification
 * const category = classifyByRules('apple', [{ category: 'fruit', test: () => true }], 'unknown');
 * // => 'fruit'
 */

// Function overloads for single item vs array classification
// These are valid TypeScript function overloads, not actual redeclarations
/* eslint-disable no-redeclare */
export function classifyByRules<T>(
  items: T,
  rules: Array<ClassifyRule<T>>,
  defaultCategory: string
): string;
export function classifyByRules<T>(
  items: T[],
  rules: Array<ClassifyRule<T>>,
  defaultCategory?: string
): Record<string, T[]>;
/**
 * unknown for the store-helpers module.
 */
/**
 * classify By Rules for the store-helpers module.
 *
 * @param items - Array of items.
 * @param rules - The rules.
 * @param defaultCategory - The default category.
 */
export function classifyByRules<T>(
  items: T | T[],
  rules: Array<ClassifyRule<T>>,
  defaultCategory?: string
): Record<string, T[]> | string {
  /* eslint-enable no-redeclare */

  // Single item classification (returns string)
  if (!Array.isArray(items) && defaultCategory !== undefined) {
    for (const rule of rules) {
      if (rule.test(items)) {
        return rule.category ?? rule.name ?? defaultCategory;
      }
    }
    return defaultCategory;
  }

  // Array classification (returns grouped results)
  const itemsArray = Array.isArray(items) ? items : [items];
  const result: Record<string, T[]> = {};

  for (const rule of rules) {
    const key = rule.name ?? rule.category ?? 'unknown';
    result[key] = [];
  }
  result['other'] = [];

  for (const item of itemsArray) {
    let matched = false;
    for (const rule of rules) {
      if (rule.test(item)) {
        const key = rule.name ?? rule.category ?? 'unknown';
        result[key]?.push(item);
        matched = true;
        break;
      }
    }
    if (!matched) {
      result['other']?.push(item);
    }
  }

  return result;
}

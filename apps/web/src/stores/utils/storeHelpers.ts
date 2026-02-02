/**
 * Shared Store Utilities
 *
 * Provides common patterns for Zustand stores to reduce code duplication:
 * - Toggle action factory
 * - Schema mapper for API serialization (camelCase <-> snake_case)
 * - Debounced save functionality
 * - Preset generation utilities
 *
 * @version 1.0.0
 * @since v0.9.7
 */

// =============================================================================
// TYPES
// =============================================================================

// Use permissive types to work with Zustand's internal set/get signatures

export interface FieldSchema {
  [camelCase: string]: string; // camelCase -> snake_case mapping
}

// =============================================================================
// TOGGLE FACTORY
// =============================================================================

/**
 * Creates a toggle function for boolean fields in a store.
 * Works with Zustand's set function directly.
 *
 * @example
 * const store = create<MyState>((set) => ({
 *   isEnabled: false,
 *   toggleEnabled: createToggle(set, 'isEnabled'),
 * }));
 */
export function createToggle(
  set: (partial: any) => void,
  field: string,
  markDirty = true
): () => void {
  return () =>
    set((state: any) => ({
      [field]: !state[field],
      ...(markDirty ? { isDirty: true } : {}),
    }));
}

/**
 * Creates multiple toggle functions from a list of field names.
 */
export function createToggles(
  set: (partial: any) => void,
  fields: string[],
  markDirty = true
): Record<string, () => void> {
  const toggles: Record<string, () => void> = {};
  for (const field of fields) {
    toggles[`toggle${field.charAt(0).toUpperCase()}${field.slice(1)}`] = createToggle(
      set,
      field,
      markDirty
    );
  }
  return toggles;
}

// =============================================================================
// SCHEMA MAPPER (camelCase <-> snake_case)
// =============================================================================

/**
 * Converts camelCase object keys to snake_case for API calls.
 */
export function toApiParams(
  data: Record<string, any>,
  schema: FieldSchema
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [camelKey, value] of Object.entries(data)) {
    const snakeKey = schema[camelKey] || camelToSnake(camelKey);
    result[snakeKey] = value;
  }

  return result;
}

/**
 * Converts snake_case API response to camelCase for store state.
 */
export function fromApiParams<T extends Record<string, any>>(
  apiData: Record<string, unknown>,
  schema: FieldSchema,
  defaults: T
): T {
  const result = { ...defaults };
  const reverseSchema = Object.fromEntries(
    Object.entries(schema).map(([camel, snake]) => [snake, camel])
  );

  for (const [snakeKey, value] of Object.entries(apiData)) {
    const camelKey = reverseSchema[snakeKey] || snakeToCamel(snakeKey);
    if (camelKey in defaults) {
      (result as Record<string, any>)[camelKey] = value;
    }
  }

  return result;
}

/**
 * Creates a schema mapper with both toApi and fromApi methods.
 */
export function createSchemaMapper<T extends Record<string, any> = Record<string, any>>(
  schema: FieldSchema
) {
  return {
    toApi: (updates: Partial<T>) => toApiParams(updates as Record<string, any>, schema),
    fromApi: (apiData: Record<string, unknown>, defaults: T) =>
      fromApiParams(apiData, schema, defaults),
    schema,
  };
}

// Helper functions for case conversion
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

// =============================================================================
// DEBOUNCED SAVE
// =============================================================================

const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Creates a debounced save function that batches updates to reduce API calls.
 *
 * @param saveFn - The async function to call with (state, set) when the timer fires
 * @param options - Configuration options (delay in ms)
 * @returns A debounced function that accepts (state, set) arguments
 *
 * @example
 * const debouncedSave = createDebouncedSave(
 *   async (state, set) => {
 *     const payload = mapper.toApi(state);
 *     await api.put('/api/v1/me/customizations', payload);
 *   },
 *   { delay: 1000 }
 * );
 */
export function createDebouncedSave(
  saveFn: (state: any, set: (partial: any) => void) => Promise<void>,
  options: { delay?: number } = {}
) {
  const { delay = 500 } = options;
  const key = `save_${Date.now()}_${Math.random()}`;

  return (state: any, set: (partial: any) => void): void => {
    const existingTimer = saveTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    set({ isSaving: true, error: null });

    const timer = setTimeout(async () => {
      saveTimers.delete(key);
      try {
        await saveFn(state, set);
        set({ isSaving: false });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Save failed';
        set({ isSaving: false, error: errorMessage });
      }
    }, delay);

    saveTimers.set(key, timer);
  };
}

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

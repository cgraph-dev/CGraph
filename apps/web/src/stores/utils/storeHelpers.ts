/**
 * Store Helper Utilities
 *
 * Shared utilities for Zustand stores to reduce boilerplate and improve consistency.
 * Consolidates common patterns used across customization, theme, and other stores.
 *
 * @version 1.0.0
 * @since v0.9.7
 */

import { debounce } from '@cgraph/utils';

// Re-export debounce for stores that need it
export { debounce };

// =============================================================================
// TOGGLE ACTION FACTORY
// =============================================================================

type SetStateFn<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void;

/**
 * Creates a toggle action for boolean fields.
 * Reduces boilerplate for stores with many toggle actions.
 *
 * @example
 * const store = create((set) => ({
 *   particlesEnabled: true,
 *   isDirty: false,
 *   toggleParticles: createToggle(set, 'particlesEnabled'),
 * }));
 */
export function createToggle<T extends Record<string, unknown>>(
  set: SetStateFn<T>,
  field: keyof T,
  markDirty = true
): () => void {
  return () =>
    set(
      (state) =>
        ({
          [field]: !state[field],
          ...(markDirty ? { isDirty: true } : {}),
        }) as Partial<T>
    );
}

/**
 * Creates multiple toggle actions at once.
 *
 * @example
 * const toggles = createToggles(set, ['particles', 'glow', 'blur']);
 * // Returns: { toggleParticles: () => void, toggleGlow: () => void, toggleBlur: () => void }
 */
export function createToggles<T extends Record<string, unknown>>(
  set: SetStateFn<T>,
  fields: (keyof T)[],
  markDirty = true
): Record<string, () => void> {
  return fields.reduce(
    (acc, field) => {
      const actionName = `toggle${String(field).charAt(0).toUpperCase()}${String(field).slice(1)}`;
      acc[actionName] = createToggle(set, field, markDirty);
      return acc;
    },
    {} as Record<string, () => void>
  );
}

// =============================================================================
// SETTER ACTION FACTORY
// =============================================================================

/**
 * Creates a setter action for a specific field.
 *
 * @example
 * const store = create((set) => ({
 *   theme: 'emerald',
 *   setTheme: createSetter(set, 'theme'),
 * }));
 */
export function createSetter<T extends Record<string, unknown>, K extends keyof T>(
  set: SetStateFn<T>,
  field: K,
  markDirty = true
): (value: T[K]) => void {
  return (value: T[K]) =>
    set({
      [field]: value,
      ...(markDirty ? { isDirty: true } : {}),
    } as Partial<T>);
}

// =============================================================================
// SCHEMA MAPPER (camelCase <-> snake_case)
// =============================================================================

/**
 * Field mapping schema for API serialization.
 * Maps camelCase (client) to snake_case (API).
 */
export type FieldSchema = Record<string, string>;

/**
 * Converts an object from camelCase to snake_case using a schema.
 * Only includes fields that are defined and not undefined.
 *
 * @example
 * const schema = { avatarBorderId: 'avatar_border_id', themePreset: 'theme_preset' };
 * const result = toApiParams({ avatarBorderId: '123', themePreset: 'emerald' }, schema);
 * // { avatar_border_id: '123', theme_preset: 'emerald' }
 */
export function toApiParams<T extends Record<string, unknown>>(
  updates: Partial<T>,
  schema: FieldSchema
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [clientKey, apiKey] of Object.entries(schema)) {
    const value = updates[clientKey as keyof T];
    if (value !== undefined) {
      result[apiKey] = value;
    }
  }

  return result;
}

/**
 * Converts an object from snake_case to camelCase using a schema.
 * Applies defaults for missing values.
 *
 * @example
 * const schema = { avatarBorderId: 'avatar_border_id' };
 * const defaults = { avatarBorderId: null };
 * const result = fromApiParams({ avatar_border_id: '123' }, schema, defaults);
 * // { avatarBorderId: '123' }
 */
export function fromApiParams<T extends Record<string, unknown>>(
  apiData: Record<string, unknown>,
  schema: FieldSchema,
  defaults: T
): T {
  const result = { ...defaults };

  for (const [clientKey, apiKey] of Object.entries(schema)) {
    const value = apiData[apiKey];
    if (value !== undefined && value !== null) {
      (result as Record<string, unknown>)[clientKey] = value;
    } else if (value === null) {
      // Preserve explicit nulls from API
      (result as Record<string, unknown>)[clientKey] = null;
    }
  }

  return result;
}

/**
 * Creates a bidirectional schema mapper.
 *
 * @example
 * const mapper = createSchemaMapper({
 *   avatarBorderId: 'avatar_border_id',
 *   themePreset: 'theme_preset',
 * });
 *
 * const apiParams = mapper.toApi({ avatarBorderId: '123' });
 * const clientData = mapper.fromApi({ avatar_border_id: '123' }, defaults);
 */
export function createSchemaMapper<T extends Record<string, unknown>>(schema: FieldSchema) {
  return {
    toApi: (updates: Partial<T>) => toApiParams(updates, schema),
    fromApi: (apiData: Record<string, unknown>, defaults: T) =>
      fromApiParams(apiData, schema, defaults),
    schema,
  };
}

// =============================================================================
// DEBOUNCED SAVE HELPER
// =============================================================================

/**
 * Creates a debounced save function with loading state management.
 * Prevents duplicate saves and handles errors gracefully.
 *
 * @example
 * const debouncedSave = createDebouncedSave(
 *   async (state) => {
 *     await api.put('/customizations', mapper.toApi(state));
 *   },
 *   { delay: 1000 }
 * );
 */
export function createDebouncedSave<T>(
  saveFn: (state: T, set: SetStateFn<unknown>) => Promise<void>,
  options: { delay?: number } = {}
): (state: T, set: SetStateFn<unknown>) => void {
  const { delay = 1000 } = options;
  let saveInProgress = false;

  return debounce(async (state: T, set: SetStateFn<unknown>) => {
    if (saveInProgress) return;
    saveInProgress = true;

    set({ isSaving: true, error: null });

    try {
      await saveFn(state, set);
      set({ isSaving: false, isDirty: false, lastSyncedAt: Date.now() });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save';
      console.error('Save failed:', error);
      set({ isSaving: false, error: message });
    } finally {
      saveInProgress = false;
    }
  }, delay);
}

// =============================================================================
// CATEGORY CLASSIFIER
// =============================================================================

type CategoryRule = { test: (key: string) => boolean; category: string };

/**
 * Classifies a key into a category based on rules.
 * Replaces nested ternary chains with readable rule-based matching.
 *
 * @example
 * const rules = [
 *   { test: (k) => k.includes('dark'), category: 'Dark' },
 *   { test: (k) => k.includes('light'), category: 'Light' },
 * ];
 * const category = classifyByRules('minimalist-dark', rules, 'General');
 * // 'Dark'
 */
export function classifyByRules(
  key: string,
  rules: CategoryRule[],
  defaultCategory = 'General'
): string {
  const match = rules.find((rule) => rule.test(key));
  return match?.category ?? defaultCategory;
}

// =============================================================================
// PRESET CONFIG HELPER
// =============================================================================

/**
 * Creates a set of configs by merging base config with overrides.
 * Reduces repetition when defining preset configurations.
 *
 * @example
 * const base = { showLevel: true, showXp: true, showKarma: true };
 * const configs = createConfigPresets(base, {
 *   minimal: { showLevel: false, showXp: false, showKarma: false },
 *   detailed: {}, // Uses all base values
 * });
 */
export function createConfigPresets<T extends Record<string, unknown>>(
  base: T,
  overrides: Record<string, Partial<T>>
): Record<string, T> {
  return Object.entries(overrides).reduce(
    (acc, [key, override]) => {
      acc[key] = { ...base, ...override };
      return acc;
    },
    {} as Record<string, T>
  );
}

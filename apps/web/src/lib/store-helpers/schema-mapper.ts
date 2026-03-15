/**
 * Schema Mapper (camelCase <-> snake_case)
 *
 * Provides conversion utilities between camelCase store keys and
 * snake_case API parameters, plus debounced save functionality.
 *
 * @version 1.0.0
 * @since v0.9.7
 */

import type { BaseStoreState, FieldSchema, ZustandSet } from './types';

// =============================================================================
// SCHEMA MAPPER (camelCase <-> snake_case)
// =============================================================================

/**
 * Converts camelCase object keys to snake_case for API calls.
 */
export function toApiParams<T extends Record<string, unknown>>(
  data: T,
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
export function fromApiParams<T extends Record<string, unknown>>(
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
       
      (result as Record<string, unknown>)[camelKey] = value; // safe downcast – T extends Record<string, unknown>
    }
  }

  return result;
}

/**
 * Creates a schema mapper with both toApi and fromApi methods.
 */
export function createSchemaMapper<T = Record<string, unknown>>(schema: FieldSchema) {
  return {
     
    toApi: (updates: Partial<T>) => toApiParams(updates as Record<string, unknown>, schema), // safe downcast – Partial<T> to Record
    fromApi: (apiData: Record<string, unknown>, defaults: T) =>
       
      fromApiParams(apiData, schema, defaults as Record<string, unknown>) as T, // safe downcast – generic boundary
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
export function createDebouncedSave<T extends BaseStoreState>(
  saveFn: (state: T, set: ZustandSet<T>) => Promise<void>,
  options: { delay?: number } = {}
) {
  const { delay = 500 } = options;
  const key = `save_${Date.now()}_${Math.random()}`;

  return (state: T, set: ZustandSet<T>): void => {
    const existingTimer = saveTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

     
    set({ isSaving: true, error: null } as Partial<T>); // safe downcast – Zustand set requires Partial<T>

    const timer = setTimeout(async () => {
      saveTimers.delete(key);
      try {
        await saveFn(state, set);

         
        set({ isSaving: false } as Partial<T>); // safe downcast – Zustand set requires Partial<T>
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Save failed';

         
        set({ isSaving: false, error: errorMessage } as Partial<T>); // safe downcast – Zustand set requires Partial<T>
      }
    }, delay);

    saveTimers.set(key, timer);
  };
}

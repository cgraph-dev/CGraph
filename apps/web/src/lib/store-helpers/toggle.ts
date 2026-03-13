/**
 * Toggle Factory
 *
 * Creates toggle functions for boolean fields in Zustand stores.
 *
 * @version 1.0.0
 * @since v0.9.7
 */

import type { BaseStoreState, ZustandSet } from './types';

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
export function createToggle<T extends BaseStoreState>(
  set: ZustandSet<T>,
  field: keyof T & string,
  markDirty = true
): () => void {
  return () =>
    set(
      (state: T) =>
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        ({
          [field]: !state[field],
          ...(markDirty ? { isDirty: true } : {}),
        }) as Partial<T> // safe downcast – structural boundary
    );
}

/**
 * Creates multiple toggle functions from a list of field names.
 */
export function createToggles(
  set: ZustandSet,
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

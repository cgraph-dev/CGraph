/**
 * Shared Store Types
 *
 * Common type definitions for Zustand store utilities.
 *
 * @version 1.0.0
 * @since v0.9.7
 */

// =============================================================================
// TYPES
// =============================================================================

// Generic types for Zustand store compatibility
// Using loose types to work with Zustand's flexible set/get signatures

/** Base state type with common fields */
export interface BaseStoreState {
  isDirty?: boolean;
  isSaving?: boolean;
  error?: string | null;
}

/** Zustand-compatible set function type */
export type ZustandSet<T = Record<string, unknown>> = (
  partial: Partial<T> | T | ((state: T) => Partial<T> | T),
  replace?: boolean | undefined
) => void;

export interface FieldSchema {
  [camelCase: string]: string; // camelCase -> snake_case mapping
}

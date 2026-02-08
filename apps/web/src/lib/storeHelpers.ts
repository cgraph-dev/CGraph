/**
 * Shared Store Utilities
 *
 * Re-exports from store-helpers/ submodules.
 * Provides common patterns for Zustand stores to reduce code duplication.
 *
 * @version 1.0.0
 * @since v0.9.7
 */

export type { BaseStoreState, ZustandSet, FieldSchema } from './store-helpers/types';

export { createToggle, createToggles } from './store-helpers/toggle';

export {
  toApiParams,
  fromApiParams,
  createSchemaMapper,
  createDebouncedSave,
} from './store-helpers/schema-mapper';

export type { PresetConfig } from './store-helpers/presets';

export { createConfigPresets, classifyByRules } from './store-helpers/presets';

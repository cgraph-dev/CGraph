/**
 * @cgraph/state
 * 
 * Shared state management for CGraph platforms.
 * Contains cross-platform Zustand stores and state utilities.
 */

// Store slices
export * from './stores/createAuthSlice';
export * from './stores/createUserSlice';
export * from './stores/createGamificationSlice';
export * from './stores/createPreferencesSlice';

// Store utilities
export * from './utils/createStore';
export * from './utils/persist';
export * from './utils/selectors';

// Types
export type * from './types';

/**
 * Shared Module - Single Export Point
 *
 * Truly shared code that's used across multiple feature modules.
 * Import from '@/shared' for module-based architecture.
 *
 * @module @shared
 */

// Components (UI, Layout, Feedback)
export * from './components';

// Hooks (useDebounce, useMediaQuery, etc.)
export * from './hooks';

// Utils (cn, formatTimeAgo, error display, URL security)
export * from './utils';

// Types are exported separately to avoid conflicts
// Import types from '@/shared/types' directly

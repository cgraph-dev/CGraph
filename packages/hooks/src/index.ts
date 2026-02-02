/**
 * @cgraph/hooks
 *
 * Platform-agnostic React hooks for CGraph platform.
 * These hooks work on both web and mobile (React Native).
 *
 * @module @cgraph/hooks
 */

// State & Effects
export { useDebounce } from './useDebounce';
export { useThrottle } from './useThrottle';
export { usePrevious } from './usePrevious';

// Async operations
export { useAsync, type AsyncState } from './useAsync';

// UI utilities
export { useClickOutside } from './useClickOutside';
export { useKeyPress } from './useKeyPress';
export { useMediaQuery } from './useMediaQuery';
export { useScrollLock } from './useScrollLock';

// Data management
export { useLocalStorage } from './useLocalStorage';
export { useSessionStorage } from './useSessionStorage';

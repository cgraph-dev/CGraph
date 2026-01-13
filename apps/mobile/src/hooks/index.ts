/**
 * Mobile Hooks Index
 * 
 * Central export for all React Native hooks.
 */

// Core utility hooks
export { useDebounce, useDebouncedCallback } from './useDebounce';
export { useCopyToClipboard, useClipboardRead } from './useCopyToClipboard';
export { useAsyncStorage, useLocalStorage } from './useAsyncStorage';
export { useWindowSize, useScreenSize, useIsLandscape, useIsTablet } from './useWindowSize';
export { useHaptics, useHapticPress } from './useHaptics';
export type { HapticStyle } from './useHaptics';
export { useInterval, useTimeout, useIsMounted, usePrevious } from './useInterval';

// Feature-specific hooks
export { useGamification } from './useGamification';
export { useFriendPresence } from './useFriendPresence';

// Feature module hooks (re-exports)
export * from '../features/messaging/hooks';
export * from '../features/gamification/hooks';
export * from '../features/premium/hooks';
export * from '../features/groups/hooks';
export * from '../features/auth/hooks';

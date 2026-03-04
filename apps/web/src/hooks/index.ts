/**
 * Shared React hooks for the CGraph web application.
 *
 * Only truly shared, module-agnostic hooks belong here.
 * Module-specific hooks live in their respective modules.
 */

export { useMediaQuery, usePrefersReducedMotion } from './useMediaQuery';
export { useLocalStorage } from './useLocalStorage';
export { useDebounce, useDebouncedCallback, useThrottledCallback } from './useDebounce';
export { useClickOutside } from './useClickOutside';
export { useWindowSize } from './useWindowSize';
export { useCopyToClipboard } from './useCopyToClipboard';
export { useToast, type ToastOptions, type UseToastReturn } from './useToast';
export { useAdaptiveMotion } from './useAdaptiveMotion';
export { useNotification } from './useNotification';
export { useAdaptiveInterval, type AdaptiveIntervalOptions } from './useAdaptiveInterval';
export { useMotionSafe, type MotionSafeResult } from './useMotionSafe';

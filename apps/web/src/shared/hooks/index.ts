/**
 * Shared Hooks - Single Export Point
 *
 * Re-exports commonly used hooks from @/hooks.
 * Import from '@/shared/hooks' for module-based architecture.
 *
 * @module @shared/hooks
 */

// Utility hooks
export { useMediaQuery, usePrefersReducedMotion } from '@/hooks/useMediaQuery';

export { useLocalStorage } from '@/hooks/useLocalStorage';
export { useDebounce, useDebouncedCallback, useThrottledCallback } from '@/hooks/useDebounce';

export { useClickOutside } from '@/hooks/useClickOutside';
export { useWindowSize } from '@/hooks/useWindowSize';
export { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

// Presence hooks
export { usePresence, useUserOnline } from '@/modules/social/hooks/usePresence';

// Toast hooks
export { useToast, type ToastOptions, type UseToastReturn } from '@/hooks/useToast';

// Notification hooks
export { useNotification } from '@/hooks/useNotification';

// Subscription hooks
export { useSubscription } from '@/modules/premium/hooks/useSubscription';

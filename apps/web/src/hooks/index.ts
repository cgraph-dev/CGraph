/**
 * Custom React hooks for the CGraph web application.
 *
 * These hooks provide reusable stateful logic for common patterns
 * like media queries, local storage, debouncing, and more.
 */

export { useMediaQuery } from './useMediaQuery';
export { useLocalStorage } from './useLocalStorage';
export { useDebounce } from './useDebounce';
export { useClickOutside } from './useClickOutside';
export { useWindowSize } from './useWindowSize';
export { useCopyToClipboard } from './useCopyToClipboard';
export { usePresence, useUserOnline } from './usePresence';
export { useToast, type ToastOptions, type UseToastReturn } from './useToast';
export { useForumSocket, type UseForumSocketOptions, type UseForumSocketReturn } from './useForumSocket';
export { useThreadSocket, type UseThreadSocketOptions, type UseThreadSocketReturn } from './useThreadSocket';

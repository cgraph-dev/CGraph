/**
 * Custom React hooks for the CGraph web application.
 *
 * These hooks provide reusable stateful logic for common patterns
 * like media queries, local storage, debouncing, and more.
 */

export { useMediaQuery } from './useMediaQuery';
export { useLocalStorage } from './useLocalStorage';
export { useDebounce, useDebouncedCallback, useThrottledCallback } from './useDebounce';
export { useClickOutside } from './useClickOutside';
export { useWindowSize } from './useWindowSize';
export { useCopyToClipboard } from './useCopyToClipboard';
export { usePresence, useUserOnline } from './usePresence';
export { usePrefersReducedMotion } from './useMediaQuery';
export { useToast, type ToastOptions, type UseToastReturn } from './useToast';
export {
  useForumSocket,
  type UseForumSocketOptions,
  type UseForumSocketReturn,
} from './useForumSocket';
export {
  useThreadSocket,
  type UseThreadSocketOptions,
  type UseThreadSocketReturn,
} from './useThreadSocket';

// Conversation hooks
export {
  useConversationState,
  type ConversationState,
  type SendMessageOptions,
} from './useConversationState';

export {
  useMessageActions,
  type MessageActionsState,
  type MessageActionsHandlers,
  type UseMessageActionsReturn,
} from './useMessageActions';

export {
  useScheduleMessage,
  type ScheduleMessageState,
  type ScheduleMessageHandlers,
} from './useScheduleMessage';

export { useCallModals, type CallModalState, type CallModalHandlers } from './useCallModals';

// Conversation UI hooks
export { useConversationUI } from './useConversationUI';
export { useE2EEError } from './useE2EEError';
export { useMessageInputState } from './useMessageInputState';

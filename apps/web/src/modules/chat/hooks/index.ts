/**
 * Chat Module Hooks
 *
 * All chat-related hooks consolidated here.
 * This replaces hooks scattered in hooks/ directory.
 */

// Conversation hooks
export { useConversationActions } from './useConversationActions';
export { useConversationState } from './useConversationState';
export { useConversationUI } from './useConversationUI';

// Message hooks
export { useMessageActions } from './useMessageActions';
export { useMessageInputState } from './useMessageInputState';
export { useScheduleMessage } from './useScheduleMessage';
export { useScheduleMessageModal } from './useScheduleMessageModal';
export { useScheduledMessages } from './useScheduledMessages';

// E2EE hooks
export { useE2EEError } from './useE2EEError';

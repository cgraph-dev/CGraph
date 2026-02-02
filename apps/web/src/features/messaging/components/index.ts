/**
 * Messaging Components
 *
 * Re-exports messaging components from the module structure.
 * This file maintains backward compatibility for existing imports.
 *
 * @deprecated Import from '@/modules/chat/components' instead
 */

// Re-export from modules location
export {
  // Chat components
  MessageReactions,
  RichMediaEmbed,
  // Animation components
  AnimatedMessageWrapper,
  AnimatedReactionBubble,
  // Core message components
  MessageBubble,
  MessageList,
  MessageInputArea,
  MessageSearch,
  FileMessage,
  GifMessage,
  ReplyPreview,
  ScheduleMessageModal,
  ScheduledMessagesList,
  // Conversation components
  ConversationHeader,
  ConversationInput,
  ConversationModals,
  TypingIndicator,
  AmbientBackground,
} from '@/modules/chat/components';

// Re-export types
export type {
  MessageBubbleProps,
  UIPreferences,
  MessageInputAreaProps,
  ReplyPreviewProps,
  ConversationModalsProps,
  AmbientBackgroundProps,
} from '@/modules/chat/components';

// Components still in old location (until migrated)
export { default as StickerPicker } from '@/components/chat/StickerPicker';
export { default as E2EEConnectionTester } from '@/components/chat/E2EEConnectionTester';

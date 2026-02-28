/**
 * Chat Module Components
 *
 * All chat, conversation, and messaging components consolidated here.
 * This replaces the scattered components in:
 * - components/chat/
 * - components/conversation/
 * - components/messages/
 * - components/messaging/
 */

// ============================================
// Core Message Components
// ============================================

// Message display
export { MessageBubble, type MessageBubbleProps, type UIPreferences } from './message-bubble';
export { MessageList } from './message-list';
export { MessageInputArea, type MessageInputAreaProps } from './message-input-area';
export { MessageSearch } from './message-search';
export { default as MessageReactions } from './message-reactions';

// Message content types
export { FileMessage } from './file-message';
export { GifMessage } from './gif-message';
export { default as RichMediaEmbed } from './rich-media-embed';

// Reply and scheduling
export { ReplyPreview, type ReplyPreviewProps } from './reply-preview';
export { ScheduleMessageModal } from './schedule-message-modal';
export { ScheduledMessagesList } from './scheduled-messages-list';

// ============================================
// Conversation Components
// ============================================

export { ConversationHeader } from './conversation-header';
export { ConversationInput } from './conversation-input';
export { ConversationModals, type ConversationModalsProps } from './conversation-modals';
export { SafetyNumberDialog } from './safety-number-dialog';
export { TypingIndicator } from './typing-indicator';

// ============================================
// Animation Components
// ============================================

export { AnimatedMessageWrapper } from './animated-message-wrapper';
export { AnimatedReactionBubble } from './animated-reaction-bubble';
export { AmbientBackground, type AmbientBackgroundProps } from './ambient-background';

// ============================================
// UI Customization
// ============================================

export { UISettingsPanel, type UISettingsPanelProps } from './ui-settings-panel';
export { default as ChatEffects } from './chat-effects';
export { default as ChatInfoPanel } from './chat-info-panel';

// ============================================
// Pickers
// ============================================

export { EmojiPicker } from './emoji-picker';
export { GifPicker, type GifResult } from './gif-picker';
export {
  StickerPicker,
  StickerMessage,
  StickerButton,
  type StickerPickerProps,
  type StickerMessageProps,
  type StickerButtonProps,
} from './sticker-picker';

// ============================================
// E2EE Components
// ============================================

export { default as E2EEConnectionTester } from './e2-ee-connection-tester';
export { E2EEErrorModal } from './e2-ee-error-modal';

// ============================================
// Forward Modal
// ============================================

export { ForwardMessageModal } from './forward-message-modal';

// ============================================
// Messaging Components
// ============================================

export { ConversationList } from './conversation-list';
export { MessageInput } from './message-input';

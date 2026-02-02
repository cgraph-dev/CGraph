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
export { MessageBubble, type MessageBubbleProps, type UIPreferences } from './MessageBubble';
export { MessageList } from './MessageList';
export { MessageInputArea, type MessageInputAreaProps } from './MessageInputArea';
export { MessageSearch } from './MessageSearch';
export { default as MessageReactions } from './MessageReactions';

// Message content types
export { FileMessage } from './FileMessage';
export { GifMessage } from './GifMessage';
export { default as RichMediaEmbed } from './RichMediaEmbed';

// Reply and scheduling
export { ReplyPreview, type ReplyPreviewProps } from './ReplyPreview';
export { ScheduleMessageModal } from './ScheduleMessageModal';
export { ScheduledMessagesList } from './ScheduledMessagesList';

// ============================================
// Conversation Components
// ============================================

export { ConversationHeader } from './ConversationHeader';
export { ConversationInput } from './ConversationInput';
export { ConversationModals, type ConversationModalsProps } from './ConversationModals';
export { TypingIndicator } from './TypingIndicator';

// ============================================
// Animation Components
// ============================================

export { AnimatedMessageWrapper } from './AnimatedMessageWrapper';
export { AnimatedReactionBubble } from './AnimatedReactionBubble';
export { AmbientBackground, type AmbientBackgroundProps } from './AmbientBackground';

// ============================================
// UI Customization
// ============================================

export { UISettingsPanel, type UISettingsPanelProps } from './UISettingsPanel';
export { default as ChatEffects } from './ChatEffects';
export { default as ChatInfoPanel } from './ChatInfoPanel';

// ============================================
// Pickers
// ============================================

export { EmojiPicker } from './EmojiPicker';
export { GifPicker, type GifResult } from './GifPicker';
export {
  StickerPicker,
  StickerMessage,
  type StickerPickerProps,
  type StickerMessageProps,
} from './StickerPicker';

// ============================================
// E2EE Components
// ============================================

export { default as E2EEConnectionTester } from './E2EEConnectionTester';
export { E2EEErrorModal } from './E2EEErrorModal';

// ============================================
// Forward Modal
// ============================================

export { ForwardMessageModal } from './ForwardMessageModal';

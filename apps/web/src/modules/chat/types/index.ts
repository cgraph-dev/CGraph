/**
 * Chat Module Types
 *
 * Re-export types from store and components for convenience
 */

// Re-export types from store
export type {
  Message,
  Conversation,
  Reaction,
  ConversationParticipant,
  ChatState,
  TypingUserInfo,
  MessageMetadata,
} from '../store/chatStore';

// Re-export types from components
export type { UIPreferences, MessageBubbleProps } from '../components/message-bubble';
export type { MessageInputAreaProps } from '../components/message-input-area';
export type { ReplyPreviewProps } from '../components/reply-preview';
export type { AmbientBackgroundProps } from '../components/ambient-background';
export type { UISettingsPanelProps } from '../components/ui-settings-panel';
export type { ConversationModalsProps } from '../components/conversation-modals';
export type { GifResult } from '../components/gif-picker';

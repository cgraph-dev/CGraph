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
export type { UIPreferences, MessageBubbleProps } from '../components/MessageBubble';
export type { MessageInputAreaProps } from '../components/MessageInputArea';
export type { ReplyPreviewProps } from '../components/ReplyPreview';
export type { AmbientBackgroundProps } from '../components/AmbientBackground';
export type { UISettingsPanelProps } from '../components/UISettingsPanel';
export type { ConversationModalsProps } from '../components/ConversationModals';
export type { GifResult } from '../components/GifPicker';

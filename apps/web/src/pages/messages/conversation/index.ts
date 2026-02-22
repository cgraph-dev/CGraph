/**
 * Conversation Module
 *
 * Real-time messaging view with E2EE support, message reactions,
 * voice/video calls, sticker/GIF pickers, and scheduled messages.
 *
 * @module pages/messages/conversation
 */

// ── Main Component ─────────────────────────────────────────────────────
export { default } from './page';

// ── Sub-components ─────────────────────────────────────────────────────
export { ConversationMessages } from './conversation-messages';
export type { ConversationMessagesProps } from './conversation-messages';
export { E2EETesterModal, E2EEError, CallModals, InfoPanel } from './conversation-modals';
export type {
  E2EEModalProps,
  E2EEErrorProps,
  CallModalsProps,
  InfoPanelProps,
} from './conversation-modals';

// ── Types ──────────────────────────────────────────────────────────────
export type {
  UIPreferences,
  PendingE2EEMessage,
  VoiceMessageData,
  MutualFriend,
  MessageHandlers,
  CallHandlers,
  SearchResultClickParams,
} from './types';
export { DEFAULT_UI_PREFERENCES } from './types';

// ── Hooks ──────────────────────────────────────────────────────────────
export {
  useConversationParticipant,
  usePresenceStatus,
  useConversationChannel,
  useTypingIndicator,
  useAutoScroll,
} from './hooks';

// ── Handler Factories ──────────────────────────────────────────────────
export {
  createSendHandler,
  createE2EERetryHandler,
  createUnencryptedSendHandler,
  createStickerSelectHandler,
  createGifSelectHandler,
  createVoiceCompleteHandler,
  createFileSelectHandler,
} from './handlers';

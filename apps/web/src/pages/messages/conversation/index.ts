/**
 * Conversation module barrel exports
 * Re-exports all public API from this module
 */

// Main component
export { default } from './page';

// Types
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

// Hooks
export {
  useConversationParticipant,
  usePresenceStatus,
  useConversationChannel,
  useTypingIndicator,
  useAutoScroll,
} from './hooks';

// Handler factories
export {
  createSendHandler,
  createE2EERetryHandler,
  createUnencryptedSendHandler,
  createStickerSelectHandler,
  createGifSelectHandler,
  createVoiceCompleteHandler,
  createFileSelectHandler,
} from './handlers';

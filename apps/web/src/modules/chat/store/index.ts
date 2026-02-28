/**
 * Chat Module Store
 *
 * Consolidated chat state management.
 * This replaces stores/chatStore.ts, stores/chatEffectsStore.ts, stores/chatBubbleStore.ts
 */

// Main chat store
export {
  useChatStore,
  type Message,
  type Conversation,
  type Reaction,
  type ConversationParticipant,
  type ChatState,
  type TypingUserInfo,
  type MessageMetadata,
  type EditHistory,
} from './chatStore';

// Chat effects store (visual effects, themes)
export {
  useChatEffectsStore,
  useActiveMessageEffect,
  useActiveBubbleStyle,
  useChatEffectSettings,
  type MessageEffect,
  type MessageEffectConfig,
  type BubbleStyle,
  type BubbleStyleConfig,
  type TypingIndicatorConfig,
  type ChatEffectsState,
} from './chatEffectsStore';

// Chat bubble customization store
export { useChatBubbleStore } from './chatBubbleStore';

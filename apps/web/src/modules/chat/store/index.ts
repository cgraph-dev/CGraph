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
} from './chatStore';

// Chat effects store (visual effects, themes)
export {
  useChatEffectsStore,
  useActiveMessageEffect,
  type MessageEffect,
  type BubbleStyle,
  type ChatEffectsState,
} from './chatEffectsStore';

// Chat bubble customization store
export { useChatBubbleStore } from './chatBubbleStore';

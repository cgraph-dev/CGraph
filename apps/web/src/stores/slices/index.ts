/**
 * Zustand Slices Pattern - Index
 *
 * This barrel file exports all store slices for easy importing.
 * The slices pattern improves code organization and testability
 * by separating state management concerns into focused modules.
 *
 * @module stores/slices
 * @since v0.7.29
 */

// Chat store slices
export {
  createConversationsSlice,
  createMessagesSlice,
  createTypingSlice,
  createReactionsSlice,
  type ConversationsSlice,
  type MessagesSlice,
  type TypingSlice,
  type ReactionsSlice,
  type ChatStore,
} from './chatSlices';

// Forum store slices
export {
  createForumsSlice,
  createThreadsSlice,
  createCommentsSlice,
  createVotingSlice,
  createModerationSlice,
  createFeaturesSlice,
  type ForumsSlice,
  type ThreadsSlice,
  type CommentsSlice,
  type VotingSlice,
  type ModerationSlice,
  type FeaturesSlice,
  type ForumStoreSlices,
} from './forumSlices';

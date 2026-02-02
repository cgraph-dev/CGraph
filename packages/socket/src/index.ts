/**
 * @cgraph/socket
 *
 * Shared Phoenix channel client for CGraph platforms.
 * Provides typed channel abstractions for real-time features.
 */

// Core client
export { PhoenixClient, createChannelHandler, pushToChannel } from './phoenixClient';

// Channel implementations
export { UserChannel, type UserChannelEvents } from './channels/userChannel';
export {
  ConversationChannel,
  type ConversationChannelEvents,
  type Message,
  type MessageAttachment,
  type MessageReaction,
} from './channels/conversationChannel';
export {
  ForumChannel,
  type ForumChannelEvents,
  type ForumPost,
  type ForumThread,
} from './channels/forumChannel';
export {
  GroupChannel,
  type GroupChannelEvents,
  type GroupMessage,
  type GroupMember,
} from './channels/groupChannel';

// Types
export type {
  SocketOptions,
  ChannelOptions,
  ChannelMessage,
  ChannelResponse,
  PresenceState,
  PresenceMeta,
  PresenceDiff,
  ChannelEvent,
  ConnectionState,
  MessageHandler,
  ErrorHandler,
  CloseHandler,
} from './types';

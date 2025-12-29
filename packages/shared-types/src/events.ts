import type { Message, UserBasic, UserStatus } from './models';

// ============================================
// WebSocket Event Types
// ============================================

// Conversation Events
export interface NewMessageEvent {
  message: Message;
}

export interface MessageUpdatedEvent {
  message: Message;
}

export interface MessageDeletedEvent {
  message_id: string;
  conversation_id?: string;
  channel_id?: string;
}

export interface TypingEvent {
  user_id: string;
  is_typing: boolean;
}

export interface ReadReceiptEvent {
  user_id: string;
  message_id: string;
  read_at: string;
}

// Presence Events
export interface PresenceState {
  [userId: string]: {
    metas: PresenceMeta[];
  };
}

export interface PresenceDiff {
  joins: PresenceState;
  leaves: PresenceState;
}

export interface PresenceMeta {
  phx_ref: string;
  online_at: string;
  status: UserStatus;
  device?: string;
}

// User Events
export interface UserStatusChangedEvent {
  user_id: string;
  status: UserStatus;
  status_message: string | null;
}

// Group Events
export interface MemberJoinedEvent {
  group_id: string;
  member: {
    id: string;
    user: UserBasic;
    joined_at: string;
  };
}

export interface MemberLeftEvent {
  group_id: string;
  user_id: string;
}

export interface MemberUpdatedEvent {
  group_id: string;
  user_id: string;
  changes: {
    nickname?: string;
    roles?: string[];
  };
}

export interface ChannelCreatedEvent {
  group_id: string;
  channel: {
    id: string;
    name: string;
    type: string;
    category_id: string | null;
    position: number;
  };
}

export interface ChannelUpdatedEvent {
  group_id: string;
  channel: {
    id: string;
    name?: string;
    topic?: string;
    position?: number;
  };
}

export interface ChannelDeletedEvent {
  group_id: string;
  channel_id: string;
}

// Reaction Events
export interface ReactionAddedEvent {
  message_id: string;
  emoji: string;
  user_id: string;
}

export interface ReactionRemovedEvent {
  message_id: string;
  emoji: string;
  user_id: string;
}

// ============================================
// Phoenix Channel Topics
// ============================================

export type ChannelTopic =
  | `conversation:${string}`
  | `channel:${string}`
  | `group:${string}`
  | `user:${string}`
  | `presence:${string}`;

// ============================================
// Event Names
// ============================================

export const SocketEvents = {
  // Messages
  NEW_MESSAGE: 'new_message',
  MESSAGE_UPDATED: 'message_updated',
  MESSAGE_DELETED: 'message_deleted',
  
  // Typing
  TYPING: 'typing',
  
  // Presence
  PRESENCE_STATE: 'presence_state',
  PRESENCE_DIFF: 'presence_diff',
  
  // User
  USER_STATUS_CHANGED: 'user_status_changed',
  
  // Group
  MEMBER_JOINED: 'member_joined',
  MEMBER_LEFT: 'member_left',
  MEMBER_UPDATED: 'member_updated',
  CHANNEL_CREATED: 'channel_created',
  CHANNEL_UPDATED: 'channel_updated',
  CHANNEL_DELETED: 'channel_deleted',
  
  // Reactions
  REACTION_ADDED: 'reaction_added',
  REACTION_REMOVED: 'reaction_removed',
  
  // Read receipts
  READ_RECEIPT: 'read_receipt',
} as const;

export type SocketEventName = (typeof SocketEvents)[keyof typeof SocketEvents];

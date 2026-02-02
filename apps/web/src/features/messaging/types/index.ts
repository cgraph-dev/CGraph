/**
 * Messaging Types
 *
 * TypeScript types and interfaces for messaging feature.
 */

// Re-export from shared types package
// Note: TypingIndicator type is renamed to avoid conflict with TypingIndicator component
export type {
  Message,
  Conversation,
  ConversationParticipant,
  MessageReaction,
  ReadReceipt,
  TypingIndicator as TypingIndicatorData,
} from '@cgraph/shared-types';

// Feature-specific types
export interface MessageWithMetadata {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  contentType: 'text' | 'image' | 'video' | 'audio' | 'file' | 'sticker';
  replyToId?: string;
  reactions: MessageReactionLocal[];
  readBy: string[];
  isEncrypted: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface MessageReactionLocal {
  emoji: string;
  users: string[];
  count: number;
}

export interface ConversationState {
  messages: MessageWithMetadata[];
  participants: string[];
  isTyping: Map<string, boolean>;
  unreadCount: number;
  lastReadAt?: Date;
}

export interface SendMessagePayload {
  content: string;
  contentType?: 'text' | 'image' | 'video' | 'audio' | 'file' | 'sticker';
  replyToId?: string;
  attachments?: File[];
  encrypted?: boolean;
}

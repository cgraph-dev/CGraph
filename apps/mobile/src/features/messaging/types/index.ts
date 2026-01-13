/**
 * Messaging Types (Mobile)
 */

export type {
  Message,
  Conversation,
  ConversationParticipant,
  MessageReaction,
} from '@cgraph/shared-types';

export interface MessageWithMetadata {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  contentType: 'text' | 'image' | 'video' | 'audio' | 'file' | 'sticker';
  replyToId?: string;
  reactions: { emoji: string; users: string[]; count: number }[];
  readBy: string[];
  isEncrypted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

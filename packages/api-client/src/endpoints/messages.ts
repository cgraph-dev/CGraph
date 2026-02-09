/**
 * Messages endpoints — conversations, messages, typing, read receipts.
 */
import type { HttpHelpers, ApiResponse, PaginatedResponse, PaginationParams } from '../client';

export interface Conversation {
  readonly id: string;
  readonly type: 'direct' | 'group';
  readonly name: string | null;
  readonly last_message: Message | null;
  readonly unread_count: number;
  readonly participants: ConversationParticipant[];
  readonly updated_at: string;
}

export interface ConversationParticipant {
  readonly user_id: string;
  readonly username: string;
  readonly display_name: string | null;
  readonly avatar_url: string | null;
}

export interface Message {
  readonly id: string;
  readonly conversation_id: string;
  readonly sender_id: string;
  readonly content: string;
  readonly type: 'text' | 'image' | 'file' | 'gif' | 'sticker' | 'poll' | 'system';
  readonly reply_to_id: string | null;
  readonly edited_at: string | null;
  readonly reactions: Record<string, string[]>;
  readonly inserted_at: string;
  readonly sender_data: {
    readonly username: string;
    readonly display_name: string | null;
    readonly avatar_url: string | null;
    readonly bubble_style: string | null;
    readonly equipped_title_id: string | null;
  };
}

export interface SendMessageRequest {
  readonly content: string;
  readonly type?: string;
  readonly reply_to_id?: string;
}

export interface MessagesEndpoints {
  getConversations(params?: PaginationParams): Promise<PaginatedResponse<Conversation>>;
  getConversation(id: string): Promise<ApiResponse<Conversation>>;
  getMessages(conversationId: string, params?: PaginationParams): Promise<PaginatedResponse<Message>>;
  sendMessage(conversationId: string, message: SendMessageRequest): Promise<ApiResponse<Message>>;
  editMessage(conversationId: string, messageId: string, content: string): Promise<ApiResponse<Message>>;
  deleteMessage(conversationId: string, messageId: string): Promise<ApiResponse<void>>;
  addReaction(conversationId: string, messageId: string, emoji: string): Promise<ApiResponse<void>>;
  removeReaction(conversationId: string, messageId: string, emoji: string): Promise<ApiResponse<void>>;
  markRead(conversationId: string, messageId: string): Promise<ApiResponse<void>>;
}

export function createMessagesEndpoints(http: HttpHelpers): MessagesEndpoints {
  return {
    getConversations: (params) =>
      http.get('/api/v1/conversations', { cursor: params?.cursor, limit: params?.limit }),
    getConversation: (id) =>
      http.get(`/api/v1/conversations/${id}`),
    getMessages: (conversationId, params) =>
      http.get(`/api/v1/conversations/${conversationId}/messages`, { cursor: params?.cursor, limit: params?.limit }),
    sendMessage: (conversationId, message) =>
      http.post(`/api/v1/conversations/${conversationId}/messages`, message),
    editMessage: (conversationId, messageId, content) =>
      http.patch(`/api/v1/conversations/${conversationId}/messages/${messageId}`, { content }),
    deleteMessage: (conversationId, messageId) =>
      http.del(`/api/v1/conversations/${conversationId}/messages/${messageId}`),
    addReaction: (conversationId, messageId, emoji) =>
      http.post(`/api/v1/conversations/${conversationId}/messages/${messageId}/reactions`, { emoji }),
    removeReaction: (conversationId, messageId, emoji) =>
      http.del(`/api/v1/conversations/${conversationId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`),
    markRead: (conversationId, messageId) =>
      http.post(`/api/v1/conversations/${conversationId}/read`, { last_read_message_id: messageId }),
  };
}

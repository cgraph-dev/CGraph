/**
 * Messaging Services (Mobile)
 */

import { API_URL } from '@/services/api';

export const messagingApi = {
  getConversations: () => `${API_URL}/api/v1/conversations`,
  getConversation: (id: string) => `${API_URL}/api/v1/conversations/${id}`,
  createConversation: () => `${API_URL}/api/v1/conversations`,
  getMessages: (conversationId: string) =>
    `${API_URL}/api/v1/conversations/${conversationId}/messages`,
  sendMessage: (conversationId: string) =>
    `${API_URL}/api/v1/conversations/${conversationId}/messages`,
  addReaction: (conversationId: string, messageId: string) =>
    `${API_URL}/api/v1/conversations/${conversationId}/messages/${messageId}/reactions`,
  markAsRead: (conversationId: string) => `${API_URL}/api/v1/conversations/${conversationId}/read`,
};

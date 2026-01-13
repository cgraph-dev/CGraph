/**
 * Messaging Services
 * 
 * API and business logic services for messaging.
 */

// API services for messaging
export const messagingApi = {
  // Conversation endpoints
  getConversations: () => '/api/v1/conversations',
  getConversation: (id: string) => `/api/v1/conversations/${id}`,
  createConversation: () => '/api/v1/conversations',
  
  // Message endpoints
  getMessages: (conversationId: string) => `/api/v1/conversations/${conversationId}/messages`,
  sendMessage: (conversationId: string) => `/api/v1/conversations/${conversationId}/messages`,
  editMessage: (conversationId: string, messageId: string) => `/api/v1/conversations/${conversationId}/messages/${messageId}`,
  deleteMessage: (conversationId: string, messageId: string) => `/api/v1/conversations/${conversationId}/messages/${messageId}`,
  
  // Reactions
  addReaction: (conversationId: string, messageId: string) => `/api/v1/conversations/${conversationId}/messages/${messageId}/reactions`,
  removeReaction: (conversationId: string, messageId: string, emoji: string) => `/api/v1/conversations/${conversationId}/messages/${messageId}/reactions/${emoji}`,
  
  // Read receipts
  markAsRead: (conversationId: string) => `/api/v1/conversations/${conversationId}/read`,
};

// E2EE encryption service reference
export { DoubleRatchetEngine } from '@/lib/crypto/doubleRatchet';

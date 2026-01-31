/**
 * chatStore Unit Tests
 *
 * Tests for Zustand chat store state management.
 * These tests focus on synchronous state operations.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { useChatStore, type Message, type Conversation } from '../chatStore';

// Mock message data
const mockMessage: Message = {
  id: 'msg-123',
  conversationId: 'conv-456',
  senderId: 'user-789',
  content: 'Hello, world!',
  encryptedContent: null,
  isEncrypted: false,
  messageType: 'text',
  replyToId: null,
  replyTo: null,
  isPinned: false,
  isEdited: false,
  deletedAt: null,
  metadata: {},
  reactions: [],
  sender: {
    id: 'user-789',
    username: 'testuser',
    displayName: 'Test User',
    avatarUrl: null,
  },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mockConversation: Conversation = {
  id: 'conv-456',
  type: 'direct',
  name: null,
  avatarUrl: null,
  isGroup: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  participants: [
    {
      id: 'part-1',
      conversationId: 'conv-456',
      userId: 'user-789',
      role: 'member',
      joinedAt: '2026-01-01T00:00:00Z',
      user: {
        id: 'user-789',
        username: 'testuser',
        displayName: 'Test User',
        avatarUrl: null,
        status: 'online',
      },
    },
  ],
  lastMessage: null,
  unreadCount: 0,
  isPinned: false,
  isMuted: false,
  isArchived: false,
};

// Reset store state after each test
afterEach(() => {
  useChatStore.setState({
    conversations: [],
    messages: {},
    messageIdSets: {},
    activeConversationId: null,
    isLoadingConversations: false,
    isLoadingMessages: false,
    typingUsers: {},
    typingUsersInfo: {},
    hasMoreMessages: {},
    scheduledMessages: {},
    isLoadingScheduledMessages: false,
    conversationsLastFetchedAt: null,
  });
});

describe('chatStore', () => {
  describe('conversation state management', () => {
    it('should set active conversation', () => {
      useChatStore.setState({ conversations: [mockConversation] });

      useChatStore.getState().setActiveConversation('conv-456');

      expect(useChatStore.getState().activeConversationId).toBe('conv-456');
    });

    it('should clear active conversation with null', () => {
      useChatStore.setState({
        conversations: [mockConversation],
        activeConversationId: 'conv-456',
      });

      useChatStore.getState().setActiveConversation(null);

      expect(useChatStore.getState().activeConversationId).toBeNull();
    });

    it('should add new conversation to list', () => {
      useChatStore.setState({ conversations: [] });

      useChatStore.getState().addConversation(mockConversation);

      expect(useChatStore.getState().conversations).toHaveLength(1);
      expect(useChatStore.getState().conversations[0].id).toBe('conv-456');
    });

    it('should update conversation in list', () => {
      useChatStore.setState({ conversations: [mockConversation] });

      useChatStore.getState().updateConversation({
        id: 'conv-456',
        unreadCount: 5,
        isPinned: true,
      });

      const conv = useChatStore.getState().conversations.find((c) => c.id === 'conv-456');
      expect(conv?.unreadCount).toBe(5);
      expect(conv?.isPinned).toBe(true);
    });

    it('should preserve other conversation fields when updating', () => {
      useChatStore.setState({ conversations: [mockConversation] });

      useChatStore.getState().updateConversation({
        id: 'conv-456',
        unreadCount: 5,
      });

      const conv = useChatStore.getState().conversations.find((c) => c.id === 'conv-456');
      expect(conv?.type).toBe('direct'); // Preserved
      expect(conv?.participants).toHaveLength(1); // Preserved
    });
  });

  describe('message state management', () => {
    it('should add a new message to conversation', async () => {
      useChatStore.setState({
        messages: { 'conv-456': [] },
        messageIdSets: { 'conv-456': new Set() },
      });

      useChatStore.getState().addMessage(mockMessage);

      // addMessage uses queueMicrotask, so we need to wait for it
      await new Promise((resolve) => setTimeout(resolve, 0));

      const messages = useChatStore.getState().messages['conv-456'];
      expect(messages).toHaveLength(1);
      expect(messages[0].id).toBe('msg-123');
    });

    it('should update existing message', () => {
      useChatStore.setState({
        messages: { 'conv-456': [mockMessage] },
        messageIdSets: { 'conv-456': new Set(['msg-123']) },
      });

      const updatedMessage: Message = {
        ...mockMessage,
        content: 'Updated content',
        isEdited: true,
      };

      useChatStore.getState().updateMessage(updatedMessage);

      const messages = useChatStore.getState().messages['conv-456'];
      expect(messages[0].content).toBe('Updated content');
      expect(messages[0].isEdited).toBe(true);
    });

    it('should remove message from conversation', () => {
      useChatStore.setState({
        messages: { 'conv-456': [mockMessage] },
        messageIdSets: { 'conv-456': new Set(['msg-123']) },
      });

      useChatStore.getState().removeMessage('msg-123', 'conv-456');

      expect(useChatStore.getState().messages['conv-456']).toHaveLength(0);
    });
  });

  describe('typing indicators', () => {
    it('should add typing user', () => {
      useChatStore.setState({ typingUsers: {}, typingUsersInfo: {} });

      useChatStore.getState().setTypingUser('conv-456', 'user-123', true);

      const typingUsers = useChatStore.getState().typingUsers['conv-456'];
      expect(typingUsers).toContain('user-123');
    });

    it('should remove typing user', () => {
      useChatStore.setState({
        typingUsers: { 'conv-456': ['user-123'] },
        typingUsersInfo: {},
      });

      useChatStore.getState().setTypingUser('conv-456', 'user-123', false);

      const typingUsers = useChatStore.getState().typingUsers['conv-456'] || [];
      expect(typingUsers).not.toContain('user-123');
    });
  });

  describe('reactions', () => {
    it('should add reaction to message via addReactionToMessage', () => {
      const messageWithReactions: Message = {
        ...mockMessage,
        reactions: [],
      };
      useChatStore.setState({
        messages: { 'conv-456': [messageWithReactions] },
        messageIdSets: { 'conv-456': new Set(['msg-123']) },
      });

      useChatStore.getState().addReactionToMessage('msg-123', '👍', 'user-999', 'reactor');

      const messages = useChatStore.getState().messages['conv-456'];
      expect(messages[0].reactions).toHaveLength(1);
      expect(messages[0].reactions[0].emoji).toBe('👍');
      expect(messages[0].reactions[0].userId).toBe('user-999');
    });

    it('should remove reaction from message via removeReactionFromMessage', () => {
      const messageWithReaction: Message = {
        ...mockMessage,
        reactions: [
          {
            id: 'reaction-1',
            emoji: '👍',
            userId: 'user-999',
            user: { id: 'user-999', username: 'reactor' },
          },
        ],
      };
      useChatStore.setState({
        messages: { 'conv-456': [messageWithReaction] },
        messageIdSets: { 'conv-456': new Set(['msg-123']) },
      });

      useChatStore.getState().removeReactionFromMessage('msg-123', '👍', 'user-999');

      const messages = useChatStore.getState().messages['conv-456'];
      expect(messages[0].reactions).toHaveLength(0);
    });
  });

  describe('loading states', () => {
    it('should track conversation loading state', () => {
      useChatStore.setState({ isLoadingConversations: true });

      expect(useChatStore.getState().isLoadingConversations).toBe(true);
    });

    it('should track message loading state', () => {
      useChatStore.setState({ isLoadingMessages: true });

      expect(useChatStore.getState().isLoadingMessages).toBe(true);
    });

    it('should track scheduled messages loading state', () => {
      useChatStore.setState({ isLoadingScheduledMessages: true });

      expect(useChatStore.getState().isLoadingScheduledMessages).toBe(true);
    });
  });

  describe('hasMoreMessages', () => {
    it('should track if conversation has more messages', () => {
      useChatStore.setState({
        hasMoreMessages: { 'conv-456': true },
      });

      expect(useChatStore.getState().hasMoreMessages['conv-456']).toBe(true);
    });

    it('should default to false for unknown conversation', () => {
      expect(useChatStore.getState().hasMoreMessages['unknown']).toBeUndefined();
    });
  });

  describe('getRecipientId', () => {
    it('should return the other participant in a direct conversation', () => {
      const convWithTwoParticipants: Conversation = {
        ...mockConversation,
        participants: [
          {
            id: 'part-1',
            conversationId: 'conv-456',
            userId: 'current-user',
            role: 'member',
            joinedAt: '2026-01-01T00:00:00Z',
            user: {
              id: 'current-user',
              username: 'me',
              displayName: 'Me',
              avatarUrl: null,
              status: 'online',
            },
          },
          {
            id: 'part-2',
            conversationId: 'conv-456',
            userId: 'other-user',
            role: 'member',
            joinedAt: '2026-01-01T00:00:00Z',
            user: {
              id: 'other-user',
              username: 'them',
              displayName: 'Them',
              avatarUrl: null,
              status: 'online',
            },
          },
        ],
      };

      useChatStore.setState({ conversations: [convWithTwoParticipants] });

      const recipientId = useChatStore.getState().getRecipientId('conv-456', 'current-user');
      expect(recipientId).toBe('other-user');
    });

    it('should return null for unknown conversation', () => {
      useChatStore.setState({ conversations: [] });

      const recipientId = useChatStore.getState().getRecipientId('unknown', 'current-user');
      expect(recipientId).toBeNull();
    });
  });
});

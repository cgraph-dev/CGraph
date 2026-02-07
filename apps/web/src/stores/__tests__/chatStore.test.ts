/**
 * chatStore Unit Tests
 *
 * Tests for Zustand chat store state management.
 * These tests focus on synchronous state operations and async API calls.
 */

import { describe, it, expect, afterEach, vi, beforeEach, type MockedFunction } from 'vitest';
import { useChatStore, type Message, type Conversation } from '@/modules/chat/store';

// Mock the API module
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Import the mocked api with proper typing
import { api } from '@/lib/api';

// Type the mocked API properly
const mockedApi = {
  get: api.get as MockedFunction<typeof api.get>,
  post: api.post as MockedFunction<typeof api.post>,
  put: api.put as MockedFunction<typeof api.put>,
  patch: api.patch as MockedFunction<typeof api.patch>,
  delete: api.delete as MockedFunction<typeof api.delete>,
};

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
      userId: 'user-789',
      nickname: null,
      isMuted: false,
      mutedUntil: null,
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
};

// Reset store state and mocks after each test
beforeEach(() => {
  vi.clearAllMocks();
});

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
      expect(useChatStore.getState().conversations[0]?.id).toBe('conv-456');
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
      expect(messages?.[0]?.id).toBe('msg-123');
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
      expect(messages?.[0]?.content).toBe('Updated content');
      expect(messages?.[0]?.isEdited).toBe(true);
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
      expect(messages?.[0]?.reactions).toHaveLength(1);
      expect(messages?.[0]?.reactions?.[0]?.emoji).toBe('👍');
      expect(messages?.[0]?.reactions?.[0]?.userId).toBe('user-999');
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
      expect(messages?.[0]?.reactions).toHaveLength(0);
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
            userId: 'current-user',
            nickname: null,
            isMuted: false,
            mutedUntil: null,
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
            userId: 'other-user',
            nickname: null,
            isMuted: false,
            mutedUntil: null,
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

  describe('fetchConversations action', () => {
    it('should fetch conversations from API', async () => {
      mockedApi.get.mockResolvedValue({
        data: { conversations: [mockConversation] },
      });

      await useChatStore.getState().fetchConversations();

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/conversations');
      expect(useChatStore.getState().conversations).toHaveLength(1);
      expect(useChatStore.getState().isLoadingConversations).toBe(false);
    });

    it('should set loading state while fetching', async () => {
      let resolvePromise: (value: unknown) => void;
      mockedApi.get.mockImplementation(() => new Promise((resolve) => (resolvePromise = resolve)));

      const promise = useChatStore.getState().fetchConversations();
      expect(useChatStore.getState().isLoadingConversations).toBe(true);

      resolvePromise!({ data: { conversations: [] } });
      await promise;

      expect(useChatStore.getState().isLoadingConversations).toBe(false);
    });

    it('should use cache if recently fetched', async () => {
      // First fetch
      mockedApi.get.mockResolvedValue({ data: { conversations: [mockConversation] } });
      await useChatStore.getState().fetchConversations();

      // Second fetch should use cache
      await useChatStore.getState().fetchConversations();

      expect(mockedApi.get).toHaveBeenCalledTimes(1);
    });

    it('should skip if already loading', async () => {
      useChatStore.setState({ isLoadingConversations: true });
      mockedApi.get.mockResolvedValue({ data: { conversations: [] } });

      await useChatStore.getState().fetchConversations();

      expect(mockedApi.get).not.toHaveBeenCalled();
    });
  });

  describe('fetchMessages action', () => {
    it('should fetch messages for a conversation', async () => {
      mockedApi.get.mockResolvedValue({
        data: { messages: [mockMessage] },
      });

      await useChatStore.getState().fetchMessages('conv-456');

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/conversations/conv-456/messages', {
        params: { limit: 50 },
      });
      const messages = useChatStore.getState().messages['conv-456'];
      expect(messages).toHaveLength(1);
    });

    it('should support pagination with before parameter', async () => {
      mockedApi.get.mockResolvedValue({ data: { messages: [] } });

      await useChatStore.getState().fetchMessages('conv-456', 'msg-before');

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/conversations/conv-456/messages', {
        params: { before: 'msg-before', limit: 50 },
      });
    });

    it('should track hasMoreMessages based on response length', async () => {
      // Less than 50 messages means no more
      mockedApi.get.mockResolvedValue({ data: { messages: [mockMessage] } });

      await useChatStore.getState().fetchMessages('conv-456');

      expect(useChatStore.getState().hasMoreMessages['conv-456']).toBe(false);
    });
  });

  describe('sendMessage action', () => {
    it('should send a message to a conversation', async () => {
      mockedApi.post.mockResolvedValue({ data: { message: mockMessage } });
      useChatStore.setState({ conversations: [mockConversation] });

      await useChatStore.getState().sendMessage('conv-456', 'Hello!');

      expect(mockedApi.post).toHaveBeenCalled();
      const callArgs = mockedApi.post.mock.calls[0];
      expect(callArgs?.[0]).toBe('/api/v1/conversations/conv-456/messages');
      expect(callArgs?.[1]).toEqual(expect.objectContaining({ content: 'Hello!' }));
    });

    it('should send message with reply reference', async () => {
      mockedApi.post.mockResolvedValue({ data: { message: mockMessage } });
      useChatStore.setState({ conversations: [mockConversation] });

      await useChatStore.getState().sendMessage('conv-456', 'Reply!', 'msg-original');

      expect(mockedApi.post).toHaveBeenCalledWith(
        '/api/v1/conversations/conv-456/messages',
        expect.objectContaining({ content: 'Reply!', reply_to_id: 'msg-original' })
      );
    });
  });

  describe('editMessage action', () => {
    it('should edit a message', async () => {
      mockedApi.patch.mockResolvedValue({
        data: { message: { ...mockMessage, content: 'Updated' } },
      });
      useChatStore.setState({
        messages: { 'conv-456': [mockMessage] },
        messageIdSets: { 'conv-456': new Set(['msg-123']) },
      });

      await useChatStore.getState().editMessage('msg-123', 'Updated content');

      expect(mockedApi.patch).toHaveBeenCalledWith(
        '/api/v1/conversations/conv-456/messages/msg-123',
        {
          content: 'Updated content',
        }
      );
    });
  });

  describe('deleteMessage action', () => {
    it('should delete a message', async () => {
      mockedApi.delete.mockResolvedValue({ data: {} });
      useChatStore.setState({
        messages: { 'conv-456': [mockMessage] },
        messageIdSets: { 'conv-456': new Set(['msg-123']) },
      });

      await useChatStore.getState().deleteMessage('msg-123');

      expect(mockedApi.delete).toHaveBeenCalledWith(
        '/api/v1/conversations/conv-456/messages/msg-123'
      );
    });
  });

  describe('addReaction / removeReaction actions', () => {
    it('should add a reaction to a message', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });
      useChatStore.setState({
        messages: { 'conv-456': [mockMessage] },
        messageIdSets: { 'conv-456': new Set(['msg-123']) },
      });

      await useChatStore.getState().addReaction('msg-123', '👍');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/messages/msg-123/reactions', {
        emoji: '👍',
      });
    });

    it('should remove a reaction from a message', async () => {
      mockedApi.delete.mockResolvedValue({ data: {} });
      const messageWithReaction = {
        ...mockMessage,
        reactions: [
          {
            id: 'react-1',
            emoji: '👍',
            userId: 'user-789',
            user: { id: 'user-789', username: 'testuser' },
          },
        ],
      };
      useChatStore.setState({
        messages: { 'conv-456': [messageWithReaction] },
        messageIdSets: { 'conv-456': new Set(['msg-123']) },
      });

      await useChatStore.getState().removeReaction('msg-123', '👍');

      expect(mockedApi.delete).toHaveBeenCalledWith('/api/v1/messages/msg-123/reactions/👍');
    });
  });

  describe('markAsRead action', () => {
    it('should mark conversation as read', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });
      useChatStore.setState({ conversations: [mockConversation] });

      await useChatStore.getState().markAsRead('conv-456');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/conversations/conv-456/read');
    });

    it('should update unread count locally', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });
      useChatStore.setState({
        conversations: [{ ...mockConversation, unreadCount: 5 }],
      });

      await useChatStore.getState().markAsRead('conv-456');

      const conv = useChatStore.getState().conversations.find((c) => c.id === 'conv-456');
      expect(conv?.unreadCount).toBe(0);
    });
  });

  describe('createConversation action', () => {
    it('should create a new conversation', async () => {
      mockedApi.post.mockResolvedValue({ data: { conversation: mockConversation } });

      const result = await useChatStore.getState().createConversation(['user-789']);

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/conversations', {
        participant_ids: ['user-789'],
      });
      expect(result.id).toBe('conv-456');
    });

    it('should add new conversation to state', async () => {
      mockedApi.post.mockResolvedValue({ data: { conversation: mockConversation } });

      await useChatStore.getState().createConversation(['user-789']);

      expect(useChatStore.getState().conversations).toHaveLength(1);
    });
  });

  describe('addConversation / updateConversation actions', () => {
    it('should add a conversation from socket event', () => {
      useChatStore.getState().addConversation(mockConversation);

      expect(useChatStore.getState().conversations).toHaveLength(1);
    });

    it('should not add duplicate conversation', () => {
      useChatStore.setState({ conversations: [mockConversation] });

      useChatStore.getState().addConversation(mockConversation);

      expect(useChatStore.getState().conversations).toHaveLength(1);
    });

    it('should update existing conversation', () => {
      useChatStore.setState({ conversations: [mockConversation] });

      useChatStore.getState().updateConversation({ id: 'conv-456', name: 'Updated Name' });

      const conv = useChatStore.getState().conversations.find((c) => c.id === 'conv-456');
      expect(conv?.name).toBe('Updated Name');
    });
  });

  describe('scheduled messages actions', () => {
    it('should fetch scheduled messages', async () => {
      const scheduledMessage = { ...mockMessage, scheduledAt: '2026-02-01T00:00:00Z' };
      mockedApi.get.mockResolvedValue({ data: { messages: [scheduledMessage] } });

      await useChatStore.getState().fetchScheduledMessages('conv-456');

      expect(mockedApi.get).toHaveBeenCalledWith('/conversations/conv-456/scheduled-messages');
    });

    it('should schedule a message', async () => {
      mockedApi.post.mockResolvedValue({ data: { message: mockMessage } });
      useChatStore.setState({ conversations: [mockConversation] });

      const scheduledAt = new Date('2026-02-01T00:00:00Z');
      await useChatStore.getState().scheduleMessage('conv-456', 'Scheduled!', scheduledAt);

      expect(mockedApi.post).toHaveBeenCalledWith(
        '/conversations/conv-456/messages',
        expect.objectContaining({
          content: 'Scheduled!',
          scheduled_at: scheduledAt.toISOString(),
        })
      );
    });

    it('should cancel a scheduled message', async () => {
      mockedApi.delete.mockResolvedValue({ data: {} });
      useChatStore.setState({
        scheduledMessages: {
          'conv-456': [{ ...mockMessage, scheduledAt: '2026-02-01T00:00:00Z' }],
        },
      });

      await useChatStore.getState().cancelScheduledMessage('msg-123');

      expect(mockedApi.delete).toHaveBeenCalledWith('/messages/msg-123/cancel-schedule');
    });

    it('should reschedule a message', async () => {
      mockedApi.patch.mockResolvedValue({ data: { message: mockMessage } });
      useChatStore.setState({
        scheduledMessages: {
          'conv-456': [{ ...mockMessage, scheduledAt: '2026-02-01T00:00:00Z' }],
        },
      });

      const newDate = new Date('2026-03-01T00:00:00Z');
      await useChatStore.getState().rescheduleMessage('msg-123', newDate);

      expect(mockedApi.patch).toHaveBeenCalledWith('/messages/msg-123/reschedule', {
        scheduled_at: newDate.toISOString(),
      });
    });
  });

  describe('typing indicator management', () => {
    it('should add typing user', () => {
      useChatStore.getState().setTypingUser('conv-456', 'user-123', true, '2026-01-01T00:00:00Z');

      const typingUsers = useChatStore.getState().typingUsers['conv-456'];
      expect(typingUsers).toContain('user-123');
    });

    it('should remove typing user', () => {
      useChatStore.setState({ typingUsers: { 'conv-456': ['user-123'] } });

      useChatStore.getState().setTypingUser('conv-456', 'user-123', false);

      const typingUsers = useChatStore.getState().typingUsers['conv-456'];
      expect(typingUsers).not.toContain('user-123');
    });
  });
});

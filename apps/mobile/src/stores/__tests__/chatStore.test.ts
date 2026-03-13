/**
 * Tests for chatStore — Zustand chat store, normalization, and state management.
 *
 * @module stores/__tests__/chatStore.test
 */

// Mock api and socketManager before importing the store
jest.mock('../../lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../../lib/socket', () => ({
  __esModule: true,
  default: {
    joinChannel: jest.fn(),
    leaveChannel: jest.fn(),
    onChannelMessage: jest.fn(() => jest.fn()),
    sendTyping: jest.fn(),
  },
}));

import api from '../../lib/api';
import { useChatStore, type Conversation, type Message } from '../chatStore';

const mockApi = api as jest.Mocked<typeof api>;

// Helper to reset the store between tests
function resetStore() {
  useChatStore.setState({
    conversations: [],
    activeConversationId: null,
    messages: {},
    messageIds: {},
    typingUsers: {},
    hasMoreMessages: {},
    isLoadingConversations: false,
    isLoadingMessages: false,
    lastFetchedAt: null,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  resetStore();
});

// ── Helper factories ─────────────────────────────────────────────────

function makeMessage(
  overrides: Partial<Message> & { id: string; conversationId: string }
): Message {
  return {
    senderId: 'user-1',
    content: 'hi',
    messageType: 'text',
    replyToId: null,
    replyTo: null,
    isPinned: false,
    isEdited: false,
    isEncrypted: false,
    encryptedContent: null,
    deletedAt: null,
    metadata: {},
    reactions: [],
    sender: { id: 'user-1', username: 'alice', displayName: null, avatarUrl: null },
    createdAt: '2024-01-15T12:00:00Z',
    updatedAt: '2024-01-15T12:00:00Z',
    ...overrides,
  };
}

function makeConversation(overrides: Partial<Conversation> & { id: string }): Conversation {
  return {
    type: 'direct',
    name: null,
    avatarUrl: null,
    participants: [],
    lastMessage: null,
    unreadCount: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// ── fetchConversations ───────────────────────────────────────────────

describe('fetchConversations', () => {
  it('fetches and normalizes conversations', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        conversations: [
          {
            id: 'conv-1',
            type: 'direct',
            created_at: '2024-01-01',
            updated_at: '2024-01-02',
            participants: [],
          },
        ],
      },
    });

    await useChatStore.getState().fetchConversations();

    const state = useChatStore.getState();
    expect(state.conversations).toHaveLength(1);
    expect(state.conversations[0].id).toBe('conv-1');
    expect(state.isLoadingConversations).toBe(false);
    expect(state.lastFetchedAt).not.toBeNull();
  });

  it('does not refetch within 30 seconds', async () => {
    mockApi.get.mockResolvedValue({ data: { conversations: [] } });

    await useChatStore.getState().fetchConversations();
    await useChatStore.getState().fetchConversations();

    // Should only have called once
    expect(mockApi.get).toHaveBeenCalledTimes(1);
  });

  it('handles API errors gracefully', async () => {
    mockApi.get.mockRejectedValue(new Error('Network error'));

    await useChatStore.getState().fetchConversations();

    expect(useChatStore.getState().isLoadingConversations).toBe(false);
  });
});

// ── fetchMessages ────────────────────────────────────────────────────

describe('fetchMessages', () => {
  it('fetches and normalizes messages for a conversation', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        messages: [
          { id: 'msg-1', content: 'hello', sender_id: 'u1', conversation_id: 'conv-1' },
          { id: 'msg-2', content: 'world', sender_id: 'u2', conversation_id: 'conv-1' },
        ],
      },
    });

    await useChatStore.getState().fetchMessages('conv-1');

    const state = useChatStore.getState();
    expect(state.messages['conv-1']).toHaveLength(2);
    expect(state.isLoadingMessages).toBe(false);
  });

  it('handles pagination with before parameter', async () => {
    mockApi.get.mockResolvedValue({ data: { messages: [] } });

    await useChatStore.getState().fetchMessages('conv-1', 'msg-old');

    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/conversations/conv-1/messages', {
      params: { limit: 50, before: 'msg-old' },
    });
  });

  it('sets hasMoreMessages based on result count', async () => {
    // 50 messages = has more
    const fiftyMessages = Array.from({ length: 50 }, (_, i) => ({
      id: `msg-${i}`,
      content: `message ${i}`,
    }));
    mockApi.get.mockResolvedValue({ data: { messages: fiftyMessages } });

    await useChatStore.getState().fetchMessages('conv-1');
    expect(useChatStore.getState().hasMoreMessages['conv-1']).toBe(true);
  });

  it('handles API errors gracefully', async () => {
    mockApi.get.mockRejectedValue(new Error('Server error'));

    await useChatStore.getState().fetchMessages('conv-1');
    expect(useChatStore.getState().isLoadingMessages).toBe(false);
  });
});

// ── sendMessage ──────────────────────────────────────────────────────

describe('sendMessage', () => {
  it('sends message and adds to store', async () => {
    mockApi.post.mockResolvedValue({
      data: {
        message: { id: 'new-msg', content: 'hello', conversation_id: 'conv-1', sender_id: 'u1' },
      },
    });

    await useChatStore.getState().sendMessage('conv-1', 'hello');

    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/conversations/conv-1/messages', {
      content: 'hello',
    });
  });

  it('includes reply_to_id when provided', async () => {
    mockApi.post.mockResolvedValue({
      data: { message: { id: 'reply-msg', content: 'reply', conversation_id: 'conv-1' } },
    });

    await useChatStore.getState().sendMessage('conv-1', 'reply', 'msg-parent');

    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/conversations/conv-1/messages', {
      content: 'reply',
      reply_to_id: 'msg-parent',
    });
  });
});

// ── editMessage ──────────────────────────────────────────────────────

describe('editMessage', () => {
  it('patches message and updates store', async () => {
    const msg = makeMessage({ id: 'msg-1', conversationId: 'conv-1' });
    useChatStore.setState({ messages: { 'conv-1': [msg] } });

    mockApi.patch.mockResolvedValue({
      data: { message: { id: 'msg-1', content: 'edited', conversation_id: 'conv-1' } },
    });

    await useChatStore.getState().editMessage('conv-1', 'msg-1', 'edited');

    expect(mockApi.patch).toHaveBeenCalledWith('/api/v1/conversations/conv-1/messages/msg-1', {
      content: 'edited',
    });
  });
});

// ── deleteMessage ────────────────────────────────────────────────────

describe('deleteMessage', () => {
  it('deletes message and removes from store', async () => {
    const msg = makeMessage({ id: 'msg-1', conversationId: 'conv-1' });
    useChatStore.setState({
      messages: { 'conv-1': [msg] },
      messageIds: { 'conv-1': new Set(['msg-1']) },
    });

    mockApi.delete.mockResolvedValue({ data: {} });

    await useChatStore.getState().deleteMessage('conv-1', 'msg-1');

    expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/conversations/conv-1/messages/msg-1');
    expect(useChatStore.getState().messages['conv-1']).toHaveLength(0);
  });
});

// ── addReaction / removeReaction ──────────────────────────────────────

describe('addReaction', () => {
  it('sends reaction to API', async () => {
    mockApi.post.mockResolvedValue({ data: {} });
    await useChatStore.getState().addReaction('msg-1', '👍');
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/messages/msg-1/reactions', { emoji: '👍' });
  });
});

describe('removeReaction', () => {
  it('deletes reaction from API', async () => {
    mockApi.delete.mockResolvedValue({ data: {} });
    await useChatStore.getState().removeReaction('msg-1', '👍');
    expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/messages/msg-1/reactions/👍');
  });
});

// ── setActiveConversation ─────────────────────────────────────────────

describe('setActiveConversation', () => {
  it('sets the active conversation ID', () => {
    useChatStore.getState().setActiveConversation('conv-5');
    expect(useChatStore.getState().activeConversationId).toBe('conv-5');
  });

  it('clears active conversation with null', () => {
    useChatStore.getState().setActiveConversation('conv-5');
    useChatStore.getState().setActiveConversation(null);
    expect(useChatStore.getState().activeConversationId).toBeNull();
  });
});

// ── markAsRead ───────────────────────────────────────────────────────

describe('markAsRead', () => {
  it('posts read receipt and resets unread count', async () => {
    const conv = makeConversation({ id: 'conv-1', unreadCount: 5 });
    useChatStore.setState({ conversations: [conv] });

    mockApi.post.mockResolvedValue({ data: {} });

    await useChatStore.getState().markAsRead('conv-1');

    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/conversations/conv-1/read');
    expect(useChatStore.getState().conversations[0].unreadCount).toBe(0);
  });
});

// ── createConversation ───────────────────────────────────────────────

describe('createConversation', () => {
  it('creates conversation and adds to store', async () => {
    mockApi.post.mockResolvedValue({
      data: {
        conversation: {
          id: 'new-conv',
          type: 'direct',
          participants: [],
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      },
    });

    const result = await useChatStore.getState().createConversation(['user-2']);

    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/conversations', {
      participant_ids: ['user-2'],
    });
    expect(result.id).toBe('new-conv');
    expect(useChatStore.getState().conversations).toHaveLength(1);
  });
});

// ── Socket-driven mutations ──────────────────────────────────────────

describe('addMessage', () => {
  it('adds message to conversation', () => {
    const msg = makeMessage({ id: 'msg-1', conversationId: 'conv-1' });
    useChatStore.getState().addMessage(msg);

    expect(useChatStore.getState().messages['conv-1']).toHaveLength(1);
    expect(useChatStore.getState().messages['conv-1'][0].id).toBe('msg-1');
  });

  it('does not add duplicate messages', () => {
    const msg = makeMessage({ id: 'msg-1', conversationId: 'conv-1' });
    useChatStore.setState({
      messages: { 'conv-1': [msg] },
      messageIds: { 'conv-1': new Set(['msg-1']) },
    });

    useChatStore.getState().addMessage(msg);
    expect(useChatStore.getState().messages['conv-1']).toHaveLength(1);
  });

  it('updates conversation lastMessage when adding', () => {
    const conv = makeConversation({ id: 'conv-1' });
    useChatStore.setState({ conversations: [conv] });

    const msg = makeMessage({ id: 'msg-1', conversationId: 'conv-1', content: 'new' });
    useChatStore.getState().addMessage(msg);

    expect(useChatStore.getState().conversations[0].lastMessage?.content).toBe('new');
  });
});

describe('updateMessage', () => {
  it('replaces message in conversation', () => {
    const original = makeMessage({ id: 'msg-1', conversationId: 'conv-1', content: 'original' });
    useChatStore.setState({ messages: { 'conv-1': [original] } });

    const updated = makeMessage({ id: 'msg-1', conversationId: 'conv-1', content: 'updated' });
    useChatStore.getState().updateMessage(updated);

    expect(useChatStore.getState().messages['conv-1'][0].content).toBe('updated');
  });
});

describe('removeMessage', () => {
  it('removes message from conversation', () => {
    const msg = makeMessage({ id: 'msg-1', conversationId: 'conv-1' });
    useChatStore.setState({
      messages: { 'conv-1': [msg] },
      messageIds: { 'conv-1': new Set(['msg-1']) },
    });

    useChatStore.getState().removeMessage('msg-1', 'conv-1');

    expect(useChatStore.getState().messages['conv-1']).toHaveLength(0);
  });
});

describe('setTypingUser', () => {
  it('adds user to typing list', () => {
    useChatStore.getState().setTypingUser('conv-1', 'user-2', true);
    expect(useChatStore.getState().typingUsers['conv-1']).toContain('user-2');
  });

  it('removes user from typing list', () => {
    useChatStore.setState({ typingUsers: { 'conv-1': ['user-2'] } });
    useChatStore.getState().setTypingUser('conv-1', 'user-2', false);
    expect(useChatStore.getState().typingUsers['conv-1']).not.toContain('user-2');
  });

  it('does not duplicate typing users', () => {
    useChatStore.getState().setTypingUser('conv-1', 'user-2', true);
    useChatStore.getState().setTypingUser('conv-1', 'user-2', true);
    const typing = useChatStore.getState().typingUsers['conv-1'];
    expect(typing.filter((u) => u === 'user-2')).toHaveLength(1);
  });
});

describe('addReactionToMessage', () => {
  it('adds reaction to message', () => {
    const msg = makeMessage({ id: 'msg-1', conversationId: 'conv-1', reactions: [] });
    useChatStore.setState({ messages: { 'conv-1': [msg] } });

    useChatStore.getState().addReactionToMessage('msg-1', '🎉', 'user-2', 'bob');

    const reactions = useChatStore.getState().messages['conv-1'][0].reactions;
    expect(reactions).toHaveLength(1);
    expect(reactions[0].emoji).toBe('🎉');
    expect(reactions[0].userId).toBe('user-2');
  });

  it('does not duplicate identical reactions', () => {
    const msg = makeMessage({
      id: 'msg-1',
      conversationId: 'conv-1',
      reactions: [
        { id: 'r1', emoji: '🎉', userId: 'user-2', user: { id: 'user-2', username: 'bob' } },
      ],
    });
    useChatStore.setState({ messages: { 'conv-1': [msg] } });

    useChatStore.getState().addReactionToMessage('msg-1', '🎉', 'user-2', 'bob');

    expect(useChatStore.getState().messages['conv-1'][0].reactions).toHaveLength(1);
  });
});

describe('removeReactionFromMessage', () => {
  it('removes matching reaction', () => {
    const msg = makeMessage({
      id: 'msg-1',
      conversationId: 'conv-1',
      reactions: [
        { id: 'r1', emoji: '👍', userId: 'user-2', user: { id: 'user-2', username: 'bob' } },
        { id: 'r2', emoji: '❤️', userId: 'user-3', user: { id: 'user-3', username: 'charlie' } },
      ],
    });
    useChatStore.setState({ messages: { 'conv-1': [msg] } });

    useChatStore.getState().removeReactionFromMessage('msg-1', '👍', 'user-2');

    const reactions = useChatStore.getState().messages['conv-1'][0].reactions;
    expect(reactions).toHaveLength(1);
    expect(reactions[0].emoji).toBe('❤️');
  });
});

describe('addConversation', () => {
  it('adds new conversation to front of list', () => {
    const existing = makeConversation({ id: 'conv-1' });
    useChatStore.setState({ conversations: [existing] });

    const newConv = makeConversation({ id: 'conv-2' });
    useChatStore.getState().addConversation(newConv);

    expect(useChatStore.getState().conversations).toHaveLength(2);
    expect(useChatStore.getState().conversations[0].id).toBe('conv-2');
  });

  it('does not add duplicate conversation', () => {
    const existing = makeConversation({ id: 'conv-1' });
    useChatStore.setState({ conversations: [existing] });

    useChatStore.getState().addConversation(existing);
    expect(useChatStore.getState().conversations).toHaveLength(1);
  });
});

describe('updateConversation', () => {
  it('updates matching conversation fields', () => {
    const conv = makeConversation({ id: 'conv-1', name: 'Old Name' });
    useChatStore.setState({ conversations: [conv] });

    useChatStore.getState().updateConversation({ id: 'conv-1', name: 'New Name' });

    expect(useChatStore.getState().conversations[0].name).toBe('New Name');
  });

  it('does not affect other conversations', () => {
    const conv1 = makeConversation({ id: 'conv-1', name: 'First' });
    const conv2 = makeConversation({ id: 'conv-2', name: 'Second' });
    useChatStore.setState({ conversations: [conv1, conv2] });

    useChatStore.getState().updateConversation({ id: 'conv-1', name: 'Updated' });

    expect(useChatStore.getState().conversations[1].name).toBe('Second');
  });
});

// ── getRecipientId ───────────────────────────────────────────────────

describe('getRecipientId', () => {
  it('returns the other participant in direct conversation', () => {
    const conv = makeConversation({
      id: 'conv-1',
      type: 'direct',
      participants: [
        {
          id: 'p1',
          userId: 'user-1',
          user: {
            id: 'user-1',
            username: 'a',
            displayName: null,
            avatarUrl: null,
            status: 'online',
          },
          nickname: null,
          joinedAt: '',
        },
        {
          id: 'p2',
          userId: 'user-2',
          user: {
            id: 'user-2',
            username: 'b',
            displayName: null,
            avatarUrl: null,
            status: 'online',
          },
          nickname: null,
          joinedAt: '',
        },
      ],
    });
    useChatStore.setState({ conversations: [conv] });

    expect(useChatStore.getState().getRecipientId('conv-1', 'user-1')).toBe('user-2');
  });

  it('returns null for group conversation', () => {
    const conv = makeConversation({ id: 'conv-1', type: 'group' });
    useChatStore.setState({ conversations: [conv] });

    expect(useChatStore.getState().getRecipientId('conv-1', 'user-1')).toBeNull();
  });

  it('returns null for non-existent conversation', () => {
    expect(useChatStore.getState().getRecipientId('no-exist', 'user-1')).toBeNull();
  });
});

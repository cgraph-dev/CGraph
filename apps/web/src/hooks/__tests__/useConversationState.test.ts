import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock the stores before importing the hook
vi.mock('@/stores/chatStore', () => ({
  useChatStore: vi.fn((selector) => {
    const state = {
      conversations: {
        'conv-1': {
          id: 'conv-1',
          name: 'Test Conversation',
          participants: [],
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      },
      messages: {
        'conv-1': [
          {
            id: 'msg-1',
            content: 'Hello World',
            senderId: 'user-1',
            conversationId: 'conv-1',
            createdAt: '2026-01-01T00:00:00Z',
          },
        ],
      },
      isLoadingMessages: {},
      typingUsers: { 'conv-1': [] },
      hasMoreMessages: { 'conv-1': false },
      presenceUsers: { 'conv-1': ['user-1'] },
      fetchMessages: vi.fn().mockResolvedValue(undefined),
      sendMessage: vi.fn().mockResolvedValue(undefined),
      markAsRead: vi.fn(),
      setActiveConversation: vi.fn(),
    };
    return selector(state);
  }),
}));

vi.mock('@/stores/presenceStore', () => ({
  usePresenceStore: vi.fn((selector) => {
    const state = {
      presenceUsers: { 'conv-1': ['user-1'] },
    };
    return selector(state);
  }),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 'current-user-1' },
  })),
}));

vi.mock('@/stores/friendStore', () => ({
  useFriendStore: vi.fn(() => ({
    friends: [],
    fetchFriends: vi.fn(),
  })),
}));

vi.mock('@/lib/socket', () => ({
  socketManager: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

vi.mock('@/lib/apiUtils', () => ({
  getParticipantUserId: vi.fn(() => null),
  getParticipantDisplayName: vi.fn(() => 'Test User'),
}));

// Import after mocks
import { useConversationState } from '../useConversationState';

describe('useConversationState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('returns null state when no conversationId provided', () => {
      const { result } = renderHook(() => useConversationState(undefined));

      expect(result.current.conversation).toBeNull();
      expect(result.current.messages).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('returns conversation state when conversationId provided', () => {
      const { result } = renderHook(() => useConversationState('conv-1'));

      expect(result.current.conversation).toBeDefined();
      expect(result.current.conversation?.id).toBe('conv-1');
      expect(result.current.messages).toHaveLength(1);
    });
  });

  describe('message operations', () => {
    it('provides sendMessage function', () => {
      const { result } = renderHook(() => useConversationState('conv-1'));

      expect(typeof result.current.sendMessage).toBe('function');
    });

    it('provides markAsRead function', () => {
      const { result } = renderHook(() => useConversationState('conv-1'));

      expect(typeof result.current.markAsRead).toBe('function');
    });
  });

  describe('typing indicators', () => {
    it('returns typing user IDs for conversation', () => {
      const { result } = renderHook(() => useConversationState('conv-1'));

      expect(Array.isArray(result.current.typingUserIds)).toBe(true);
    });
  });

  describe('presence', () => {
    it('returns isOtherUserOnline status', () => {
      const { result } = renderHook(() => useConversationState('conv-1'));

      expect(typeof result.current.isOtherUserOnline).toBe('boolean');
    });
  });

  describe('pagination', () => {
    it('provides fetchMoreMessages function', () => {
      const { result } = renderHook(() => useConversationState('conv-1'));

      expect(typeof result.current.fetchMoreMessages).toBe('function');
    });

    it('returns hasMore status', () => {
      const { result } = renderHook(() => useConversationState('conv-1'));

      expect(typeof result.current.hasMore).toBe('boolean');
    });
  });
});

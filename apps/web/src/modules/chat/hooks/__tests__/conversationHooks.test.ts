// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const { mockChatState, mockAuthStore, mockFriendStore, mockUnsubscribe } = vi.hoisted(() => ({
  mockChatState: {
    conversations: [
      {
        id: 'conv-1',
        name: null,
        participants: [
          { user_id: 'me', display_name: 'Me' },
          { user_id: 'user-2', display_name: 'Alice' },
        ],
      },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any[],
    messages: {
      'conv-1': [
        { id: 'm1', content: 'hi' },
        { id: 'm2', content: 'hey' },
      ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    isLoadingMessages: false,
    typingUsers: { 'conv-1': ['user-2'] } as Record<string, string[]>,
    hasMoreMessages: { 'conv-1': true } as Record<string, boolean>,
    fetchMessages: vi.fn().mockResolvedValue(undefined),
    sendMessage: vi.fn().mockResolvedValue(undefined),
    markAsRead: vi.fn(),
    setActiveConversation: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scheduledMessages: {} as Record<string, any[]>,
    fetchScheduledMessages: vi.fn().mockResolvedValue(undefined),
    cancelScheduledMessage: vi.fn().mockResolvedValue(undefined),
    isLoadingScheduledMessages: false,
  },
  mockAuthStore: { user: { id: 'me' } },
  mockFriendStore: {
    friends: [
      { id: 'f1', displayName: 'Bob', username: 'bob', avatarUrl: null },
      { id: 'f2', displayName: 'Carol', username: 'carol', avatarUrl: null },
    ],
    fetchFriends: vi.fn(),
  },
  mockUnsubscribe: vi.fn(),
}));

vi.mock('@/modules/chat/store', () => {
  const storeSelector = vi.fn((selector?: (s: typeof mockChatState) => unknown) => {
    if (typeof selector === 'function') return selector(mockChatState);
    return mockChatState;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (storeSelector as any).getState = () => mockChatState;
  return { useChatStore: storeSelector, Message: {}, Conversation: {} };
});

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: vi.fn(() => mockAuthStore),
}));

vi.mock('@/modules/social/store', () => ({
  useFriendStore: vi.fn(() => mockFriendStore),
}));

vi.mock('@/lib/socket', () => ({
  socketManager: {
    isUserOnline: vi.fn(() => false),
    onStatusChange: vi.fn(() => mockUnsubscribe),
  },
}));

vi.mock('@/lib/apiUtils', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getParticipantUserId: vi.fn((p: any) => p?.user_id ?? null),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getParticipantDisplayName: vi.fn((p: any) => p?.display_name ?? 'Unknown'),
}));

vi.mock('@/shared/components/ui', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('@/lib/animations/AnimationEngine', () => ({
  HapticFeedback: { success: vi.fn(), error: vi.fn(), medium: vi.fn(), light: vi.fn() },
}));

import { useConversationState } from '../useConversationState';
import { useScheduledMessages } from '../useScheduledMessages';

// ─── useConversationState ────────────────────────────────────────────────────

describe('useConversationState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null conversation when conversationId is undefined', () => {
    const { result } = renderHook(() => useConversationState(undefined));
    expect(result.current.conversation).toBeNull();
    expect(result.current.messages).toEqual([]);
    expect(result.current.typingUserIds).toEqual([]);
  });

  it('finds the correct conversation from store', () => {
    const { result } = renderHook(() => useConversationState('conv-1'));
    expect(result.current.conversation).toEqual(mockChatState.conversations[0]);
  });

  it('returns messages for the conversation', () => {
    const { result } = renderHook(() => useConversationState('conv-1'));
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].content).toBe('hi');
  });

  it('returns empty messages for unknown conversation', () => {
    const { result } = renderHook(() => useConversationState('conv-unknown'));
    expect(result.current.messages).toEqual([]);
  });

  it('extracts typing user IDs excluding self', () => {
    const { result } = renderHook(() => useConversationState('conv-1'));
    expect(result.current.typingUserIds).toEqual(['user-2']);
  });

  it('resolves other participant and name', () => {
    const { result } = renderHook(() => useConversationState('conv-1'));
    expect(result.current.otherParticipantUserId).toBe('user-2');
    expect(result.current.conversationName).toBe('Alice');
  });

  it('calculates mutual friends from friend store', () => {
    const { result } = renderHook(() => useConversationState('conv-1'));
    expect(result.current.mutualFriends).toHaveLength(2);
    expect(result.current.mutualFriends[0].username).toBe('Bob');
  });

  it('sets active conversation on mount and clears on unmount', () => {
    const { unmount } = renderHook(() => useConversationState('conv-1'));
    expect(mockChatState.setActiveConversation).toHaveBeenCalledWith('conv-1');

    unmount();
    expect(mockChatState.setActiveConversation).toHaveBeenCalledWith(null);
  });

  it('hasMore reflects store state', () => {
    const { result } = renderHook(() => useConversationState('conv-1'));
    expect(result.current.hasMore).toBe(true);
  });

  it('fetchMessages calls store action', async () => {
    const { result } = renderHook(() => useConversationState('conv-1'));

    await act(async () => {
      await result.current.fetchMessages();
    });

    expect(mockChatState.fetchMessages).toHaveBeenCalledWith('conv-1');
  });

  it('sendMessage calls store action with options', async () => {
    const { result } = renderHook(() => useConversationState('conv-1'));

    await act(async () => {
      await result.current.sendMessage('Hello!', { replyToId: 'r1' });
    });

    expect(mockChatState.sendMessage).toHaveBeenCalledWith('conv-1', 'Hello!', 'r1', {
      type: 'text',
      metadata: undefined,
    });
  });

  it('markAsRead calls store action', () => {
    const { result } = renderHook(() => useConversationState('conv-1'));

    act(() => {
      result.current.markAsRead();
    });

    expect(mockChatState.markAsRead).toHaveBeenCalledWith('conv-1');
  });
});

// ─── useScheduledMessages ────────────────────────────────────────────────────

describe('useScheduledMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChatState.scheduledMessages = {};
  });

  it('returns empty groups when no scheduled messages', () => {
    const { result } = renderHook(() => useScheduledMessages('conv-1', true));

    expect(result.current.groupedMessages.today).toEqual([]);
    expect(result.current.groupedMessages.tomorrow).toEqual([]);
    expect(result.current.groupedMessages.thisWeek).toEqual([]);
    expect(result.current.groupedMessages.later).toEqual([]);
    expect(result.current.totalScheduled).toBe(0);
  });

  it('fetches scheduled messages when isOpen is true', () => {
    renderHook(() => useScheduledMessages('conv-1', true));
    expect(mockChatState.fetchScheduledMessages).toHaveBeenCalledWith('conv-1');
  });

  it('does not fetch when isOpen is false', () => {
    renderHook(() => useScheduledMessages('conv-1', false));
    expect(mockChatState.fetchScheduledMessages).not.toHaveBeenCalled();
  });

  it('groups messages into time-based categories', () => {
    const now = new Date();
    const later = new Date(now);
    later.setDate(later.getDate() + 30);

    mockChatState.scheduledMessages = {
      'conv-1': [{ id: 's1', content: 'later', scheduledAt: later.toISOString() }],
    };

    const { result } = renderHook(() => useScheduledMessages('conv-1', true));
    expect(result.current.groupedMessages.later).toHaveLength(1);
    expect(result.current.totalScheduled).toBe(1);
  });

  it('handleCancel calls cancelScheduledMessage', async () => {
    const { result } = renderHook(() => useScheduledMessages('conv-1', true));

    await act(async () => {
      await result.current.handleCancel('msg-1');
    });

    expect(mockChatState.cancelScheduledMessage).toHaveBeenCalledWith('msg-1');
  });
});

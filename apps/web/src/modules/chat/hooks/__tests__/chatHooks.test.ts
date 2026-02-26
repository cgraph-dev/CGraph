import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ─── Mocks (hoisted so vi.mock factories can reference them) ─────────────────

const { mockChatState, mockApi } = vi.hoisted(() => ({
  mockChatState: {
    conversations: [] as Array<{ id: string; name?: string; participants: unknown[] }>,
    messages: {} as Record<string, unknown[]>,
    isLoadingMessages: false,
    typingUsers: {} as Record<string, string[]>,
    hasMoreMessages: {} as Record<string, boolean>,
    fetchMessages: vi.fn(),
    sendMessage: vi.fn(),
    markAsRead: vi.fn(),
    setActiveConversation: vi.fn(),
    editMessage: vi.fn(),
    deleteMessage: vi.fn(),
    scheduleMessage: vi.fn(),
    rescheduleMessage: vi.fn(),
  },
  mockApi: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

vi.mock('@/modules/chat/store', () => {
  const storeSelector = vi.fn((selector?: (s: typeof mockChatState) => unknown) => {
    if (typeof selector === 'function') return selector(mockChatState);
    return mockChatState;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (storeSelector as any).getState = () => mockChatState;
  return { useChatStore: storeSelector };
});

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: vi.fn(() => ({ user: { id: 'me' } })),
}));

vi.mock('@/modules/social/store', () => ({
  useFriendStore: vi.fn(() => ({ friends: [], fetchFriends: vi.fn() })),
}));

vi.mock('@/lib/api', () => ({ api: mockApi }));

vi.mock('@/lib/socket', () => ({
  socketManager: {
    isUserOnline: vi.fn(() => false),
    onStatusChange: vi.fn(() => vi.fn()),
  },
}));

vi.mock('@/lib/apiUtils', () => ({
  getParticipantUserId: vi.fn((p: Record<string, unknown> | null) => p?.user_id ?? null),
  getParticipantDisplayName: vi.fn(
    (p: Record<string, unknown> | null) => (p?.display_name as string) ?? 'Unknown'
  ),
}));

vi.mock('@/components/Toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('@/lib/animations/AnimationEngine', () => ({
  HapticFeedback: { success: vi.fn(), error: vi.fn(), medium: vi.fn(), light: vi.fn() },
}));

import { useMessageActions } from '../useMessageActions';
import { useConversationUI } from '../useConversationUI';
import { useMessageInputState } from '../useMessageInputState';

// ─── useMessageActions ───────────────────────────────────────────────────────

describe('useMessageActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state with all nulls and false', () => {
    const { result } = renderHook(() => useMessageActions());

    expect(result.current.activeMessageMenu).toBeNull();
    expect(result.current.editingMessageId).toBeNull();
    expect(result.current.editContent).toBe('');
    expect(result.current.messageToForward).toBeNull();
    expect(result.current.showForwardModal).toBe(false);
  });

  it('handleToggleMessageMenu should toggle menu for a message', () => {
    const { result } = renderHook(() => useMessageActions());

    act(() => {
      result.current.handleToggleMessageMenu('msg-1');
    });
    expect(result.current.activeMessageMenu).toBe('msg-1');

    // Toggle same => close
    act(() => {
      result.current.handleToggleMessageMenu('msg-1');
    });
    expect(result.current.activeMessageMenu).toBeNull();
  });

  it('handleStartEdit should set editing state and close menu', () => {
    const { result } = renderHook(() => useMessageActions());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockMessage = { id: 'msg-1', content: 'Hello world' } as any;

    act(() => {
      result.current.handleToggleMessageMenu('msg-1');
    });
    expect(result.current.activeMessageMenu).toBe('msg-1');

    act(() => {
      result.current.handleStartEdit(mockMessage);
    });

    expect(result.current.editingMessageId).toBe('msg-1');
    expect(result.current.editContent).toBe('Hello world');
    expect(result.current.activeMessageMenu).toBeNull();
  });

  it('handleCancelEdit should clear editing state', () => {
    const { result } = renderHook(() => useMessageActions());

    act(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.current.handleStartEdit({ id: 'msg-1', content: 'test' } as any);
    });
    expect(result.current.editingMessageId).toBe('msg-1');

    act(() => {
      result.current.handleCancelEdit();
    });

    expect(result.current.editingMessageId).toBeNull();
    expect(result.current.editContent).toBe('');
  });

  it('handleSaveEdit should call editMessage and reset state', async () => {
    mockChatState.editMessage.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useMessageActions());

    act(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.current.handleStartEdit({ id: 'msg-99', content: 'original' } as any);
      result.current.setEditContent('updated content');
    });

    await act(async () => {
      await result.current.handleSaveEdit();
    });

    expect(mockChatState.editMessage).toHaveBeenCalledWith('msg-99', 'updated content');
    expect(result.current.editingMessageId).toBeNull();
    expect(result.current.editContent).toBe('');
  });

  it('handleSaveEdit should not proceed when editContent is empty', async () => {
    const { result } = renderHook(() => useMessageActions());

    // No editing started, so editContent is empty
    await act(async () => {
      await result.current.handleSaveEdit();
    });

    expect(mockChatState.editMessage).not.toHaveBeenCalled();
  });

  it('handleDeleteMessage should call deleteMessage and clear menu', async () => {
    mockChatState.deleteMessage.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useMessageActions());

    await act(async () => {
      await result.current.handleDeleteMessage('msg-42');
    });

    expect(mockChatState.deleteMessage).toHaveBeenCalledWith('msg-42');
    expect(result.current.activeMessageMenu).toBeNull();
  });

  it('handlePinMessage should call api and clear menu', async () => {
    mockApi.post.mockResolvedValueOnce({ data: {} });

    const { result } = renderHook(() => useMessageActions());

    await act(async () => {
      await result.current.handlePinMessage('msg-1', 'conv-1');
    });

    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/conversations/conv-1/messages/msg-1/pin');
    expect(result.current.activeMessageMenu).toBeNull();
  });

  it('handleOpenForward / handleCloseForward should manage forward modal state', () => {
    const { result } = renderHook(() => useMessageActions());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg = { id: 'msg-5', content: 'fwd', messageType: 'text' } as any;

    act(() => {
      result.current.handleOpenForward(msg);
    });

    expect(result.current.showForwardModal).toBe(true);
    expect(result.current.messageToForward).toBe(msg);

    act(() => {
      result.current.handleCloseForward();
    });

    expect(result.current.showForwardModal).toBe(false);
    expect(result.current.messageToForward).toBeNull();
  });
});

// ─── useConversationUI ───────────────────────────────────────────────────────

describe('useConversationUI', () => {
  it('should return default UI preferences', () => {
    const { result } = renderHook(() => useConversationUI());

    expect(result.current.uiPreferences.glassEffect).toBe('holographic');
    expect(result.current.uiPreferences.showParticles).toBe(true);
  });

  it('updatePreference should update a specific preference', () => {
    const { result } = renderHook(() => useConversationUI());

    act(() => {
      result.current.updatePreference('showParticles', false);
    });

    expect(result.current.uiPreferences.showParticles).toBe(false);
  });

  it('togglePanel should toggle specific panel', () => {
    const { result } = renderHook(() => useConversationUI());

    expect(result.current.panels.showSettings).toBe(false);

    act(() => {
      result.current.togglePanel('showSettings');
    });
    expect(result.current.panels.showSettings).toBe(true);

    act(() => {
      result.current.togglePanel('showSettings');
    });
    expect(result.current.panels.showSettings).toBe(false);
  });

  it('togglePanel with forceValue should set exact value', () => {
    const { result } = renderHook(() => useConversationUI());

    act(() => {
      result.current.togglePanel('showInfoPanel', true);
    });
    expect(result.current.panels.showInfoPanel).toBe(true);

    // Force same value again
    act(() => {
      result.current.togglePanel('showInfoPanel', true);
    });
    expect(result.current.panels.showInfoPanel).toBe(true);
  });

  it('closeAllPanels should reset all panels to false', () => {
    const { result } = renderHook(() => useConversationUI());

    act(() => {
      result.current.togglePanel('showSettings');
      result.current.togglePanel('showInfoPanel');
    });
    expect(result.current.panels.showSettings).toBe(true);
    expect(result.current.panels.showInfoPanel).toBe(true);

    act(() => {
      result.current.closeAllPanels();
    });

    expect(result.current.panels.showSettings).toBe(false);
    expect(result.current.panels.showInfoPanel).toBe(false);
    expect(result.current.panels.showE2EETester).toBe(false);
    expect(result.current.panels.showMessageSearch).toBe(false);
    expect(result.current.panels.showScheduledList).toBe(false);
  });
});

// ─── useMessageInputState ────────────────────────────────────────────────────

describe('useMessageInputState', () => {
  it('should return empty initial state', () => {
    const { result } = renderHook(() => useMessageInputState());

    expect(result.current.messageInput).toBe('');
    expect(result.current.isSending).toBe(false);
    expect(result.current.replyTo).toBeNull();
    expect(result.current.pickers.showStickerPicker).toBe(false);
    expect(result.current.pickers.showGifPicker).toBe(false);
    expect(result.current.pickers.showEmojiPicker).toBe(false);
    expect(result.current.pickers.isVoiceMode).toBe(false);
  });

  it('setMessageInput should update message input', () => {
    const { result } = renderHook(() => useMessageInputState());

    act(() => {
      result.current.setMessageInput('Hello!');
    });

    expect(result.current.messageInput).toBe('Hello!');
  });

  it('setReplyTo / clearReply should manage reply state', () => {
    const { result } = renderHook(() => useMessageInputState());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg = { id: 'msg-1', content: 'hi' } as any;

    act(() => {
      result.current.setReplyTo(msg);
    });
    expect(result.current.replyTo).toBe(msg);

    act(() => {
      result.current.clearReply();
    });
    expect(result.current.replyTo).toBeNull();
  });

  it('togglePicker should toggle a specific picker', () => {
    const { result } = renderHook(() => useMessageInputState());

    act(() => {
      result.current.togglePicker('showEmojiPicker');
    });
    expect(result.current.pickers.showEmojiPicker).toBe(true);

    act(() => {
      result.current.togglePicker('showEmojiPicker');
    });
    expect(result.current.pickers.showEmojiPicker).toBe(false);
  });

  it('closeAllPickers should reset all pickers', () => {
    const { result } = renderHook(() => useMessageInputState());

    act(() => {
      result.current.togglePicker('showEmojiPicker');
      result.current.togglePicker('isVoiceMode');
    });

    act(() => {
      result.current.closeAllPickers();
    });

    expect(result.current.pickers.showEmojiPicker).toBe(false);
    expect(result.current.pickers.isVoiceMode).toBe(false);
  });

  it('resetInputState should clear everything', () => {
    const { result } = renderHook(() => useMessageInputState());

    act(() => {
      result.current.setMessageInput('Draft message');
      result.current.setIsSending(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.current.setReplyTo({ id: 'msg-1' } as any);
      result.current.togglePicker('showGifPicker');
    });

    act(() => {
      result.current.resetInputState();
    });

    expect(result.current.messageInput).toBe('');
    expect(result.current.isSending).toBe(false);
    expect(result.current.replyTo).toBeNull();
    expect(result.current.pickers.showGifPicker).toBe(false);
  });
});

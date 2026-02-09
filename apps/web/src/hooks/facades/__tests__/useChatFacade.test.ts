/**
 * useChatFacade Unit Tests
 *
 * Tests for the chat composition facade hook.
 * Validates multi-store aggregation, derived message state, and action delegation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useChatFacade } from '../useChatFacade';

// ── Mock stores ────────────────────────────────────────────────────

const mockChatState: Record<string, unknown> = {
  conversations: [],
  activeConversationId: null,
  messages: {},
  isLoadingConversations: false,
  isLoadingMessages: false,
  hasMoreMessages: {},
  typingUsers: {},
  fetchConversations: vi.fn(),
  setActiveConversation: vi.fn(),
  createConversation: vi.fn(),
  fetchMessages: vi.fn(),
  sendMessage: vi.fn(),
  deleteMessage: vi.fn(),
  editMessage: vi.fn(),
  addReaction: vi.fn(),
  removeReaction: vi.fn(),
  setTypingUser: vi.fn(),
};

const mockEffectsState: Record<string, unknown> = {
  activeMessageEffect: { type: 'none', intensity: 0 },
};

const mockBubbleState = {
  style: { variant: 'default', borderRadius: 12, opacity: 1 },
};

vi.mock('@/modules/chat/store', () => ({
  useChatStore: vi.fn((sel: (s: typeof mockChatState) => unknown) => sel(mockChatState)),
  useChatEffectsStore: vi.fn((sel: (s: typeof mockEffectsState) => unknown) =>
    sel(mockEffectsState)
  ),
  useChatBubbleStore: vi.fn(() => mockBubbleState),
}));

// Helper to reset mutable mock state
function resetChatState() {
  mockChatState.conversations = [];
  mockChatState.activeConversationId = null;
  mockChatState.messages = {};
  mockChatState.isLoadingConversations = false;
  mockChatState.isLoadingMessages = false;
  mockChatState.hasMoreMessages = {};
  mockChatState.typingUsers = {};
}

describe('useChatFacade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChatState();
  });

  // ── Default state ────────────────────────────────────────────────

  it('returns empty conversations list by default', () => {
    const { result } = renderHook(() => useChatFacade());
    expect(result.current.conversations).toEqual([]);
  });

  it('returns null activeConversationId by default', () => {
    const { result } = renderHook(() => useChatFacade());
    expect(result.current.activeConversationId).toBeNull();
  });

  it('returns empty activeMessages when no active conversation', () => {
    const { result } = renderHook(() => useChatFacade());
    expect(result.current.activeMessages).toEqual([]);
  });

  it('returns false for hasMoreMessages when no active conversation', () => {
    const { result } = renderHook(() => useChatFacade());
    expect(result.current.hasMoreMessages).toBe(false);
  });

  it('returns loading states as false by default', () => {
    const { result } = renderHook(() => useChatFacade());
    expect(result.current.isLoadingConversations).toBe(false);
    expect(result.current.isLoadingMessages).toBe(false);
  });

  it('returns empty typingUsers by default', () => {
    const { result } = renderHook(() => useChatFacade());
    expect(result.current.typingUsers).toEqual({});
  });

  // ── Derived message state ────────────────────────────────────────

  it('returns messages for active conversation', () => {
    const msgs = [
      { id: 'msg-1', content: 'Hello' },
      { id: 'msg-2', content: 'World' },
    ];
    mockChatState.activeConversationId = 'conv-1';
    mockChatState.messages = { 'conv-1': msgs };

    const { result } = renderHook(() => useChatFacade());
    expect(result.current.activeMessages).toEqual(msgs);
  });

  it('returns empty array when active conversation has no messages', () => {
    mockChatState.activeConversationId = 'conv-new';
    mockChatState.messages = {};

    const { result } = renderHook(() => useChatFacade());
    expect(result.current.activeMessages).toEqual([]);
  });

  it('returns hasMoreMessages false when map says false', () => {
    mockChatState.activeConversationId = 'conv-1';
    mockChatState.hasMoreMessages = { 'conv-1': false };

    const { result } = renderHook(() => useChatFacade());
    expect(result.current.hasMoreMessages).toBe(false);
  });

  it('defaults hasMoreMessages to true for unknown conversation', () => {
    mockChatState.activeConversationId = 'conv-unknown';
    mockChatState.hasMoreMessages = {};

    const { result } = renderHook(() => useChatFacade());
    expect(result.current.hasMoreMessages).toBe(true);
  });

  // ── Populated state ──────────────────────────────────────────────

  it('exposes populated conversations', () => {
    const convos = [
      { id: 'c-1', name: 'General' },
      { id: 'c-2', name: 'Random' },
    ];
    mockChatState.conversations = convos;

    const { result } = renderHook(() => useChatFacade());
    expect(result.current.conversations).toHaveLength(2);
  });

  it('exposes populated typingUsers', () => {
    mockChatState.typingUsers = { 'conv-1': ['alice', 'bob'] };
    const { result } = renderHook(() => useChatFacade());
    expect(result.current.typingUsers).toEqual({ 'conv-1': ['alice', 'bob'] });
  });

  // ── Effects integration ──────────────────────────────────────────

  it('exposes activeEffect from effects store', () => {
    const { result } = renderHook(() => useChatFacade());
    expect(result.current.activeEffect).toEqual({ type: 'none', intensity: 0 });
  });

  it('exposes activeBubbleStyle from bubble store', () => {
    const { result } = renderHook(() => useChatFacade());
    expect(result.current.activeBubbleStyle).toEqual({
      variant: 'default',
      borderRadius: 12,
      opacity: 1,
    });
  });

  // ── Action delegation ────────────────────────────────────────────

  it('fetchConversations delegates to chat store', () => {
    const { result } = renderHook(() => useChatFacade());
    result.current.fetchConversations();
    expect(mockChatState.fetchConversations).toHaveBeenCalledOnce();
  });

  it('setActiveConversation delegates with id', () => {
    const { result } = renderHook(() => useChatFacade());
    result.current.setActiveConversation('conv-5');
    expect(mockChatState.setActiveConversation).toHaveBeenCalledWith('conv-5');
  });

  it('sendMessage delegates with correct args', () => {
    const { result } = renderHook(() => useChatFacade());
    result.current.sendMessage('conv-1', 'hi', undefined, undefined);
    expect(mockChatState.sendMessage).toHaveBeenCalledWith('conv-1', 'hi', undefined, undefined);
  });

  it('deleteMessage delegates with messageId', () => {
    const { result } = renderHook(() => useChatFacade());
    result.current.deleteMessage('msg-42');
    expect(mockChatState.deleteMessage).toHaveBeenCalledWith('msg-42');
  });

  it('editMessage delegates with messageId and content', () => {
    const { result } = renderHook(() => useChatFacade());
    result.current.editMessage('msg-42', 'edited');
    expect(mockChatState.editMessage).toHaveBeenCalledWith('msg-42', 'edited');
  });

  it('addReaction delegates with messageId and emoji', () => {
    const { result } = renderHook(() => useChatFacade());
    result.current.addReaction('msg-1', '👍');
    expect(mockChatState.addReaction).toHaveBeenCalledWith('msg-1', '👍');
  });

  it('removeReaction delegates with messageId and emoji', () => {
    const { result } = renderHook(() => useChatFacade());
    result.current.removeReaction('msg-1', '👍');
    expect(mockChatState.removeReaction).toHaveBeenCalledWith('msg-1', '👍');
  });

  it('setTypingUser delegates with all args', () => {
    const { result } = renderHook(() => useChatFacade());
    result.current.setTypingUser('conv-1', 'user-1', true, '2026-01-01');
    expect(mockChatState.setTypingUser).toHaveBeenCalledWith(
      'conv-1',
      'user-1',
      true,
      '2026-01-01'
    );
  });

  // ── Interface completeness ───────────────────────────────────────

  it('returns all 19 expected keys', () => {
    const { result } = renderHook(() => useChatFacade());
    const keys = Object.keys(result.current);

    const expected = [
      'conversations',
      'activeConversationId',
      'isLoadingConversations',
      'activeMessages',
      'isLoadingMessages',
      'hasMoreMessages',
      'typingUsers',
      'fetchConversations',
      'setActiveConversation',
      'createConversation',
      'fetchMessages',
      'sendMessage',
      'deleteMessage',
      'editMessage',
      'addReaction',
      'removeReaction',
      'setTypingUser',
      'activeEffect',
      'activeBubbleStyle',
    ];
    for (const k of expected) expect(keys).toContain(k);
    expect(keys).toHaveLength(expected.length);
  });

  it('all action properties are functions', () => {
    const { result } = renderHook(() => useChatFacade());
    const actions = [
      'fetchConversations',
      'setActiveConversation',
      'createConversation',
      'fetchMessages',
      'sendMessage',
      'deleteMessage',
      'editMessage',
      'addReaction',
      'removeReaction',
      'setTypingUser',
    ] as const;
    for (const a of actions) {
      expect(typeof result.current[a]).toBe('function');
    }
  });
});

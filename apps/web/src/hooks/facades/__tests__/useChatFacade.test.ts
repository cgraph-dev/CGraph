/**
 * useChatFacade Unit Tests
 *
 * Tests for the chat composition facade hook.
 * Validates multi-store aggregation, derived message state, and action delegation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useChatFacade } from '../useChatFacade';

// Mock all chat-related stores
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
  activeMessageEffect: {
    type: 'none',
    intensity: 0,
  },
};

const mockBubbleState = {
  style: {
    variant: 'default',
    borderRadius: 12,
    opacity: 1,
  },
};

vi.mock('@/modules/chat/store', () => ({
  useChatStore: vi.fn((selector: (s: typeof mockChatState) => unknown) => selector(mockChatState)),
  useChatEffectsStore: vi.fn((selector: (s: typeof mockEffectsState) => unknown) =>
    selector(mockEffectsState)
  ),
  useChatBubbleStore: vi.fn(() => mockBubbleState),
}));

describe('useChatFacade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('default state', () => {
    it('returns empty conversations list', () => {
      const { result } = renderHook(() => useChatFacade());
      expect(result.current.conversations).toEqual([]);
    });

    it('returns null activeConversationId', () => {
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

    it('returns empty typingUsers', () => {
      const { result } = renderHook(() => useChatFacade());
      expect(result.current.typingUsers).toEqual({});
    });

    it('returns loading states as false', () => {
      const { result } = renderHook(() => useChatFacade());
      expect(result.current.isLoadingConversations).toBe(false);
      expect(result.current.isLoadingMessages).toBe(false);
    });
  });

  describe('derived message state', () => {
    it('returns messages for active conversation', () => {
      const messages = [
        { id: 'msg-1', content: 'Hello' },
        { id: 'msg-2', content: 'World' },
      ];
      mockChatState.activeConversationId = 'conv-123';
      mockChatState.messages = { 'conv-123': messages };

      const { result } = renderHook(() => useChatFacade());
      expect(result.current.activeMessages).toEqual(messages);
    });

    it('returns empty array for conversation with no messages', () => {
      mockChatState.activeConversationId = 'conv-456';
      mockChatState.messages = {};

      const { result } = renderHook(() => useChatFacade());
      expect(result.current.activeMessages).toEqual([]);
    });

    it('returns hasMoreMessages for active conversation', () => {
      mockChatState.activeConversationId = 'conv-123';
      mockChatState.hasMoreMessages = { 'conv-123': false };

      const { result } = renderHook(() => useChatFacade());
      expect(result.current.hasMoreMessages).toBe(false);
    });

    it('defaults hasMoreMessages to true for unknown conversation', () => {
      mockChatState.activeConversationId = 'conv-unknown';
      mockChatState.hasMoreMessages = {};

      const { result } = renderHook(() => useChatFacade());
      expect(result.current.hasMoreMessages).toBe(true);
    });
  });

  describe('effects integration', () => {
    it('exposes activeEffect from effects store', () => {
      const { result } = renderHook(() => useChatFacade());
      expect(result.current.activeEffect).toEqual({
        type: 'none',
        intensity: 0,
      });
    });

    it('exposes activeBubbleStyle from bubble store', () => {
      const { result } = renderHook(() => useChatFacade());
      expect(result.current.activeBubbleStyle).toEqual({
        variant: 'default',
        borderRadius: 12,
        opacity: 1,
      });
    });
  });

  describe('interface completeness', () => {
    it('exposes all conversation actions', () => {
      const { result } = renderHook(() => useChatFacade());
      expect(typeof result.current.fetchConversations).toBe('function');
      expect(typeof result.current.setActiveConversation).toBe('function');
      expect(typeof result.current.createConversation).toBe('function');
    });

    it('exposes all message actions', () => {
      const { result } = renderHook(() => useChatFacade());
      expect(typeof result.current.fetchMessages).toBe('function');
      expect(typeof result.current.sendMessage).toBe('function');
      expect(typeof result.current.deleteMessage).toBe('function');
      expect(typeof result.current.editMessage).toBe('function');
    });

    it('exposes all reaction actions', () => {
      const { result } = renderHook(() => useChatFacade());
      expect(typeof result.current.addReaction).toBe('function');
      expect(typeof result.current.removeReaction).toBe('function');
    });

    it('exposes typing action', () => {
      const { result } = renderHook(() => useChatFacade());
      expect(typeof result.current.setTypingUser).toBe('function');
    });

    it('returns all expected keys', () => {
      const { result } = renderHook(() => useChatFacade());
      const keys = Object.keys(result.current);

      const expectedKeys = [
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

      for (const key of expectedKeys) {
        expect(keys).toContain(key);
      }
    });
  });
});

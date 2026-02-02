import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMessageInputState } from '../hooks/useMessageInputState';

describe('Chat Hooks', () => {
  describe('useMessageInputState', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useMessageInputState());

      expect(result.current.messageInput).toBe('');
      expect(result.current.isSending).toBe(false);
      expect(result.current.replyTo).toBeNull();
      expect(result.current.pickers.showEmojiPicker).toBe(false);
      expect(result.current.pickers.showGifPicker).toBe(false);
      expect(result.current.pickers.showStickerPicker).toBe(false);
      expect(result.current.pickers.isVoiceMode).toBe(false);
    });

    it('should update message input', () => {
      const { result } = renderHook(() => useMessageInputState());

      act(() => {
        result.current.setMessageInput('Hello, world!');
      });

      expect(result.current.messageInput).toBe('Hello, world!');
    });

    it('should toggle picker states', () => {
      const { result } = renderHook(() => useMessageInputState());

      // Toggle emoji picker on
      act(() => {
        result.current.togglePicker('showEmojiPicker');
      });
      expect(result.current.pickers.showEmojiPicker).toBe(true);

      // Toggle emoji picker off
      act(() => {
        result.current.togglePicker('showEmojiPicker');
      });
      expect(result.current.pickers.showEmojiPicker).toBe(false);
    });

    it('should force picker value when provided', () => {
      const { result } = renderHook(() => useMessageInputState());

      // Force to true
      act(() => {
        result.current.togglePicker('showGifPicker', true);
      });
      expect(result.current.pickers.showGifPicker).toBe(true);

      // Force to true again (should stay true)
      act(() => {
        result.current.togglePicker('showGifPicker', true);
      });
      expect(result.current.pickers.showGifPicker).toBe(true);

      // Force to false
      act(() => {
        result.current.togglePicker('showGifPicker', false);
      });
      expect(result.current.pickers.showGifPicker).toBe(false);
    });

    it('should close all pickers', () => {
      const { result } = renderHook(() => useMessageInputState());

      // Open multiple pickers
      act(() => {
        result.current.togglePicker('showEmojiPicker', true);
        result.current.togglePicker('showGifPicker', true);
        result.current.togglePicker('isVoiceMode', true);
      });

      expect(result.current.pickers.showEmojiPicker).toBe(true);
      expect(result.current.pickers.showGifPicker).toBe(true);
      expect(result.current.pickers.isVoiceMode).toBe(true);

      // Close all
      act(() => {
        result.current.closeAllPickers();
      });

      expect(result.current.pickers.showEmojiPicker).toBe(false);
      expect(result.current.pickers.showGifPicker).toBe(false);
      expect(result.current.pickers.showStickerPicker).toBe(false);
      expect(result.current.pickers.isVoiceMode).toBe(false);
    });

    it('should set and clear reply', () => {
      const { result } = renderHook(() => useMessageInputState());

      const mockMessage = {
        id: 'msg-123',
        content: 'Test message',
        senderId: 'user-1',
        senderUsername: 'testuser',
        createdAt: new Date().toISOString(),
      };

      // Set reply
      act(() => {
        result.current.setReplyTo(mockMessage as any);
      });
      expect(result.current.replyTo).toEqual(mockMessage);

      // Clear reply
      act(() => {
        result.current.clearReply();
      });
      expect(result.current.replyTo).toBeNull();
    });

    it('should reset all input state', () => {
      const { result } = renderHook(() => useMessageInputState());

      // Set various state
      act(() => {
        result.current.setMessageInput('Some message');
        result.current.setIsSending(true);
        result.current.setReplyTo({ id: 'msg-1' } as any);
        result.current.togglePicker('showEmojiPicker', true);
      });

      expect(result.current.messageInput).toBe('Some message');
      expect(result.current.isSending).toBe(true);
      expect(result.current.replyTo).not.toBeNull();
      expect(result.current.pickers.showEmojiPicker).toBe(true);

      // Reset all
      act(() => {
        result.current.resetInputState();
      });

      expect(result.current.messageInput).toBe('');
      expect(result.current.isSending).toBe(false);
      expect(result.current.replyTo).toBeNull();
      expect(result.current.pickers.showEmojiPicker).toBe(false);
    });

    it('should provide refs', () => {
      const { result } = renderHook(() => useMessageInputState());

      expect(result.current.messagesEndRef).toBeDefined();
      expect(result.current.messagesContainerRef).toBeDefined();
      expect(result.current.fileInputRef).toBeDefined();
      expect(result.current.typingTimeoutRef).toBeDefined();
    });
  });
});

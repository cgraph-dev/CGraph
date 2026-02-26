/**
 * Hook for message input state management.
 * @module
 */
import { useState, useCallback, useRef } from 'react';
import type { Message } from '@/modules/chat/store';

// ============================================================================
// Hook for managing message input and picker states
// ============================================================================

interface PickerStates {
  showStickerPicker: boolean;
  showGifPicker: boolean;
  showEmojiPicker: boolean;
  isVoiceMode: boolean;
}

interface UseMessageInputStateReturn {
  // Input state
  messageInput: string;
  setMessageInput: React.Dispatch<React.SetStateAction<string>>;
  isSending: boolean;
  setIsSending: React.Dispatch<React.SetStateAction<boolean>>;

  // Reply state
  replyTo: Message | null;
  setReplyTo: React.Dispatch<React.SetStateAction<Message | null>>;
  clearReply: () => void;

  // Picker states
  pickers: PickerStates;
  togglePicker: (picker: keyof PickerStates, forceValue?: boolean) => void;
  closeAllPickers: () => void;

  // Refs
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  typingTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;

  // Helpers
  resetInputState: () => void;
}

/**
 * unknown for the chat module.
 */
/**
 * Hook for managing message input state.
 * @returns The result.
 */
export function useMessageInputState(): UseMessageInputStateReturn {
  // Input state
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  // Picker states
  const [pickers, setPickers] = useState<PickerStates>({
    showStickerPicker: false,
    showGifPicker: false,
    showEmojiPicker: false,
    isVoiceMode: false,
  });

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear reply
  const clearReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  // Toggle a specific picker
  const togglePicker = useCallback((picker: keyof PickerStates, forceValue?: boolean) => {
    setPickers((prev) => ({
      ...prev,
      [picker]: forceValue !== undefined ? forceValue : !prev[picker],
    }));
  }, []);

  // Close all pickers
  const closeAllPickers = useCallback(() => {
    setPickers({
      showStickerPicker: false,
      showGifPicker: false,
      showEmojiPicker: false,
      isVoiceMode: false,
    });
  }, []);

  // Reset all input state
  const resetInputState = useCallback(() => {
    setMessageInput('');
    setIsSending(false);
    setReplyTo(null);
    closeAllPickers();
  }, [closeAllPickers]);

  return {
    messageInput,
    setMessageInput,
    isSending,
    setIsSending,
    replyTo,
    setReplyTo,
    clearReply,
    pickers,
    togglePicker,
    closeAllPickers,
    messagesEndRef,
    messagesContainerRef,
    fileInputRef,
    typingTimeoutRef,
    resetInputState,
  };
}

/**
 * useMessageInput hook - state and handlers for message input
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { Sticker } from '@/data/stickers';
import type { GifResult } from '@/modules/chat/components/gif-picker';
import type { MessagePayload, AttachmentMode, VoiceMessageData, ReplyInfo } from './types';

interface UseMessageInputOptions {
  onSend: (message: MessagePayload) => void;
  onTyping?: (isTyping: boolean) => void;
  replyTo?: ReplyInfo | null;
}

/**
 * unknown for the chat module.
 */
/**
 * Hook for managing message input.
 */
export function useMessageInput({ onSend, onTyping, replyTo }: UseMessageInputOptions) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentMode, setAttachmentMode] = useState<AttachmentMode>('none');
  const [isRecording, setIsRecording] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!onTyping) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    onTyping(true);

    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 3000);
  }, [onTyping]);

  // Handle message change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setMessage(value);
      handleTyping();

      // Check for @mentions
      const lastAtSymbol = value.lastIndexOf('@');
      if (lastAtSymbol !== -1 && lastAtSymbol >= value.lastIndexOf(' ')) {
        const query = value.slice(lastAtSymbol + 1);
        setMentionQuery(query);
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    },
    [handleTyping]
  );

  // Handle send
  const handleSend = useCallback(() => {
    if (!message.trim() && attachments.length === 0) return;

    onSend({
      content: message.trim(),
      attachments: attachments.length > 0 ? attachments : undefined,
      replyToId: replyTo?.id,
      type: 'text',
    });

    setMessage('');
    setAttachments([]);
    if (onTyping) onTyping(false);
    HapticFeedback.light();
  }, [message, attachments, replyTo, onSend, onTyping]);

  // Handle key press
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files].slice(0, 10)); // Max 10 files
    setAttachmentMode('none');
  }, []);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setAttachments((prev) => [...prev, ...files].slice(0, 10));
  }, []);

  // Remove attachment
  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    HapticFeedback.light();
  }, []);

  // Handle voice message
  const handleVoiceMessage = useCallback(
    (data: VoiceMessageData) => {
      onSend({
        content: '',
        type: 'voice',
        metadata: {
          audio: data.blob,
          duration: data.duration,
          waveform: data.waveform,
        },
      });
      setIsRecording(false);
      HapticFeedback.success();
    },
    [onSend]
  );

  // Handle sticker select
  const handleStickerSelect = useCallback(
    (sticker: Sticker) => {
      onSend({
        content: '',
        type: 'sticker',
        metadata: {
          stickerId: sticker.id,
          stickerName: sticker.name,
          stickerEmoji: sticker.emoji,
          stickerPackId: sticker.packId,
        },
      });
      setAttachmentMode('none');
      HapticFeedback.medium();
    },
    [onSend]
  );

  // Handle GIF select
  const handleGifSelect = useCallback(
    (gif: GifResult) => {
      onSend({
        content: '',
        type: 'gif',
        metadata: {
          gifId: gif.id,
          gifTitle: gif.title,
          gifUrl: gif.url,
          gifPreviewUrl: gif.previewUrl,
          gifWidth: gif.width,
          gifHeight: gif.height,
          gifSource: gif.source,
        },
      });
      setAttachmentMode('none');
      HapticFeedback.medium();
    },
    [onSend]
  );

  // Handle mention select
  const handleMentionSelect = useCallback(
    (username: string) => {
      const lastAtSymbol = message.lastIndexOf('@');
      setMessage(message.slice(0, lastAtSymbol) + `@${username} `);
      setShowMentions(false);
      inputRef.current?.focus();
    },
    [message]
  );

  // Toggle attachment mode
  const toggleAttachmentMode = useCallback((mode: AttachmentMode) => {
    setAttachmentMode((prev) => (prev === mode ? 'none' : mode));
  }, []);

  return {
    // State
    message,
    attachments,
    attachmentMode,
    isRecording,
    showMentions,
    mentionQuery,
    // Refs
    inputRef,
    fileInputRef,
    // Handlers
    handleChange,
    handleSend,
    handleKeyDown,
    handleFileSelect,
    handleDrop,
    removeAttachment,
    handleVoiceMessage,
    handleStickerSelect,
    handleGifSelect,
    handleMentionSelect,
    toggleAttachmentMode,
    setIsRecording,
    setAttachmentMode,
    setShowMentions,
  };
}

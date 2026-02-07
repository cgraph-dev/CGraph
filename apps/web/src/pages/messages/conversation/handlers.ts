/**
 * Message and media handler factories
 * Extracted from Conversation.tsx for modularity
 */

import { toast } from '@/shared/components/ui';
import { api } from '@/lib/api';
import { socketManager } from '@/lib/socket';
import { createLogger } from '@/lib/logger';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import type { Message } from '@/modules/chat/store';
import type { GifResult } from '@/modules/chat/components/GifPicker';
import type { Sticker } from '@/data/stickers';
import type { PendingE2EEMessage, UIPreferences, VoiceMessageData } from './types';

const logger = createLogger('ConversationHandlers');

interface MessageSendContext {
  conversationId: string;
  messageInput: string;
  replyTo: Message | null;
  isSending: boolean;
  uiPreferences: UIPreferences;
  sendMessage: (
    conversationId: string,
    content: string,
    replyToId?: string,
    options?: Record<string, unknown>
  ) => Promise<void>;
  setMessageInput: (value: string) => void;
  setReplyTo: (message: Message | null) => void;
  setIsSending: (value: boolean) => void;
  setPendingMessage: (message: PendingE2EEMessage | null) => void;
  setE2EEErrorMessage: (message: string) => void;
  setShowE2EEError: (show: boolean) => void;
  typingTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
}

/**
 * Create send message handler
 */
export function createSendHandler(ctx: MessageSendContext) {
  return async () => {
    const { conversationId, messageInput, replyTo, isSending, sendMessage } = ctx;
    if (!conversationId || !messageInput.trim() || isSending) return;

    ctx.setIsSending(true);
    try {
      await sendMessage(conversationId, messageInput.trim(), replyTo?.id);
      ctx.setMessageInput('');
      ctx.setReplyTo(null);

      // Stop typing indicator
      if (ctx.typingTimeoutRef.current) {
        clearTimeout(ctx.typingTimeoutRef.current);
      }
      socketManager.sendTyping(`conversation:${conversationId}`, false);
    } catch (error) {
      logger.warn('Failed to send message:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to send message. Please try again.';

      if (errorMessage.includes('Failed to encrypt message')) {
        ctx.setPendingMessage({
          content: messageInput.trim(),
          replyToId: replyTo?.id,
        });
        ctx.setE2EEErrorMessage(errorMessage);
        ctx.setShowE2EEError(true);
      } else {
        toast.error(errorMessage);
        ctx.setMessageInput('');
        ctx.setReplyTo(null);
      }
    } finally {
      ctx.setIsSending(false);
    }
  };
}

interface E2EERetryContext {
  conversationId: string;
  pendingMessage: PendingE2EEMessage | null;
  isSending: boolean;
  uiPreferences: UIPreferences;
  sendMessage: (
    conversationId: string,
    content: string,
    replyToId?: string,
    options?: Record<string, unknown>
  ) => Promise<void>;
  setMessageInput: (value: string) => void;
  setReplyTo: (message: Message | null) => void;
  setIsSending: (value: boolean) => void;
  setPendingMessage: (message: PendingE2EEMessage | null) => void;
  setE2EEErrorMessage: (message: string) => void;
  setShowE2EEError: (show: boolean) => void;
}

/**
 * Create E2EE retry handler
 */
export function createE2EERetryHandler(ctx: E2EERetryContext) {
  return async () => {
    const { pendingMessage, conversationId, isSending, sendMessage, uiPreferences } = ctx;
    if (!pendingMessage || !conversationId || isSending) return;

    ctx.setIsSending(true);
    try {
      await sendMessage(
        conversationId,
        pendingMessage.content,
        pendingMessage.replyToId,
        pendingMessage.options
      );
      ctx.setMessageInput('');
      ctx.setReplyTo(null);
      ctx.setPendingMessage(null);
      toast.success('Message sent with encryption');
      if (uiPreferences.enableHaptic) HapticFeedback.success();
    } catch (error) {
      logger.warn('Retry failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';

      if (errorMessage.includes('Failed to encrypt message')) {
        ctx.setE2EEErrorMessage(errorMessage);
        ctx.setShowE2EEError(true);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      ctx.setIsSending(false);
    }
  };
}

/**
 * Create unencrypted send handler
 */
export function createUnencryptedSendHandler(ctx: E2EERetryContext) {
  return async () => {
    const { pendingMessage, conversationId, isSending, sendMessage, uiPreferences } = ctx;
    if (!pendingMessage || !conversationId || isSending) return;

    ctx.setIsSending(true);
    try {
      await sendMessage(conversationId, pendingMessage.content, pendingMessage.replyToId, {
        ...pendingMessage.options,
        forceUnencrypted: true,
      });
      ctx.setMessageInput('');
      ctx.setReplyTo(null);
      ctx.setPendingMessage(null);
      toast.warning('Message sent without encryption');
      if (uiPreferences.enableHaptic) HapticFeedback.warning();
    } catch (error) {
      logger.warn('Failed to send unencrypted message:', error);
      toast.error('Failed to send message');
    } finally {
      ctx.setIsSending(false);
    }
  };
}

interface MediaSendContext {
  conversationId: string;
  replyTo: Message | null;
  uiPreferences: UIPreferences;
  sendMessage: (
    conversationId: string,
    content: string,
    replyToId?: string,
    options?: Record<string, unknown>
  ) => Promise<void>;
  setReplyTo: (message: Message | null) => void;
  setIsSending: (value: boolean) => void;
  setShowStickerPicker: (show: boolean) => void;
  setShowGifPicker: (show: boolean) => void;
}

/**
 * Create sticker select handler
 */
export function createStickerSelectHandler(ctx: MediaSendContext) {
  return async (sticker: Sticker) => {
    const { conversationId, replyTo, sendMessage, uiPreferences } = ctx;
    if (!conversationId) return;

    ctx.setIsSending(true);
    ctx.setShowStickerPicker(false);

    try {
      const stickerMessage = `[sticker:${sticker.id}:${sticker.emoji}:${sticker.name}]`;
      await sendMessage(conversationId, stickerMessage, replyTo?.id);
      ctx.setReplyTo(null);
      if (uiPreferences.enableHaptic) HapticFeedback.success();
    } catch (error) {
      logger.warn('Failed to send sticker:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send sticker.';
      toast.error(errorMessage);
      if (uiPreferences.enableHaptic) HapticFeedback.error();
    } finally {
      ctx.setIsSending(false);
    }
  };
}

/**
 * Create GIF select handler
 */
export function createGifSelectHandler(ctx: MediaSendContext) {
  return async (gif: GifResult) => {
    const { conversationId, replyTo, sendMessage, uiPreferences } = ctx;
    if (!conversationId) return;

    ctx.setIsSending(true);
    ctx.setShowGifPicker(false);

    try {
      await sendMessage(conversationId, gif.title || 'GIF', replyTo?.id, {
        type: 'gif',
        metadata: {
          gifUrl: gif.url,
          gifPreviewUrl: gif.previewUrl,
          gifTitle: gif.title,
          gifWidth: gif.width,
          gifHeight: gif.height,
          gifSource: gif.source,
        },
      });
      ctx.setReplyTo(null);
      toast.success('GIF sent');
      if (uiPreferences.enableHaptic) HapticFeedback.success();
    } catch (error) {
      logger.warn('Failed to send GIF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send GIF.';
      toast.error(errorMessage);
      if (uiPreferences.enableHaptic) HapticFeedback.error();
    } finally {
      ctx.setIsSending(false);
    }
  };
}

interface VoiceSendContext {
  conversationId: string;
  uiPreferences: UIPreferences;
  setIsSending: (value: boolean) => void;
  setIsVoiceMode: (mode: boolean) => void;
}

/**
 * Create voice message handler
 */
export function createVoiceCompleteHandler(ctx: VoiceSendContext) {
  return async (data: VoiceMessageData) => {
    const { conversationId, uiPreferences } = ctx;
    if (!conversationId) return;

    ctx.setIsSending(true);
    ctx.setIsVoiceMode(false);

    try {
      const formData = new FormData();
      formData.append('audio', data.blob, `voice_${Date.now()}.webm`);
      formData.append('duration', String(Math.round(data.duration)));
      formData.append('waveform', JSON.stringify(data.waveform));
      formData.append('conversation_id', conversationId);

      const response = await api.post('/api/v1/voice-messages', formData);

      if (response.data?.data) {
        toast.success('Voice message sent');
        if (uiPreferences.enableHaptic) HapticFeedback.success();
      }
    } catch (error) {
      logger.warn('Failed to send voice message:', error);
      toast.error('Failed to send voice message.');
      if (uiPreferences.enableHaptic) HapticFeedback.error();
    } finally {
      ctx.setIsSending(false);
    }
  };
}

interface FileSendContext {
  conversationId: string;
  replyTo: Message | null;
  uiPreferences: UIPreferences;
  sendMessage: (
    conversationId: string,
    content: string,
    replyToId?: string,
    options?: Record<string, unknown>
  ) => Promise<void>;
  setReplyTo: (message: Message | null) => void;
  setIsSending: (value: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

/**
 * Create file select handler
 */
export function createFileSelectHandler(ctx: FileSendContext) {
  return async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const { conversationId, replyTo, sendMessage, uiPreferences, fileInputRef } = ctx;
    if (!file || !conversationId) return;

    ctx.setIsSending(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('context', 'message');

      const uploadResponse = await api.post('/api/v1/upload', formData);
      const fileData = uploadResponse.data?.data;

      if (!fileData) {
        throw new Error('No file data returned from upload');
      }

      await sendMessage(conversationId, file.name, replyTo?.id, {
        type: 'file',
        metadata: {
          fileUrl: fileData.url,
          fileName: fileData.filename,
          fileSize: fileData.size,
          fileMimeType: fileData.content_type,
          thumbnailUrl: fileData.thumbnail_url,
        },
      });

      ctx.setReplyTo(null);
      toast.success('File sent');
      if (uiPreferences.enableHaptic) HapticFeedback.success();
    } catch (error) {
      logger.warn('Failed to send file:', error);
      toast.error('Failed to send file');
      if (uiPreferences.enableHaptic) HapticFeedback.error();
    } finally {
      ctx.setIsSending(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
}

/**
 * Message send and E2EE handler factories
 * Extracted from handlers.ts for modularity
 */

import { toast } from '@/shared/components/ui';
import { socketManager } from '@/lib/socket';
import { createLogger } from '@/lib/logger';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { Message } from '@/modules/chat/store';
import type { PendingE2EEMessage, UIPreferences } from './types';

const logger = createLogger('ConversationHandlers');

export interface MessageSendContext {
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

export interface E2EERetryContext {
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

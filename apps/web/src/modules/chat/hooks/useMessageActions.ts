/**
 * useMessageActions Hook
 *
 * Extracts message action handlers from the Conversation page.
 * Handles edit, delete, pin, forward, and menu state.
 *
 * @module hooks/useMessageActions
 * @version 1.0.0
 */

import { useState, useCallback } from 'react';
import { useChatStore, Message } from '@/modules/chat/store';
import { api } from '@/lib/api';
import { toast } from '@/components/feedback/toast';
import { createLogger } from '@/lib/logger';
import { HapticFeedback } from '@/lib/animations/animation-engine';

const logger = createLogger('MessageActions');

export interface MessageActionsState {
  activeMessageMenu: string | null;
  editingMessageId: string | null;
  editContent: string;
  messageToForward: Message | null;
  showForwardModal: boolean;
}

export interface MessageActionsHandlers {
  // Menu
  handleToggleMessageMenu: (messageId: string) => void;
  closeMessageMenu: () => void;

  // Edit
  handleStartEdit: (message: Message) => void;
  handleCancelEdit: () => void;
  handleSaveEdit: () => Promise<void>;
  setEditContent: (content: string) => void;

  // Delete
  handleDeleteMessage: (messageId: string) => Promise<void>;

  // Pin
  handlePinMessage: (messageId: string, conversationId: string) => Promise<void>;

  // Forward
  handleOpenForward: (message: Message, enableHaptic?: boolean) => void;
  handleCloseForward: () => void;
  handleForwardMessage: (
    conversationIds: string[],
    sendMessage: (
      conversationId: string,
      content: string,
      replyToId?: string,
      options?: Record<string, unknown>
    ) => Promise<void>,
    enableHaptic?: boolean
  ) => Promise<void>;
}

export interface UseMessageActionsReturn extends MessageActionsState, MessageActionsHandlers {}

export function useMessageActions(): UseMessageActionsReturn {
  const [activeMessageMenu, setActiveMessageMenu] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [messageToForward, setMessageToForward] = useState<Message | null>(null);
  const [showForwardModal, setShowForwardModal] = useState(false);

  // Toggle message action menu
  const handleToggleMessageMenu = useCallback((messageId: string) => {
    setActiveMessageMenu((prev) => (prev === messageId ? null : messageId));
  }, []);

  const closeMessageMenu = useCallback(() => {
    setActiveMessageMenu(null);
  }, []);

  // Start editing a message
  const handleStartEdit = useCallback((message: Message) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
    setActiveMessageMenu(null);
  }, []);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditContent('');
  }, []);

  // Save edited message
  const handleSaveEdit = useCallback(async () => {
    if (!editingMessageId || !editContent.trim()) return;

    try {
      const { editMessage } = useChatStore.getState();
      await editMessage(editingMessageId, editContent.trim());
      toast.success('Message edited');
      setEditingMessageId(null);
      setEditContent('');
    } catch (error) {
      logger.warn('Failed to edit message:', error);
      toast.error('Failed to edit message');
    }
  }, [editingMessageId, editContent]);

  // Delete a message
  const handleDeleteMessage = useCallback(async (messageId: string) => {
    try {
      const { deleteMessage } = useChatStore.getState();
      await deleteMessage(messageId);
      toast.success('Message deleted');
      setActiveMessageMenu(null);
    } catch (error) {
      logger.warn('Failed to delete message:', error);
      toast.error('Failed to delete message');
    }
  }, []);

  // Pin a message
  const handlePinMessage = useCallback(async (messageId: string, conversationId: string) => {
    try {
      await api.post(`/api/v1/conversations/${conversationId}/messages/${messageId}/pin`);
      toast.success('Message pinned');
      setActiveMessageMenu(null);
    } catch (error) {
      logger.warn('Failed to pin message:', error);
      toast.error('Failed to pin message');
    }
  }, []);

  // Open forward modal
  const handleOpenForward = useCallback((message: Message, enableHaptic = false) => {
    setMessageToForward(message);
    setShowForwardModal(true);
    setActiveMessageMenu(null);
    if (enableHaptic) HapticFeedback.medium();
  }, []);

  // Close forward modal
  const handleCloseForward = useCallback(() => {
    setShowForwardModal(false);
    setMessageToForward(null);
  }, []);

  // Forward message to selected conversations
  const handleForwardMessage = useCallback(
    async (
      conversationIds: string[],
      sendMessage: (
        conversationId: string,
        content: string,
        replyToId?: string,
        options?: Record<string, unknown>
      ) => Promise<void>,
      enableHaptic = false
    ) => {
      if (!messageToForward) return;

      try {
        const forwardPromises = conversationIds.map((targetConversationId) => {
          const forwardedContent =
            messageToForward.messageType === 'text'
              ? messageToForward.content
              : `[Forwarded ${messageToForward.messageType}]`;

          return sendMessage(targetConversationId, forwardedContent, undefined, {
            type: messageToForward.messageType,
            metadata: {
              ...messageToForward.metadata,
              forwarded: true,
              originalSenderId: messageToForward.senderId,
              originalMessageId: messageToForward.id,
            },
          });
        });

        await Promise.all(forwardPromises);

        const count = conversationIds.length;
        toast.success(`Message forwarded to ${count} conversation${count > 1 ? 's' : ''}`);
        if (enableHaptic) HapticFeedback.success();
      } catch (error) {
        logger.warn('Failed to forward message:', error);
        toast.error('Failed to forward message');
        if (enableHaptic) HapticFeedback.error();
      }
    },
    [messageToForward]
  );

  return {
    // State
    activeMessageMenu,
    editingMessageId,
    editContent,
    messageToForward,
    showForwardModal,

    // Handlers
    handleToggleMessageMenu,
    closeMessageMenu,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    setEditContent,
    handleDeleteMessage,
    handlePinMessage,
    handleOpenForward,
    handleCloseForward,
    handleForwardMessage,
  };
}

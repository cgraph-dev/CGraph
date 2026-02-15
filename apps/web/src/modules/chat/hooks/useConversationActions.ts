import { useState, useCallback } from 'react';
import { useChatStore, Message } from '@/modules/chat/store';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';
import { toast } from '@/components/feedback/Toast';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';

const logger = createLogger('ConversationActions');

export interface MessageActionState {
  activeMessageMenu: string | null;
  editingMessageId: string | null;
  editContent: string;
  showForwardModal: boolean;
  messageToForward: Message | null;
  showScheduleModal: boolean;
  messageToSchedule: string;
  messageToReschedule: Message | null;
  showScheduledList: boolean;
}

export interface MessageActionHandlers {
  handleToggleMessageMenu: (messageId: string) => void;
  handleStartEdit: (message: Message) => void;
  handleCancelEdit: () => void;
  handleSaveEdit: () => Promise<void>;
  handleDeleteMessage: (messageId: string) => Promise<void>;
  handlePinMessage: (messageId: string) => Promise<void>;
  handleOpenForward: (message: Message, enableHaptic: boolean) => void;
  handleForwardMessage: (conversationIds: string[]) => Promise<void>;
  handleSchedule: (scheduledAt: Date) => Promise<void>;
  handleRescheduleClick: (message: Message) => void;
  setActiveMessageMenu: (id: string | null) => void;
  setEditContent: (content: string) => void;
  setShowForwardModal: (show: boolean) => void;
  setMessageToForward: (message: Message | null) => void;
  setShowScheduleModal: (show: boolean) => void;
  setMessageToSchedule: (content: string) => void;
  setMessageToReschedule: (message: Message | null) => void;
  setShowScheduledList: (show: boolean) => void;
}

export function useConversationActions(
  conversationId: string | undefined
): MessageActionState & MessageActionHandlers {
  // State
  const [activeMessageMenu, setActiveMessageMenu] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [messageToForward, setMessageToForward] = useState<Message | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [messageToSchedule, setMessageToSchedule] = useState('');
  const [messageToReschedule, setMessageToReschedule] = useState<Message | null>(null);
  const [showScheduledList, setShowScheduledList] = useState(false);

  // Get store functions
  const sendMessage = useChatStore((state) => state.sendMessage);
  const scheduleMessage = useChatStore((state) => state.scheduleMessage);
  const rescheduleMessage = useChatStore((state) => state.rescheduleMessage);

  // Toggle message menu
  const handleToggleMessageMenu = useCallback((messageId: string) => {
    setActiveMessageMenu((prev) => (prev === messageId ? null : messageId));
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
    if (!conversationId || !editingMessageId || !editContent.trim()) return;

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
  }, [conversationId, editingMessageId, editContent]);

  // Delete a message
  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      if (!conversationId) return;

      try {
        const { deleteMessage } = useChatStore.getState();
        await deleteMessage(messageId);
        toast.success('Message deleted');
        setActiveMessageMenu(null);
      } catch (error) {
        logger.warn('Failed to delete message:', error);
        toast.error('Failed to delete message');
      }
    },
    [conversationId]
  );

  // Pin a message
  const handlePinMessage = useCallback(
    async (messageId: string) => {
      if (!conversationId) return;

      try {
        await api.post(`/api/v1/conversations/${conversationId}/messages/${messageId}/pin`);
        toast.success('Message pinned');
        setActiveMessageMenu(null);
      } catch (error) {
        logger.warn('Failed to pin message:', error);
        toast.error('Failed to pin message');
      }
    },
    [conversationId]
  );

  // Open forward modal
  const handleOpenForward = useCallback((message: Message, enableHaptic: boolean) => {
    setMessageToForward(message);
    setShowForwardModal(true);
    setActiveMessageMenu(null);
    if (enableHaptic) HapticFeedback.medium();
  }, []);

  // Forward message to selected conversations
  const handleForwardMessage = useCallback(
    async (conversationIds: string[]) => {
      if (!messageToForward) return;

      try {
        // Forward to each selected conversation
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
              originalMessageId: messageToForward.id,
              originalSenderId: messageToForward.senderId,
            },
          });
        });

        await Promise.all(forwardPromises);
        toast.success(`Message forwarded to ${conversationIds.length} conversation(s)`);
        setShowForwardModal(false);
        setMessageToForward(null);
      } catch (error) {
        logger.warn('Failed to forward message:', error);
        toast.error('Failed to forward message');
      }
    },
    [messageToForward, sendMessage]
  );

  // Schedule message
  const handleSchedule = useCallback(
    async (scheduledAt: Date) => {
      if (!conversationId || !messageToSchedule.trim()) return;

      try {
        if (messageToReschedule) {
          await rescheduleMessage(messageToReschedule.id, scheduledAt);
          toast.success('Message rescheduled');
        } else {
          await scheduleMessage(conversationId, messageToSchedule.trim(), scheduledAt);
          toast.success('Message scheduled');
        }
        setShowScheduleModal(false);
        setMessageToSchedule('');
        setMessageToReschedule(null);
      } catch (error) {
        logger.warn('Failed to schedule message:', error);
        toast.error('Failed to schedule message');
      }
    },
    [conversationId, messageToSchedule, messageToReschedule, scheduleMessage, rescheduleMessage]
  );

  // Handle reschedule click
  const handleRescheduleClick = useCallback((message: Message) => {
    setMessageToReschedule(message);
    setMessageToSchedule(message.content);
    setShowScheduleModal(true);
  }, []);

  return {
    // State
    activeMessageMenu,
    editingMessageId,
    editContent,
    showForwardModal,
    messageToForward,
    showScheduleModal,
    messageToSchedule,
    messageToReschedule,
    showScheduledList,
    // Handlers
    handleToggleMessageMenu,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleDeleteMessage,
    handlePinMessage,
    handleOpenForward,
    handleForwardMessage,
    handleSchedule,
    handleRescheduleClick,
    // Setters
    setActiveMessageMenu,
    setEditContent,
    setShowForwardModal,
    setMessageToForward,
    setShowScheduleModal,
    setMessageToSchedule,
    setMessageToReschedule,
    setShowScheduledList,
  };
}

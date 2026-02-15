/**
 * useScheduleMessage Hook
 *
 * Handles message scheduling state and actions.
 *
 * @module hooks/useScheduleMessage
 * @version 1.0.0
 */

import { useState, useCallback } from 'react';
import { useChatStore, Message } from '@/modules/chat/store';
import { toast } from '@/components/feedback/Toast';
import { createLogger } from '@/lib/logger';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';

const logger = createLogger('ScheduleMessage');

export interface ScheduleMessageState {
  showScheduleModal: boolean;
  messageToSchedule: string;
  showScheduledList: boolean;
  messageToReschedule: Message | null;
}

export interface ScheduleMessageHandlers {
  setShowScheduleModal: (show: boolean) => void;
  setMessageToSchedule: (message: string) => void;
  setShowScheduledList: (show: boolean) => void;
  setMessageToReschedule: (message: Message | null) => void;
  handleSchedule: (
    scheduledAt: Date,
    conversationId: string,
    replyToId?: string,
    enableHaptic?: boolean
  ) => Promise<void>;
  handleRescheduleClick: (message: Message, enableHaptic?: boolean) => void;
  openScheduleModal: (messageContent: string) => void;
  closeScheduleModal: () => void;
}

export function useScheduleMessage(): ScheduleMessageState & ScheduleMessageHandlers {
  const scheduleMessage = useChatStore((state) => state.scheduleMessage);
  const rescheduleMessage = useChatStore((state) => state.rescheduleMessage);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [messageToSchedule, setMessageToSchedule] = useState('');
  const [showScheduledList, setShowScheduledList] = useState(false);
  const [messageToReschedule, setMessageToReschedule] = useState<Message | null>(null);

  const handleSchedule = useCallback(
    async (scheduledAt: Date, conversationId: string, replyToId?: string, enableHaptic = false) => {
      if (messageToReschedule) {
        try {
          await rescheduleMessage(messageToReschedule.id, scheduledAt);
          setMessageToReschedule(null);
          setShowScheduleModal(false);
          setMessageToSchedule('');
          if (enableHaptic) HapticFeedback.success();
        } catch (error) {
          logger.warn('Failed to reschedule message:', error);
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to reschedule message';
          toast.error(errorMessage);
          if (enableHaptic) HapticFeedback.error();
          throw error;
        }
      } else if (messageToSchedule.trim()) {
        try {
          await scheduleMessage(conversationId, messageToSchedule, scheduledAt, {
            type: 'text',
            replyToId,
          });
          setMessageToSchedule('');
          setShowScheduleModal(false);
          if (enableHaptic) HapticFeedback.success();
        } catch (error) {
          logger.warn('Failed to schedule message:', error);
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to schedule message';
          toast.error(errorMessage);
          if (enableHaptic) HapticFeedback.error();
          throw error;
        }
      }
    },
    [messageToReschedule, messageToSchedule, rescheduleMessage, scheduleMessage]
  );

  const handleRescheduleClick = useCallback((message: Message, enableHaptic = false) => {
    setMessageToReschedule(message);
    setMessageToSchedule(message.content);
    setShowScheduledList(false);
    setShowScheduleModal(true);
    if (enableHaptic) HapticFeedback.medium();
  }, []);

  const openScheduleModal = useCallback((messageContent: string) => {
    setMessageToSchedule(messageContent);
    setShowScheduleModal(true);
  }, []);

  const closeScheduleModal = useCallback(() => {
    setShowScheduleModal(false);
    setMessageToSchedule('');
    setMessageToReschedule(null);
  }, []);

  return {
    showScheduleModal,
    messageToSchedule,
    showScheduledList,
    messageToReschedule,
    setShowScheduleModal,
    setMessageToSchedule,
    setShowScheduledList,
    setMessageToReschedule,
    handleSchedule,
    handleRescheduleClick,
    openScheduleModal,
    closeScheduleModal,
  };
}

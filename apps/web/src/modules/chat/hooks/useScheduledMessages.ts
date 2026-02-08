import { useEffect, useState, useMemo } from 'react';
import { isPast, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { createLogger } from '@/lib/logger';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { useChatStore, Message } from '@/modules/chat/store';
import { toast } from '@/shared/components/ui';

const logger = createLogger('ScheduledMessagesList');

export interface GroupedMessages {
  today: Message[];
  tomorrow: Message[];
  thisWeek: Message[];
  later: Message[];
}

export function useScheduledMessages(conversationId: string, isOpen: boolean) {
  const {
    scheduledMessages,
    fetchScheduledMessages,
    cancelScheduledMessage,
    isLoadingScheduledMessages,
  } = useChatStore();

  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const messages = scheduledMessages[conversationId] || [];

  useEffect(() => {
    if (isOpen && conversationId) {
      fetchScheduledMessages(conversationId);
    }
  }, [isOpen, conversationId, fetchScheduledMessages]);

  const handleCancel = async (messageId: string) => {
    setCancelingId(messageId);
    try {
      await cancelScheduledMessage(messageId);
      toast.success('Scheduled message cancelled');
      HapticFeedback.success();
    } catch (error) {
      logger.error('Failed to cancel scheduled message:', error);
      toast.error('Failed to cancel message');
      HapticFeedback.error();
    } finally {
      setCancelingId(null);
    }
  };

  const groupedMessages = useMemo<GroupedMessages>(() => {
    const groups: GroupedMessages = {
      today: [],
      tomorrow: [],
      thisWeek: [],
      later: [],
    };

    messages.forEach((message) => {
      if (!message.scheduledAt) return;
      const scheduledDate = new Date(message.scheduledAt);
      if (isPast(scheduledDate)) return;

      if (isToday(scheduledDate)) {
        groups.today.push(message);
      } else if (isTomorrow(scheduledDate)) {
        groups.tomorrow.push(message);
      } else if (isThisWeek(scheduledDate)) {
        groups.thisWeek.push(message);
      } else {
        groups.later.push(message);
      }
    });

    return groups;
  }, [messages]);

  const totalScheduled = useMemo(
    () => Object.values(groupedMessages).flat().length,
    [groupedMessages]
  );

  return {
    groupedMessages,
    totalScheduled,
    isLoadingScheduledMessages,
    cancelingId,
    handleCancel,
  };
}

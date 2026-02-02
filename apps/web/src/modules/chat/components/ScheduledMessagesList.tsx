import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ScheduledMessagesList');
import {
  ClockIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { format, formatDistanceToNow, isPast, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { useChatStore, Message } from '@/stores/chatStore';
import { toast } from '@/components/Toast';

interface ScheduledMessagesListProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  onReschedule: (message: Message) => void;
}

/**
 * ScheduledMessagesList Component
 *
 * Displays and manages scheduled messages for a conversation.
 *
 * Features:
 * - Grouped by time (Today, Tomorrow, This Week, Later)
 * - Message preview with countdown
 * - Cancel and reschedule actions
 * - Smooth animations
 * - Glassmorphism design
 */
export function ScheduledMessagesList({
  isOpen,
  onClose,
  conversationId,
  onReschedule,
}: ScheduledMessagesListProps) {
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

  // Group messages by time
  const groupedMessages = {
    today: [] as Message[],
    tomorrow: [] as Message[],
    thisWeek: [] as Message[],
    later: [] as Message[],
  };

  messages.forEach((message) => {
    if (!message.scheduledAt) return;
    const scheduledDate = new Date(message.scheduledAt);

    if (isPast(scheduledDate)) {
      // Message should have been sent already
      return;
    }

    if (isToday(scheduledDate)) {
      groupedMessages.today.push(message);
    } else if (isTomorrow(scheduledDate)) {
      groupedMessages.tomorrow.push(message);
    } else if (isThisWeek(scheduledDate)) {
      groupedMessages.thisWeek.push(message);
    } else {
      groupedMessages.later.push(message);
    }
  });

  const totalScheduled = Object.values(groupedMessages).flat().length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-hidden"
          >
            <GlassCard className="flex h-full flex-col p-0">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-purple-500/20 p-2">
                    <ClockIcon className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Scheduled Messages</h2>
                    <p className="text-sm text-gray-400">
                      {totalScheduled} {totalScheduled === 1 ? 'message' : 'messages'} scheduled
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={onClose}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <XMarkIcon className="h-5 w-5" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {isLoadingScheduledMessages ? (
                  <div className="flex items-center justify-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="h-8 w-8 rounded-full border-2 border-primary-500 border-t-transparent"
                    />
                  </div>
                ) : totalScheduled === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-4 rounded-full bg-dark-800/50 p-6">
                      <CalendarIcon className="h-12 w-12 text-gray-500" />
                    </div>
                    <p className="mb-2 text-lg font-medium text-gray-300">No scheduled messages</p>
                    <p className="text-sm text-gray-500">
                      Schedule messages to send them at a specific time
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Today */}
                    {groupedMessages.today.length > 0 && (
                      <div>
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-400">
                          <div className="h-px flex-1 bg-gradient-to-r from-primary-500/50 to-transparent" />
                          TODAY
                          <div className="h-px flex-1 bg-gradient-to-l from-primary-500/50 to-transparent" />
                        </h3>
                        <div className="space-y-3">
                          {groupedMessages.today.map((message) => (
                            <ScheduledMessageCard
                              key={message.id}
                              message={message}
                              onCancel={handleCancel}
                              onReschedule={() => onReschedule(message)}
                              isCanceling={cancelingId === message.id}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tomorrow */}
                    {groupedMessages.tomorrow.length > 0 && (
                      <div>
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-400">
                          <div className="h-px flex-1 bg-gradient-to-r from-purple-500/50 to-transparent" />
                          TOMORROW
                          <div className="h-px flex-1 bg-gradient-to-l from-purple-500/50 to-transparent" />
                        </h3>
                        <div className="space-y-3">
                          {groupedMessages.tomorrow.map((message) => (
                            <ScheduledMessageCard
                              key={message.id}
                              message={message}
                              onCancel={handleCancel}
                              onReschedule={() => onReschedule(message)}
                              isCanceling={cancelingId === message.id}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* This Week */}
                    {groupedMessages.thisWeek.length > 0 && (
                      <div>
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-400">
                          <div className="h-px flex-1 bg-gradient-to-r from-blue-500/50 to-transparent" />
                          THIS WEEK
                          <div className="h-px flex-1 bg-gradient-to-l from-blue-500/50 to-transparent" />
                        </h3>
                        <div className="space-y-3">
                          {groupedMessages.thisWeek.map((message) => (
                            <ScheduledMessageCard
                              key={message.id}
                              message={message}
                              onCancel={handleCancel}
                              onReschedule={() => onReschedule(message)}
                              isCanceling={cancelingId === message.id}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Later */}
                    {groupedMessages.later.length > 0 && (
                      <div>
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-400">
                          <div className="h-px flex-1 bg-gradient-to-r from-gray-500/50 to-transparent" />
                          LATER
                          <div className="h-px flex-1 bg-gradient-to-l from-gray-500/50 to-transparent" />
                        </h3>
                        <div className="space-y-3">
                          {groupedMessages.later.map((message) => (
                            <ScheduledMessageCard
                              key={message.id}
                              message={message}
                              onCancel={handleCancel}
                              onReschedule={() => onReschedule(message)}
                              isCanceling={cancelingId === message.id}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface ScheduledMessageCardProps {
  message: Message;
  onCancel: (messageId: string) => void;
  onReschedule: () => void;
  isCanceling: boolean;
}

function ScheduledMessageCard({
  message,
  onCancel,
  onReschedule,
  isCanceling,
}: ScheduledMessageCardProps) {
  const scheduledDate = new Date(message.scheduledAt!);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="group rounded-xl border border-white/10 bg-dark-800/50 p-4 transition-all hover:border-primary-500/30"
    >
      <div className="mb-2 flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-400">
              {format(scheduledDate, 'h:mm a')}
            </span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(scheduledDate, { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-gray-400">{format(scheduledDate, 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="flex gap-1">
          <motion.button
            onClick={() => {
              onReschedule();
              HapticFeedback.light();
            }}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-500/20 hover:text-blue-400"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Reschedule"
          >
            <PencilIcon className="h-4 w-4" />
          </motion.button>
          <motion.button
            onClick={() => {
              onCancel(message.id);
              HapticFeedback.light();
            }}
            disabled={isCanceling}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50"
            whileHover={!isCanceling ? { scale: 1.1 } : {}}
            whileTap={!isCanceling ? { scale: 0.9 } : {}}
            title="Cancel"
          >
            {isCanceling ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="h-4 w-4 rounded-full border-2 border-red-400 border-t-transparent"
              />
            ) : (
              <TrashIcon className="h-4 w-4" />
            )}
          </motion.button>
        </div>
      </div>
      <p className="line-clamp-2 text-white">{message.content}</p>
    </motion.div>
  );
}

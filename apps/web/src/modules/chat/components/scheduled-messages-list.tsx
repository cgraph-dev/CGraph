/**
 * Scheduled messages list component.
 * @module
 */
import { motion, AnimatePresence } from 'framer-motion';
import { ClockIcon, XMarkIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { Message } from '@/modules/chat/store';
import { springs } from '@/lib/animation-presets/presets';
import {
  useScheduledMessages,
  type GroupedMessages,
} from '@/modules/chat/hooks/useScheduledMessages';
import { ScheduledMessageCard } from '@/modules/chat/components/scheduled-message-card';
import { tweens, loop } from '@/lib/animation-presets';

interface ScheduledMessagesListProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  onReschedule: (message: Message) => void;
}

const GROUP_CONFIG: { key: keyof GroupedMessages; label: string; color: string }[] = [
  { key: 'today', label: 'TODAY', color: 'primary' },
  { key: 'tomorrow', label: 'TOMORROW', color: 'purple' },
  { key: 'thisWeek', label: 'THIS WEEK', color: 'blue' },
  { key: 'later', label: 'LATER', color: 'gray' },
];

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
  const { groupedMessages, totalScheduled, isLoadingScheduledMessages, cancelingId, handleCancel } =
    useScheduledMessages(conversationId, isOpen);

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
            transition={springs.stiff}
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
                      transition={loop(tweens.slow)}
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
                    {GROUP_CONFIG.map(({ key, label, color }) =>
                      groupedMessages[key].length > 0 ? (
                        <div key={key}>
                          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-400">
                            <div
                              className={`h-px flex-1 bg-gradient-to-r from-${color}-500/50 to-transparent`}
                            />
                            {label}
                            <div
                              className={`h-px flex-1 bg-gradient-to-l from-${color}-500/50 to-transparent`}
                            />
                          </h3>
                          <div className="space-y-3">
                            {groupedMessages[key].map((message) => (
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
                      ) : null
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

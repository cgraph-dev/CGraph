import { motion } from 'framer-motion';
import { ClockIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { format, formatDistanceToNow } from 'date-fns';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import type { Message } from '@/modules/chat/store';

interface ScheduledMessageCardProps {
  message: Message;
  onCancel: (messageId: string) => void;
  onReschedule: () => void;
  isCanceling: boolean;
}

export function ScheduledMessageCard({
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

/**
 * Scheduled message time preview display.
 * @module
 */
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { formatTimeUntil } from '@/modules/chat/components/scheduleMessageUtils';

interface ScheduledTimePreviewProps {
  scheduledAt: Date;
}

/**
 * unknown for the chat module.
 */
/**
 * Scheduled Time Preview component.
 */
export function ScheduledTimePreview({ scheduledAt }: ScheduledTimePreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-xl border border-primary-500/20 bg-gradient-to-r from-primary-500/10 to-purple-500/10 p-4"
    >
      <p className="mb-1 text-sm font-medium text-gray-300">Message will be sent:</p>
      <p className="text-lg font-bold text-white">{format(scheduledAt, 'EEEE, MMMM d, yyyy')}</p>
      <p className="text-md text-primary-400">at {format(scheduledAt, 'h:mm a')}</p>
      <p className="mt-2 text-xs text-gray-500">{formatTimeUntil(scheduledAt)}</p>
    </motion.div>
  );
}

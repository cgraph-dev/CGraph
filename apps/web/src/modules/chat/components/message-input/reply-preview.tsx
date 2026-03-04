/**
 * ReplyPreview component - shows the message being replied to
 */

import { motion, AnimatePresence } from 'motion/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { ReplyInfo } from './types';

interface ReplyPreviewProps {
  replyTo: ReplyInfo | null | undefined;
  onCancel?: () => void;
}

/**
 * unknown for the chat module.
 */
/**
 * Reply Preview component.
 */
export function ReplyPreview({ replyTo, onCancel }: ReplyPreviewProps) {
  return (
    <AnimatePresence>
      {replyTo && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="mb-2 flex items-center gap-2 rounded-lg border-l-2 border-primary-500 bg-dark-800/50 px-4 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-primary-400">Replying to {replyTo.author}</p>
              <p className="truncate text-sm text-gray-400">{replyTo.content}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onCancel}
              className="rounded-full p-1 hover:bg-dark-700"
            >
              <XMarkIcon className="h-4 w-4 text-gray-400" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

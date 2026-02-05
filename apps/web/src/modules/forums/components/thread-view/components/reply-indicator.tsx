/**
 * Reply Indicator Component
 * @module modules/forums/components/thread-view/components/reply-indicator
 */

import { motion, AnimatePresence } from 'framer-motion';

interface ReplyIndicatorProps {
  replyToId: string | undefined;
  onCancel: () => void;
}

export function ReplyIndicator({ replyToId, onCancel }: ReplyIndicatorProps) {
  return (
    <AnimatePresence>
      {replyToId && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-3 flex items-center gap-2 rounded-lg border border-primary-500/30 bg-primary-500/10 px-3 py-2 text-sm"
        >
          <span className="text-gray-400">Replying to comment</span>
          <button onClick={onCancel} className="ml-auto text-gray-400 hover:text-white">
            ✕ Cancel
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

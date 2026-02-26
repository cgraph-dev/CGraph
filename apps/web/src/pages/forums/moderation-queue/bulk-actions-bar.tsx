/**
 * BulkActionsBar component
 * @module pages/forums/moderation-queue
 */

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, TrashIcon } from '@heroicons/react/24/outline';

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkApprove: () => void;
  onBulkReject: () => void;
}

/**
 * unknown for the forums module.
 */
/**
 * Bulk Actions Bar component.
 */
export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onBulkApprove,
  onBulkReject,
}: BulkActionsBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center justify-between rounded-xl border border-primary-500/30 bg-primary-500/10 p-4"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={onClearSelection}
              className="rounded-lg bg-dark-700 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-dark-600"
            >
              Clear
            </button>
            <span className="text-sm text-gray-400">
              {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex gap-2">
            <motion.button
              onClick={onBulkReject}
              className="flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/30"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <TrashIcon className="h-4 w-4" />
              Reject All
            </motion.button>
            <motion.button
              onClick={onBulkApprove}
              className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <CheckCircleIcon className="h-4 w-4" />
              Approve All
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

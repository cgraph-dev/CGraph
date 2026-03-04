/**
 * Delete channel confirmation modal
 * @module modules/groups/components/group-settings
 */

import { motion, AnimatePresence } from 'motion/react';

interface DeleteChannelModalProps {
  deleteConfirmId: string | null;
  onDelete: (channelId: string) => void;
  onClose: () => void;
}

/**
 * unknown for the groups module.
 */
/**
 * Delete Channel Modal dialog component.
 */
export function DeleteChannelModal({
  deleteConfirmId,
  onDelete,
  onClose,
}: DeleteChannelModalProps) {
  return (
    <AnimatePresence>
      {deleteConfirmId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm space-y-4 rounded-xl border border-white/[0.08] bg-[rgb(30,32,40)] p-6 shadow-2xl"
          >
            <h3 className="text-lg font-semibold text-white">Delete Channel</h3>
            <p className="text-sm text-gray-400">
              This will permanently delete the channel and all its messages. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onDelete(deleteConfirmId)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * DeleteEmojiModal - Confirmation dialog for emoji deletion
 *
 * @module modules/groups/components/group-settings
 */

import { motion, AnimatePresence } from 'framer-motion';

interface DeleteEmojiModalProps {
  deleteConfirmId: string | null;
  onConfirm: (emojiId: string) => void;
  onCancel: () => void;
}

/**
 * unknown for the groups module.
 */
/**
 * Delete Emoji Modal dialog component.
 */
export function DeleteEmojiModal({ deleteConfirmId, onConfirm, onCancel }: DeleteEmojiModalProps) {
  return (
    <AnimatePresence>
      {deleteConfirmId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm space-y-4 rounded-xl border border-gray-700 bg-dark-900 p-6 shadow-2xl"
          >
            <h3 className="text-lg font-semibold text-white">Delete Emoji</h3>
            <p className="text-sm text-gray-400">
              This emoji will be permanently removed and can no longer be used in messages.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={onCancel}
                className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onConfirm(deleteConfirmId)}
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

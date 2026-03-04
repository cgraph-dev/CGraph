/**
 * RejectModal component
 * @module pages/forums/moderation-queue
 */

import { motion, AnimatePresence } from 'motion/react';

interface RejectModalProps {
  isOpen: boolean;
  reason: string;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * unknown for the forums module.
 */
/**
 * Reject Modal dialog component.
 */
export function RejectModal({
  isOpen,
  reason,
  onReasonChange,
  onConfirm,
  onCancel,
}: RejectModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
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
            className="w-full max-w-md rounded-2xl border border-dark-600 bg-dark-800 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-bold text-white">Reject Content</h3>
            <p className="mb-4 text-sm text-gray-400">
              Please provide a reason for rejecting this content.
            </p>
            <textarea
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Reason for rejection..."
              className="mb-4 h-24 w-full rounded-lg border border-dark-500 bg-dark-700 p-3 text-sm text-white placeholder-gray-500 outline-none focus:border-red-500"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={onCancel}
                className="rounded-lg bg-dark-700 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-dark-600"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={!reason.trim()}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

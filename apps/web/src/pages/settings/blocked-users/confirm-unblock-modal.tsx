/**
 * Confirmation modal for unblocking a user
 */

import { motion, AnimatePresence } from 'motion/react';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import type { BlockedUser } from './types';

interface ConfirmUnblockModalProps {
  show: boolean;
  user: BlockedUser | null;
  isPending: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

/**
 * unknown for the settings module.
 */
/**
 * Confirm Unblock Modal dialog component.
 */
export function ConfirmUnblockModal({
  show,
  user,
  isPending,
  onConfirm,
  onDismiss,
}: ConfirmUnblockModalProps) {
  return (
    <AnimatePresence>
      {show && user && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={onDismiss}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-dark-600 bg-dark-800 shadow-2xl"
          >
            <div className="p-6">
              <div className="mb-4 flex items-center gap-4">
                {user.blockedUser.avatarUrl ? (
                  <ThemedAvatar
                    src={user.blockedUser.avatarUrl}
                    alt={user.blockedUser.displayName}
                    size="large"
                    className="h-16 w-16"
                    avatarBorderId={
                      user.blockedUser.avatarBorderId ?? user.blockedUser.avatar_border_id ?? null
                    }
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gray-600 to-gray-700 text-2xl font-bold text-white">
                    {user.blockedUser.displayName?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Unblock {user.blockedUser.displayName}?
                  </h3>
                  <p className="text-sm text-gray-400">@{user.blockedUser.username}</p>
                </div>
              </div>

              <p className="mb-6 text-gray-400">
                They will be able to send you messages and view your profile again. You can block
                them again at any time.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={onDismiss}
                  className="flex-1 rounded-xl bg-dark-700 py-2.5 text-gray-300 transition-colors hover:bg-dark-600"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Unblocking...
                    </>
                  ) : (
                    'Unblock'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

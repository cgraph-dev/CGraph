/**
 * E2EE encryption error modal dialog.
 * @module
 */
import { motion, AnimatePresence } from 'motion/react';
import { springs } from '@/lib/animation-presets';
import {
  ShieldExclamationIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { ShieldCheckIcon } from '@heroicons/react/24/solid';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';

interface E2EEErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  onSendUnencrypted: () => void;
  errorMessage: string;
  recipientName?: string;
}

/**
 * E2EEErrorModal Component
 *
 * Displays a prominent warning when end-to-end encryption fails.
 * Ensures users understand the security implications and make an informed choice.
 *
 * Features:
 * - Clear explanation of what went wrong
 * - Security implications warning
 * - Three action options: Retry, Send Unencrypted (with warning), Cancel
 * - Prominent visual design with icons and color coding
 */
export function E2EEErrorModal({
  isOpen,
  onClose,
  onRetry,
  onSendUnencrypted,
  errorMessage,
  recipientName = 'this contact',
}: E2EEErrorModalProps) {
  const handleRetry = () => {
    HapticFeedback.medium();
    onRetry();
    onClose();
  };

  const handleSendUnencrypted = () => {
    HapticFeedback.warning();
    onSendUnencrypted();
    onClose();
  };

  const handleCancel = () => {
    HapticFeedback.light();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={handleCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={springs.stiff}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <GlassCard variant="neon" glow className="relative overflow-hidden">
              {/* Close Button */}
              <button
                onClick={handleCancel}
                className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>

              {/* Icon Header */}
              <div className="flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, ...springs.dramatic }}
                  className="mb-4 rounded-full bg-red-500/20 p-4"
                >
                  <ShieldExclamationIcon className="h-12 w-12 text-red-400" />
                </motion.div>

                <h2 className="mb-2 text-2xl font-bold text-white">Encryption Failed</h2>

                <p className="mb-6 text-sm text-gray-300">
                  Your message to{' '}
                  <span className="font-semibold text-primary-400">{recipientName}</span> could not
                  be encrypted
                </p>
              </div>

              {/* Error Details */}
              <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                <div className="mb-2 flex items-center gap-2 text-red-400">
                  <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-semibold">What happened?</span>
                </div>
                <p className="text-sm text-gray-300">{errorMessage}</p>
              </div>

              {/* Security Warning */}
              <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
                <div className="mb-2 flex items-center gap-2 text-green-400">
                  <ShieldCheckIcon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-semibold">Your privacy is protected</span>
                </div>
                <p className="text-sm text-gray-300">
                  Your message was <span className="font-bold text-green-400">NOT sent</span> to
                  prevent exposing unencrypted content. This protects your privacy.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Retry Button (Recommended) */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRetry}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 py-3 font-semibold text-white shadow-lg shadow-primary-500/30 transition-all hover:bg-primary-600 hover:shadow-primary-500/50"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                  Retry with Encryption
                  <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-xs">
                    Recommended
                  </span>
                </motion.button>

                {/* Send Unencrypted Button (Warning) */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSendUnencrypted}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-orange-500/50 bg-orange-500/10 px-6 py-3 font-semibold text-orange-400 transition-all hover:border-orange-500 hover:bg-orange-500/20"
                >
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  Send Unencrypted (Not Recommended)
                </motion.button>

                {/* Cancel Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCancel}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04]/50 px-6 py-3 font-semibold text-gray-300 transition-all hover:border-gray-500 hover:bg-white/[0.04]"
                >
                  Cancel
                </motion.button>
              </div>

              {/* Help Text */}
              <p className="mt-4 text-center text-xs text-gray-500">
                If encryption keeps failing, try checking your internet connection or contact
                support.
              </p>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

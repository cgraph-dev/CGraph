import { motion } from 'framer-motion';
import { PaperClipIcon, SparklesIcon } from '@heroicons/react/24/outline';
import type { EditorActionsProps } from './types';

/**
 * EditorActions Component
 *
 * Bottom action bar with attachment, poll, NSFW toggle,
 * and submit/cancel buttons
 */
export function EditorActions({
  allowAttachments,
  allowPoll,
  allowNsfw,
  showPollCreator,
  isNsfw,
  setIsNsfw,
  setShowPollCreator,
  isSubmitting,
  canSubmit,
  onSubmit,
  onCancel,
  onFileSelect,
  submitLabel,
  primaryColor,
}: EditorActionsProps) {
  return (
    <div className="flex items-center gap-3 border-t border-dark-700 bg-dark-800/50 p-4">
      {allowAttachments && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onFileSelect}
          className="rounded-lg bg-dark-600 p-2 text-gray-400 hover:text-white"
          title="Attach files"
        >
          <PaperClipIcon className="h-5 w-5" />
        </motion.button>
      )}

      {allowPoll && !showPollCreator && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowPollCreator(true)}
          className="rounded-lg bg-dark-600 p-2 text-gray-400 hover:text-white"
          title="Add poll"
        >
          <SparklesIcon className="h-5 w-5" />
        </motion.button>
      )}

      {allowNsfw && (
        <label className="flex items-center gap-2 text-sm text-gray-400">
          <input
            type="checkbox"
            checked={isNsfw}
            onChange={(e) => setIsNsfw(e.target.checked)}
            className="rounded"
          />
          NSFW
        </label>
      )}

      <div className="flex-1" />

      {onCancel && (
        <button onClick={onCancel} className="px-4 py-2 text-gray-400 hover:text-white">
          Cancel
        </button>
      )}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onSubmit}
        disabled={!canSubmit || isSubmitting}
        className="rounded-lg px-6 py-2 font-medium text-white disabled:opacity-50"
        style={{ backgroundColor: primaryColor }}
      >
        {isSubmitting ? 'Posting...' : submitLabel}
      </motion.button>
    </div>
  );
}

export default EditorActions;

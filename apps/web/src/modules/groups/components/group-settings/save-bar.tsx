/**
 * SaveBar component
 * @module modules/groups/components/group-settings
 */

import { motion, AnimatePresence } from 'motion/react';

interface SaveBarProps {
  hasChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onReset: () => void;
}

/**
 * unknown for the groups module.
 */
/**
 * Save Bar component.
 */
export function SaveBar({ hasChanges, isSaving, onSave, onReset }: SaveBarProps) {
  return (
    <AnimatePresence>
      {hasChanges && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 border-t border-white/[0.06] bg-[rgb(30,32,40)]/[0.90] p-4 backdrop-blur-sm"
        >
          <div className="mx-auto flex max-w-2xl items-center justify-between">
            <p className="text-sm text-gray-400">You have unsaved changes</p>
            <div className="flex gap-3">
              <button
                onClick={onReset}
                className="rounded-lg bg-white/[0.06] px-4 py-2 text-gray-300 hover:bg-white/[0.10]"
              >
                Reset
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onSave}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2 font-semibold text-white"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

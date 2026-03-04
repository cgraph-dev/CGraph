/**
 * TitlePreviewModal — modal overlay showing a title preview
 */

import { motion, AnimatePresence } from 'motion/react';
import { TitleBadge } from '@/modules/gamification/components/title-badge';
import type { TitleRarity } from '@/data/titles';
import type { TitlePreviewModalProps } from './types';

/**
 * unknown for the settings module.
 */
/**
 * Title Preview Modal dialog component.
 */
export function TitlePreviewModal({
  previewTitle,
  displayName,
  getRarityColor,
  onClose,
}: TitlePreviewModalProps) {
  return (
    <AnimatePresence>
      {previewTitle && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 p-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-xl font-bold">Title Preview</h3>

            <div className="mb-4 flex items-center justify-center gap-3 rounded-lg bg-gray-800 p-4">
              <span className="text-lg font-semibold">{displayName}</span>
              <TitleBadge title={previewTitle.id} />
            </div>

            <div className="mb-4 space-y-2">
              <p className="text-sm text-gray-400">{previewTitle.description}</p>
              <div className="flex items-center gap-2 text-sm">
                <span className="capitalize text-gray-400">Rarity:</span>
                { }
                <span className={getRarityColor(previewTitle.rarity as TitleRarity)}> // safe downcast – structural boundary
                  {previewTitle.rarity}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full rounded-lg bg-purple-500 px-4 py-2 text-white transition-colors hover:bg-purple-600"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

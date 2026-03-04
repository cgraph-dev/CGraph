/**
 * Badge Preview Modal
 */

import { motion, AnimatePresence } from 'motion/react';
import { RARITY_COLORS } from './constants';
import type { BadgePreviewModalProps } from './types';

/**
 * unknown for the settings module.
 */
/**
 * Badge Preview Modal dialog component.
 */
export function BadgePreviewModal({ badge, onClose }: BadgePreviewModalProps) {
  const getRarityColor = (rarity: string) => RARITY_COLORS[rarity] || RARITY_COLORS.common;

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md rounded-lg border border-white/[0.08] bg-[rgb(30,32,40)] p-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 text-center">
              <div className="mb-3 text-6xl">{badge.icon}</div>
              <h3 className="mb-2 text-xl font-bold">{badge.name}</h3>
              <p className="mb-4 text-sm text-gray-400">{badge.description}</p>

              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <span className="text-gray-400">Rarity:</span>
                  <span className={`capitalize ${getRarityColor(badge.rarity)}`}>
                    {badge.rarity}
                  </span>
                </div>

                {badge.requirement && (
                  <div className="text-sm text-gray-400">
                    <strong>Requirement:</strong> {badge.requirement}
                  </div>
                )}

                {!badge.isUnlocked && badge.progress !== undefined && (
                  <div className="mt-2">
                    <div className="mb-1 text-sm text-gray-400">
                      Progress: {Math.round(badge.progress)}%
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/[0.06]">
                      <div
                        className="h-2 rounded-full bg-purple-500 transition-all"
                        style={{ width: `${badge.progress}%` }}
                      />
                    </div>
                  </div>
                )}
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

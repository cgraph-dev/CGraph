/**
 * BadgePickerModal
 *
 * Full-screen modal for selecting a badge to equip.
 * Shows a grid of available (unequipped) achievements.
 *
 * @module gamification/components/badges/BadgePickerModal
 */

import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { AnimatedBadgeWithTooltip } from './animated-badge';
import type { Achievement } from '@/modules/gamification/store';

export interface BadgePickerModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Badges available for equipping */
  unequippedBadges: Achievement[];
  /** Called when user selects a badge */
  onSelect: (badge: Achievement) => void;
  /** Close the modal */
  onClose: () => void;
}

/**
 * unknown for the gamification module.
 */
/**
 * Badge Picker Modal dialog component.
 */
export function BadgePickerModal({
  isOpen,
  unequippedBadges,
  onSelect,
  onClose,
}: BadgePickerModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

          {/* Picker content */}
          <motion.div
            className={cn(
              'relative z-10 w-full max-w-lg',
              'rounded-2xl bg-dark-800',
              'border border-white/10',
              'shadow-2xl shadow-black/50',
              'overflow-hidden'
            )}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div className="flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-primary-400" />
                <h2 className="text-lg font-bold text-white">Select Badge</h2>
              </div>
              <button
                className="rounded-lg p-1 transition-colors hover:bg-white/10"
                onClick={onClose}
              >
                <XMarkIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Badge grid */}
            <div className="max-h-[400px] overflow-y-auto p-4">
              {unequippedBadges.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-400">No more badges available</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Unlock more achievements to equip them here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                  {unequippedBadges.map((badge) => (
                    <motion.button
                      key={badge.id}
                      className={cn(
                        'rounded-xl p-2',
                        'bg-dark-700/50 hover:bg-dark-600/50',
                        'border border-transparent hover:border-primary-500/30',
                        'transition-colors'
                      )}
                      onClick={() => onSelect(badge)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <AnimatedBadgeWithTooltip
                        achievement={badge}
                        size="sm"
                        animated
                        showProgress={false}
                      />
                      <p className="mt-1 truncate text-center text-[10px] text-gray-400">
                        {badge.title}
                      </p>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="border-t border-white/10 bg-dark-700/50 px-4 py-3">
              <p className="text-center text-xs text-gray-500">
                Equipped badges are visible on your profile across all forums
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

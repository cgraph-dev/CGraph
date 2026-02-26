/**
 * Equipped Badges Panel
 */

import { motion } from 'framer-motion';
import type { EquippedBadgesPanelProps } from './types';

/**
 * unknown for the settings module.
 */
/**
 * Equipped Badges Panel component.
 */
export function EquippedBadgesPanel({
  equippedBadges,
  badges,
  onUnequip,
}: EquippedBadgesPanelProps) {
  if (equippedBadges.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="mb-6 rounded-lg border border-purple-500/30 bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-400">
          Currently Equipped ({equippedBadges.length}/5)
        </h3>
        <div className="flex flex-wrap gap-3">
          {equippedBadges.map((badgeId) => {
            const badge = badges.find((b) => b.id === badgeId);
            if (!badge) return null;

            return (
              <motion.div
                key={badgeId}
                className="flex items-center gap-2 rounded-lg border border-purple-500/50 bg-gray-800 px-3 py-2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <span className="text-2xl">{badge.icon}</span>
                <span className="text-sm font-medium">{badge.name}</span>
                <button
                  onClick={() => onUnequip(badgeId)}
                  className="ml-2 text-gray-400 transition-colors hover:text-red-500"
                >
                  ×
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

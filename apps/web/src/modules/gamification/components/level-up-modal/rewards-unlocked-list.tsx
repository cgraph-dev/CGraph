/**
 * Unlocked rewards list display.
 * @module
 */
import { motion, AnimatePresence } from 'framer-motion';
import { GiftIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

interface RewardsUnlockedListProps {
  visible: boolean;
  titles?: string[];
  badges?: string[];
  perks?: string[];
  loreFragments?: string[];
}

/**
 * Animated list of unlocked rewards: titles, badges, perks, and lore fragments.
 */
export default function RewardsUnlockedList({
  visible,
  titles,
  badges,
  perks,
  loreFragments,
}: RewardsUnlockedListProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="mb-3 flex items-center gap-2 text-primary-400">
            <GiftIcon className="h-5 w-5" />
            <span className="font-semibold">Rewards Unlocked</span>
          </div>

          {titles && titles.length > 0 && (
            <motion.div
              className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="mb-1 text-sm font-semibold text-purple-400">New Titles</div>
              {titles.map((title, idx) => (
                <div key={idx} className="flex items-center gap-2 text-white">
                  <StarIcon className="h-4 w-4 text-purple-400" />
                  <span>"{title}"</span>
                </div>
              ))}
            </motion.div>
          )}

          {badges && badges.length > 0 && (
            <motion.div
              className="rounded-lg border border-primary-500/30 bg-primary-500/10 p-3"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="mb-1 text-sm font-semibold text-primary-400">New Badges</div>
              <div className="flex flex-wrap gap-2">
                {badges.map((badge, idx) => (
                  <span key={idx} className="text-2xl" title={badge}>
                    {badge}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {perks && perks.length > 0 && (
            <motion.div
              className="rounded-lg border border-pink-500/30 bg-pink-500/10 p-3"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="mb-1 text-sm font-semibold text-pink-400">New Perks</div>
              {perks.map((perk, idx) => (
                <div key={idx} className="text-sm text-white">
                  • {perk}
                </div>
              ))}
            </motion.div>
          )}

          {loreFragments && loreFragments.length > 0 && (
            <motion.div
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="mb-1 text-sm font-semibold text-amber-400">Lore Unlocked</div>
              <div className="text-sm text-white">
                {loreFragments.length} new story fragment(s) available
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

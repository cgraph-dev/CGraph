/**
 * BadgesList - display user's top badges
 */

import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { springs } from '@/lib/animations/transitions';

interface Badge {
  id: string;
  name: string;
  emoji: string;
  rarity: string;
}

interface BadgesListProps {
  badges: Badge[];
}

/**
 * unknown for the chat module.
 */
/**
 * Badges List component.
 */
export function BadgesList({ badges }: BadgesListProps) {
  if (badges.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-400">
        <SparklesIcon className="h-4 w-4 text-primary-400" />
        Top Badges
      </h4>
      <div className="flex flex-wrap gap-2">
        {badges.slice(0, 3).map((badge, index) => (
          <motion.div
            key={badge.id}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ ...springs.bouncy, delay: 0.65 + index * 0.05 }}
          >
            <GlassCard variant="neon" glow className="flex items-center gap-2 px-3 py-2">
              <span className="text-xl">{badge.emoji}</span>
              <span className="text-xs font-medium text-white">{badge.name}</span>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

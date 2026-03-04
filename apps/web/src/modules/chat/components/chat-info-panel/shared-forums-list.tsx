/**
 * SharedForumsList - display shared forums
 */

import { motion } from 'motion/react';
import { BuildingLibraryIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { SharedForum } from './types';

interface SharedForumsListProps {
  forums: SharedForum[];
  onForumClick: (forumId: string) => void;
}

/**
 * unknown for the chat module.
 */
/**
 * Shared Forums List component.
 */
export function SharedForumsList({ forums, onForumClick }: SharedForumsListProps) {
  if (forums.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.85 }}
    >
      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-400">
        <BuildingLibraryIcon className="h-4 w-4 text-primary-400" />
        Shared Forums ({forums.length})
      </h4>
      <div className="space-y-2">
        {forums.slice(0, 3).map((forum, index) => (
          <motion.div
            key={forum.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 + index * 0.05 }}
          >
            <GlassCard
              variant="crystal"
              className="flex cursor-pointer items-center gap-2 p-2 transition-transform hover:scale-[1.02]"
              onClick={() => onForumClick(forum.id)}
            >
              {forum.icon && <span className="text-lg">{forum.icon}</span>}
              <span className="truncate text-sm font-medium text-white">{forum.name}</span>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

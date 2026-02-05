import { motion } from 'framer-motion';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { PostFlair } from '../types';

interface PostsPanelProps {
  flairs: PostFlair[];
  onAddFlair: () => void;
  onUpdateFlair: (flairId: string, field: keyof PostFlair, value: string | boolean) => void;
  onRemoveFlair: (flairId: string) => void;
}

export function PostsPanel({ flairs, onAddFlair, onUpdateFlair, onRemoveFlair }: PostsPanelProps) {
  return (
    <motion.div
      key="posts"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="mb-2 text-2xl font-bold text-white">Post Settings</h2>
        <p className="text-gray-400">Configure post flairs and prefixes.</p>
      </div>

      <GlassCard className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Post Flairs</h3>
          <motion.button
            onClick={onAddFlair}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <PlusIcon className="h-5 w-5" />
            Add Flair
          </motion.button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {flairs.map((flair) => (
            <motion.div
              key={flair.id}
              className="group flex items-center gap-3 rounded-lg bg-dark-700/50 p-3"
            >
              <div
                className="rounded-full px-3 py-1 text-sm font-medium text-white"
                style={{ backgroundColor: flair.color }}
              >
                {flair.emoji && <span className="mr-1">{flair.emoji}</span>}
                {flair.name}
              </div>
              <div className="flex-1" />
              <input
                type="color"
                value={flair.color}
                onChange={(e) => onUpdateFlair(flair.id, 'color', e.target.value)}
                className="h-6 w-6 cursor-pointer rounded opacity-0 transition-opacity group-hover:opacity-100"
              />
              <button
                onClick={() => onRemoveFlair(flair.id)}
                className="p-1 text-gray-400 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}

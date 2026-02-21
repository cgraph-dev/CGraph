/**
 * EmojiGrid - Display grid of custom emoji with edit/delete actions
 *
 * @module modules/groups/components/group-settings
 */

import { motion } from 'framer-motion';
import { FaceSmileIcon, PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { entranceVariants } from '@/lib/animation-presets/presets';

export interface GroupEmoji {
  id: string;
  name: string;
  imageUrl: string;
  isAnimated: boolean;
  isAvailable: boolean;
  uploadedBy: string;
  createdAt: string;
}

interface EmojiGridProps {
  emojis: GroupEmoji[];
  loading: boolean;
  editingId: string | null;
  editName: string;
  onEditNameChange: (name: string) => void;
  onStartEdit: (emoji: GroupEmoji) => void;
  onCancelEdit: () => void;
  onRename: (emojiId: string) => void;
  onDeleteRequest: (emojiId: string) => void;
  onUploadClick: () => void;
}

export function EmojiGrid({
  emojis,
  loading,
  editingId,
  editName,
  onEditNameChange,
  onStartEdit,
  onCancelEdit,
  onRename,
  onDeleteRequest,
  onUploadClick,
}: EmojiGridProps) {
  return (
    <GlassCard variant="frosted" className="p-6">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : emojis.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FaceSmileIcon className="mb-3 h-12 w-12 text-gray-600" />
          <p className="text-gray-400">No custom emoji yet</p>
          <p className="mt-1 text-sm text-gray-600">Upload PNG, GIF, or WebP images (max 256KB)</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onUploadClick}
            className="mt-4 flex items-center gap-2 rounded-lg bg-dark-700 px-4 py-2 text-sm text-gray-300 hover:bg-dark-600"
          >
            <PlusIcon className="h-4 w-4" />
            Upload your first emoji
          </motion.button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {emojis.map((emoji, index) => (
            <motion.div
              key={emoji.id}
              variants={entranceVariants.fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.03 }}
              className="group relative rounded-xl border border-gray-700/50 bg-dark-800/50 p-3 transition-colors hover:border-gray-600"
            >
              {/* Emoji Image */}
              <div className="mb-2 flex items-center justify-center">
                <img
                  src={emoji.imageUrl}
                  alt={`:${emoji.name}:`}
                  className="h-12 w-12 object-contain"
                  loading="lazy"
                />
              </div>

              {/* Emoji Name */}
              {editingId === emoji.id ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => onEditNameChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onRename(emoji.id);
                      if (e.key === 'Escape') onCancelEdit();
                    }}
                    className="w-full rounded border border-gray-700 bg-dark-900 px-1.5 py-0.5 text-xs text-white focus:border-primary-500 focus:outline-none"
                    autoFocus
                  />
                  <button onClick={() => onRename(emoji.id)} className="text-xs text-primary-400">
                    ✓
                  </button>
                </div>
              ) : (
                <p className="truncate text-center text-xs text-gray-400">:{emoji.name}:</p>
              )}

              {/* Animated badge */}
              {emoji.isAnimated && (
                <span className="absolute right-1 top-1 rounded bg-purple-500/20 px-1 text-[10px] text-purple-400">
                  GIF
                </span>
              )}

              {/* Hover actions */}
              <div className="absolute inset-x-0 bottom-0 flex translate-y-1 justify-center gap-1 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                <button
                  onClick={() => onStartEdit(emoji)}
                  className="rounded bg-dark-900/90 p-1 text-gray-400 hover:text-white"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onDeleteRequest(emoji.id)}
                  className="rounded bg-dark-900/90 p-1 text-gray-400 hover:text-red-400"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}

          {/* Upload placeholder card */}
          <motion.button
            whileHover={{ scale: 1.02, borderColor: 'rgba(99,102,241,0.5)' }}
            whileTap={{ scale: 0.98 }}
            onClick={onUploadClick}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-700 p-3 text-gray-500 transition-colors hover:border-primary-500/50 hover:text-gray-400"
          >
            <PlusIcon className="mb-1 h-8 w-8" />
            <span className="text-xs">Upload</span>
          </motion.button>
        </div>
      )}
    </GlassCard>
  );
}

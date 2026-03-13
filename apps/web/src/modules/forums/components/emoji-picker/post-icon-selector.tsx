/**
 * Post Icon Selector Component
 *
 * Grid of available post icons for the current board.
 * Shown during thread creation to let users pick an icon
 * that appears next to the thread title.
 *
 * @version 1.0.0
 * @module components/forums/emoji-picker/PostIconSelector
 */

import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { api } from '@/lib/api';
import { tweens } from '@/lib/animation-presets';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PostIcon {
  id: string;
  name: string;
  iconUrl: string;
  emoji: string | null;
  displayOrder: number;
}

export interface PostIconSelectorProps {
  forumId: string;
  boardId: string;
  selectedIconId: string | null;
  onSelect: (icon: PostIcon | null) => void;
  defaultIconId?: string | null;
}

// ─── Mapper ──────────────────────────────────────────────────────────────────

function mapIcon(raw: Record<string, unknown>): PostIcon {
  return {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    id: raw.id as string,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    name: raw.name as string,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    iconUrl: raw.icon_url as string,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    emoji: (raw.emoji as string) || null,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    displayOrder: (raw.display_order as number) || 0,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export const PostIconSelector = memo(function PostIconSelector({
  forumId,
  boardId,
  selectedIconId,
  onSelect,
  defaultIconId = null,
}: PostIconSelectorProps) {
  const [icons, setIcons] = useState<PostIcon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchIcons() {
      setLoading(true);
      try {
        const res = await api.get(`/api/v1/forums/${forumId}/boards/${boardId}/post-icons`);
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const data = (res.data as { data: Record<string, unknown>[] }).data || [];
        if (!cancelled) setIcons(data.map(mapIcon));
      } catch {
        // Silently fail — board may have no icons
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchIcons();
    return () => {
      cancelled = true;
    };
  }, [forumId, boardId]);

  const handleSelect = useCallback(
    (icon: PostIcon | null) => {
      onSelect(icon);
    },
    [onSelect]
  );

  // Don't render if no icons available
  if (!loading && icons.length === 0) return null;

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
        <span className="text-xs text-gray-400">Loading post icons…</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Post Icon</label>

      <div className="flex flex-wrap gap-2">
        {/* None option */}
        <button
          type="button"
          onClick={() => handleSelect(null)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
            selectedIconId === null
              ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-900/20 dark:text-indigo-300'
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-400 dark:hover:bg-white/[0.06]'
          }`}
        >
          <XMarkIcon className="h-4 w-4" />
          None
        </button>

        {/* Icon grid */}
        {icons.map((icon) => {
          const isSelected = selectedIconId === icon.id;
          const isDefault = icon.id === defaultIconId;

          return (
            <motion.button
              key={icon.id}
              type="button"
              onClick={() => handleSelect(icon)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500 dark:border-indigo-400 dark:bg-indigo-900/20 dark:text-indigo-300'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-300 dark:hover:bg-white/[0.06]'
              }`}
            >
              {icon.emoji ? (
                <span className="text-lg">{icon.emoji}</span>
              ) : (
                <img src={icon.iconUrl} alt={icon.name} className="h-5 w-5 object-contain" />
              )}
              <span>{icon.name}</span>
              {isDefault && <span className="text-[10px] text-gray-400">(default)</span>}
              {isSelected && (
                <CheckIcon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selected preview */}
      <AnimatePresence>
        {selectedIconId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={tweens.brisk}
            className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/[0.04]"
          >
            {(() => {
              const selected = icons.find((i) => i.id === selectedIconId);
              if (!selected) return null;
              return (
                <>
                  {selected.emoji ? (
                    <span className="text-xl">{selected.emoji}</span>
                  ) : (
                    <img src={selected.iconUrl} alt="" className="h-6 w-6 object-contain" />
                  )}
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    This icon will appear next to your thread title
                  </span>
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default PostIconSelector;

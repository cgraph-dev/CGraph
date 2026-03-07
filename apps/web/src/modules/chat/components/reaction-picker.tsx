/**
 * ReactionPicker — emoji grid triggered from the message actions bar.
 * @module chat/components/reaction-picker
 */
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { LottieRenderer, AnimatedEmoji } from '@/lib/lottie';
import { getReactionAnimation } from '@/lib/chat/reactionUtils';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'] as const;

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: 'Smileys',
    emojis: [
      '😀',
      '😃',
      '😄',
      '😁',
      '😆',
      '😅',
      '🤣',
      '😂',
      '🙂',
      '😊',
      '😇',
      '🥰',
      '😍',
      '🤩',
      '😘',
      '😗',
      '😚',
      '😋',
      '😛',
      '😜',
      '🤪',
      '😝',
      '🤑',
      '🤗',
      '🤭',
      '🤫',
      '🤔',
      '🫡',
      '🤐',
      '🤨',
      '😐',
      '😑',
      '😶',
      '🫥',
      '😏',
      '😒',
      '🙄',
      '😬',
      '🫠',
      '😮‍💨',
    ],
  },
  {
    label: 'Gestures',
    emojis: [
      '👋',
      '🤚',
      '🖐️',
      '✋',
      '🖖',
      '🫱',
      '🫲',
      '👌',
      '🤌',
      '🤏',
      '✌️',
      '🤞',
      '🫰',
      '🤟',
      '🤘',
      '🤙',
      '👈',
      '👉',
      '👆',
      '👇',
      '☝️',
      '🫵',
      '👍',
      '👎',
      '✊',
      '👊',
      '🤛',
      '🤜',
      '👏',
      '🙌',
      '🫶',
      '🤝',
      '🙏',
      '💪',
      '🦾',
      '❤️',
      '🔥',
      '⭐',
      '💯',
      '✅',
    ],
  },
  {
    label: 'Objects',
    emojis: [
      '💡',
      '🎉',
      '🎊',
      '🥳',
      '🏆',
      '🎮',
      '🎯',
      '🎵',
      '🎶',
      '☕',
      '🍕',
      '🍔',
      '🌮',
      '🍿',
      '🧁',
      '🍩',
      '🧋',
      '🍷',
      '🍻',
      '🥂',
      '💻',
      '📱',
      '⌨️',
      '🖥️',
      '🔒',
      '🔑',
      '⚡',
      '💎',
      '🚀',
      '🌈',
    ],
  },
];

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  isOpen: boolean;
  className?: string;
}

/**
 * ReactionPicker — Discord-style emoji picker with quick-react row,
 * categories, and search.
 */
export function ReactionPicker({ onSelect, onClose, isOpen, className }: ReactionPickerProps) {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = useCallback(
    (emoji: string) => {
      onSelect(emoji);
      onClose();
    },
    [onSelect, onClose]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[var(--z-popover,500)]" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={cn(
              'absolute bottom-full right-0 z-[var(--z-popover,500)] mb-2',
              'w-[320px] rounded-lg',
              'bg-[rgb(18,18,24)]/95 backdrop-blur-xl',
              'border border-white/[0.06] shadow-2xl',
              'overflow-hidden',
              className
            )}
          >
            {/* Quick reactions row */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
              {QUICK_REACTIONS.map((emoji) => {
                const anim = getReactionAnimation(emoji);
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSelect(emoji)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-lg transition-transform hover:scale-125 hover:bg-white/[0.06]"
                  >
                    {anim ? (
                      <LottieRenderer
                        codepoint={anim.codepoint}
                        emoji={emoji}
                        size={24}
                        playOnHover
                        fallbackSrc={anim.webp}
                      />
                    ) : (
                      emoji
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="border-b border-white/[0.06] px-3 py-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search emoji..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(
                  'w-full rounded-md px-2.5 py-1.5 text-xs',
                  'bg-white/[0.04] text-white/80 placeholder-white/30',
                  'border border-white/[0.06] outline-none',
                  'focus:border-[var(--color-brand-purple)]/40'
                )}
              />
            </div>

            {/* Emoji grid */}
            <div className="max-h-[240px] overflow-y-auto p-2">
              {EMOJI_CATEGORIES.map((cat) => {
                const filtered = search
                  ? cat.emojis.filter(() =>
                      // Simple: show all in a matching category, or none
                      cat.label.toLowerCase().includes(search.toLowerCase())
                    )
                  : cat.emojis;

                if (filtered.length === 0) return null;

                return (
                  <div key={cat.label} className="mb-2">
                    <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-white/30">
                      {cat.label}
                    </p>
                    <div className="grid grid-cols-8 gap-0.5">
                      {filtered.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleSelect(emoji)}
                          className="flex h-8 w-8 items-center justify-center rounded text-base transition-transform hover:scale-110 hover:bg-white/[0.06]"
                        >
                          <AnimatedEmoji emoji={emoji} size={22} playOnHover />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* No results */}
              {search &&
                EMOJI_CATEGORIES.every(
                  (cat) => !cat.label.toLowerCase().includes(search.toLowerCase())
                ) && <p className="py-4 text-center text-xs text-white/30">No emojis found</p>}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ReactionPicker;

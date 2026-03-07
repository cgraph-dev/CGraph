/**
 * Emoji grid component for picker
 * @module modules/chat/components/emoji-picker
 */

import { motion } from 'motion/react';

import { LottieRenderer } from '@/lib/lottie';
import type { AnimatedEmoji } from '@/lib/lottie';

interface EmojiGridProps {
  emojis: string[];
  onEmojiClick: (emoji: string) => void;
  searchQuery?: string;
  /** Catalog of animated emojis (loaded from API). */
  animatedCatalog?: Map<string, AnimatedEmoji> | null;
  /** Show only animated emojis. */
  animatedOnly?: boolean;
}

/**
 * Emoji Grid — renders static Unicode or Lottie animated emojis.
 */
export function EmojiGrid({
  emojis,
  onEmojiClick,
  searchQuery,
  animatedCatalog,
  animatedOnly = false,
}: EmojiGridProps) {
  const visibleEmojis =
    animatedOnly && animatedCatalog ? emojis.filter((e) => animatedCatalog.has(e)) : emojis;

  if (visibleEmojis.length === 0 && searchQuery) {
    return <div className="py-8 text-center text-sm text-gray-500">No emojis found</div>;
  }

  if (visibleEmojis.length === 0 && animatedOnly) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">
        No animated emojis in this category
      </div>
    );
  }

  return (
    <div className="scrollbar-thin scrollbar-thumb-gray-700 grid max-h-64 grid-cols-8 gap-1 overflow-y-auto p-2">
      {visibleEmojis.map((emoji, index) => {
        const animated = animatedCatalog?.get(emoji);

        if (animated?.hasAnimation) {
          return (
            <motion.button
              key={`${emoji}-${index}`}
              onClick={() => onEmojiClick(emoji)}
              className="flex h-10 w-10 items-center justify-center rounded-lg transition-all hover:bg-primary-500/20"
              whileTap={{ scale: 0.9 }}
            >
              <LottieRenderer
                codepoint={animated.codepoint}
                emoji={animated.emoji}
                size={36}
                playOnHover
                fallbackSrc={animated.animations.webp}
              />
            </motion.button>
          );
        }

        return (
          <motion.button
            key={`${emoji}-${index}`}
            onClick={() => onEmojiClick(emoji)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-2xl transition-all hover:bg-primary-500/20"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            {emoji}
          </motion.button>
        );
      })}
    </div>
  );
}

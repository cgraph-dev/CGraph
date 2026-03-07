/**
 * EmojiPicker Component
 *
 * A comprehensive emoji picker for message input with search and categories.
 *
 * Features:
 * - Categorized emoji selection
 * - Search functionality
 * - Frequently used tracking
 * - Smooth animations
 * - Glassmorphism design
 * - Animated Noto emojis via Lottie (hover-to-play)
 *
 * @module modules/chat/components/emoji-picker
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';

import type { EmojiPickerProps, EmojiCategory } from './types';
import {
  useRecentEmojis,
  useClickOutside,
  useFilteredEmojis,
  useAnimatedEmojiCatalog,
} from './useEmojiPicker';
import { EmojiSearch } from './emoji-search';
import { CategoryTabs } from './category-tabs';
import { EmojiGrid } from './emoji-grid';
import { springs } from '@/lib/animation-presets';

/**
 * Emoji Picker with Lottie animated emoji support.
 */
export function EmojiPicker({ isOpen, onClose, onSelect, className = '' }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState<EmojiCategory>('Frequently Used');
  const [searchQuery, setSearchQuery] = useState('');
  const [animatedOnly, setAnimatedOnly] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const { addRecentEmoji } = useRecentEmojis();
  useClickOutside(pickerRef, isOpen, onClose);
  const filteredEmojis = useFilteredEmojis(searchQuery, activeCategory);
  const { catalog, loading } = useAnimatedEmojiCatalog(isOpen);

  const handleEmojiClick = (emoji: string) => {
    onSelect(emoji);
    HapticFeedback.light();
    addRecentEmoji(emoji);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={pickerRef}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={springs.stiff}
          className={`absolute z-50 ${className}`}
        >
          <GlassCard className="w-80 p-0">
            <EmojiSearch searchQuery={searchQuery} onSearchChange={setSearchQuery} />

            {/* Animated filter toggle */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-1">
              <button
                type="button"
                onClick={() => setAnimatedOnly(!animatedOnly)}
                className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors ${
                  animatedOnly
                    ? 'bg-primary-500/20 text-primary-300'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                ✨ Animated
              </button>
              {loading && (
                <div className="h-3 w-3 animate-spin rounded-full border border-primary-500 border-t-transparent" />
              )}
            </div>

            {!searchQuery && (
              <CategoryTabs activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
            )}

            <EmojiGrid
              emojis={filteredEmojis}
              onEmojiClick={handleEmojiClick}
              searchQuery={searchQuery}
              animatedCatalog={catalog}
              animatedOnly={animatedOnly}
            />
          </GlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

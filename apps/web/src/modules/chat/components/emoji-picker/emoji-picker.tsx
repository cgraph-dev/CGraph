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
 *
 * @module modules/chat/components/emoji-picker
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';

import type { EmojiPickerProps, EmojiCategory } from './types';
import { useRecentEmojis, useClickOutside, useFilteredEmojis } from './useEmojiPicker';
import { EmojiSearch } from './emoji-search';
import { CategoryTabs } from './category-tabs';
import { EmojiGrid } from './emoji-grid';
import { springs } from '@/lib/animation-presets';

/**
 * unknown for the chat module.
 */
/**
 * Emoji Picker component.
 */
export function EmojiPicker({ isOpen, onClose, onSelect, className = '' }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState<EmojiCategory>('Frequently Used');
  const [searchQuery, setSearchQuery] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  const { addRecentEmoji } = useRecentEmojis();
  useClickOutside(pickerRef, isOpen, onClose);
  const filteredEmojis = useFilteredEmojis(searchQuery, activeCategory);

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

            {!searchQuery && (
              <CategoryTabs activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
            )}

            <EmojiGrid
              emojis={filteredEmojis}
              onEmojiClick={handleEmojiClick}
              searchQuery={searchQuery}
            />
          </GlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

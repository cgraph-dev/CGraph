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

import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';

import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';

import type { EmojiPickerProps, EmojiCategory } from './types';
import {
  useRecentEmojis,
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
export function EmojiPicker({ isOpen, onClose, onSelect, className: _className = '' }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState<EmojiCategory>('Frequently Used');
  const [searchQuery, setSearchQuery] = useState('');
  const [animatedOnly, setAnimatedOnly] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [pickerPos, setPickerPos] = useState<{ bottom: number; left: number } | null>(null);

  const { addRecentEmoji } = useRecentEmojis();
  const filteredEmojis = useFilteredEmojis(searchQuery, activeCategory);
  const { catalog, loading } = useAnimatedEmojiCatalog(isOpen);

  // Compute position by finding the emoji button in the DOM
  useEffect(() => {
    if (!isOpen) return;
    // Find the emoji button (the one with title="Add emoji")
    const btn = document.querySelector('button[title="Add emoji"]');
    if (btn) {
      const rect = btn.getBoundingClientRect();
      // Place picker above the button, aligned to the right edge
      setPickerPos({
        bottom: window.innerHeight - rect.top + 8,
        left: Math.max(8, rect.right - 320), // 320 = picker width (w-80)
      });
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleEmojiClick = useCallback(
    (emoji: string) => {
      onSelect(emoji);
      HapticFeedback.light();
      addRecentEmoji(emoji);
      onClose();
    },
    [onSelect, addRecentEmoji, onClose]
  );

  return (
    <AnimatePresence>
      {isOpen &&
        createPortal(
          <>
            {/* Backdrop — closes picker on click outside */}
            <div
              className="fixed inset-0 z-[9998]"
              onClick={onClose}
              aria-hidden="true"
            />
            <motion.div
              ref={pickerRef}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={springs.stiff}
              className="fixed z-[9999]"
              style={pickerPos ? { bottom: pickerPos.bottom, left: pickerPos.left } : { bottom: 96, left: 280 }}
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
                <CategoryTabs
                  activeCategory={activeCategory}
                  onCategoryChange={setActiveCategory}
                />
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
          </>,
          document.body
        )}
    </AnimatePresence>
  );
}

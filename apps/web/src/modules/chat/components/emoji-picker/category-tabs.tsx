/**
 * Category tabs component for emoji picker
 * @module modules/chat/components/emoji-picker
 */

import { HapticFeedback } from '@/lib/animations/animation-engine';

import { EMOJI_CATEGORIES } from './emojiData';
import type { EmojiCategory } from './types';

interface CategoryTabsProps {
  activeCategory: EmojiCategory;
  onCategoryChange: (category: EmojiCategory) => void;
}

export function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  const categories = Object.keys(EMOJI_CATEGORIES) as EmojiCategory[];

  return (
    <div className="scrollbar-thin scrollbar-thumb-gray-700 flex gap-1 overflow-x-auto border-b border-white/10 p-2">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => {
            onCategoryChange(category);
            HapticFeedback.light();
          }}
          className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            activeCategory === category
              ? 'bg-primary-500/20 text-primary-400'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

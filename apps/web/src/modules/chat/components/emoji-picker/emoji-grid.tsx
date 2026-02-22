/**
 * Emoji grid component for picker
 * @module modules/chat/components/emoji-picker
 */

import { motion } from 'framer-motion';

interface EmojiGridProps {
  emojis: string[];
  onEmojiClick: (emoji: string) => void;
  searchQuery?: string;
}

export function EmojiGrid({ emojis, onEmojiClick, searchQuery }: EmojiGridProps) {
  if (emojis.length === 0 && searchQuery) {
    return <div className="py-8 text-center text-sm text-gray-500">No emojis found</div>;
  }

  return (
    <div className="scrollbar-thin scrollbar-thumb-gray-700 grid max-h-64 grid-cols-8 gap-1 overflow-y-auto p-2">
      {emojis.map((emoji, index) => (
        <motion.button
          key={`${emoji}-${index}`}
          onClick={() => onEmojiClick(emoji)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-2xl transition-all hover:bg-primary-500/20"
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
        >
          {emoji}
        </motion.button>
      ))}
    </div>
  );
}

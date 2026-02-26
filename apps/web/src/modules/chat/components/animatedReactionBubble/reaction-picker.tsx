/**
 * ReactionPicker – quick-pick emoji bar for adding reactions.
 */

import { motion } from 'framer-motion';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { QUICK_REACTIONS } from '@/modules/chat/components/animatedReactionBubble/constants';
import { springs } from '@/lib/animation-presets';

export interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

/**
 * unknown for the chat module.
 */
/**
 * Reaction Picker component.
 */
export function ReactionPicker({ onSelect, onClose }: ReactionPickerProps) {
  return (
    <motion.div
      className="flex items-center gap-2 rounded-full border border-dark-600 bg-dark-800/95 px-4 py-3 shadow-2xl backdrop-blur-xl"
      initial={{ scale: 0, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0, y: 20 }}
      transition={springs.snappy}
    >
      {QUICK_REACTIONS.map((emoji) => (
        <motion.button
          key={emoji}
          className="p-2 text-2xl transition-transform hover:scale-125 active:scale-95"
          onClick={() => {
            HapticFeedback.light();
            onSelect(emoji);
            onClose();
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={springs.snappy}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.9 }}
        >
          {emoji}
        </motion.button>
      ))}

      {/* Close button */}
      <motion.button
        className="ml-2 p-2 text-gray-400 transition-colors hover:text-white"
        onClick={onClose}
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </motion.button>
    </motion.div>
  );
}

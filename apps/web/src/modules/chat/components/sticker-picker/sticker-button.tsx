/**
 * StickerButton - Button to trigger the sticker picker
 */

import { motion } from 'motion/react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { StickerButtonProps } from './types';

/**
 * unknown for the chat module.
 */
/**
 * Sticker Button component.
 */
export function StickerButton({ onClick, isActive, className }: StickerButtonProps) {
  return (
    <motion.button
      className={cn(
        'rounded-lg p-2.5 transition-colors',
        isActive
          ? 'bg-primary-500/20 text-primary-400'
          : 'text-gray-400 hover:bg-white/10 hover:text-white',
        className
      )}
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      title="Send a sticker"
    >
      <SparklesIcon className="h-5 w-5" />
    </motion.button>
  );
}

/**
 * CategoryButton Component
 *
 * Button for selecting GIF categories.
 */

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { CategoryButtonProps } from './types';

/**
 * unknown for the chat module.
 */
/**
 * Category Button component.
 */
export function CategoryButton({ category, isActive, onClick }: CategoryButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary-600 text-white'
          : 'bg-white/[0.06] text-gray-400 hover:bg-white/[0.10] hover:text-white'
      )}
    >
      {category.icon}
      <span>{category.name}</span>
    </motion.button>
  );
}

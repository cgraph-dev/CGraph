/**
 * Category tab buttons for leaderboard filtering
 * @module pages/leaderboard/sections
 */

import { motion } from 'framer-motion';

import { HapticFeedback } from '@/lib/animations/animation-engine';

import { CATEGORIES } from '../constants';
import type { CategoryTabsProps } from './types';

export function CategoryTabs({ category, onCategoryChange }: CategoryTabsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="scrollbar-hide mb-6 overflow-x-auto pb-2"
    >
      <div className="flex min-w-max justify-center gap-2 px-4">
        {CATEGORIES.map((cat, index) => (
          <motion.button
            key={cat.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            onClick={() => {
              onCategoryChange(cat.id);
              HapticFeedback.light();
            }}
            className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              category === cat.id
                ? `bg-gradient-to-r ${cat.gradient} text-white shadow-lg`
                : 'border border-dark-700 bg-dark-800/80 text-gray-400 hover:bg-dark-700 hover:text-white'
            }`}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className={category === cat.id ? 'text-white' : cat.color}>{cat.icon}</span>
            <span>{cat.name}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

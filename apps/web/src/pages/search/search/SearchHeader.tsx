/**
 * Search Header
 *
 * Contains the search input bar and category tab strip.
 *
 * @module pages/search/search/SearchHeader
 */

import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { SearchCategory } from '@/modules/search/store';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { categories } from './constants';
import { springs } from '@/lib/animation-presets/presets';

/** Props for SearchHeader */
export interface SearchHeaderProps {
  /** Current input value */
  inputValue: string;
  /** Handle input change */
  onInputChange: (value: string) => void;
  /** Active category */
  category: SearchCategory;
  /** Handle category change */
  onCategoryChange: (cat: SearchCategory) => void;
  /** Clear search */
  onClear: () => void;
}

/** Search input + category tabs header */
export function SearchHeader({
  inputValue,
  onInputChange,
  category,
  onCategoryChange,
  onClear,
}: SearchHeaderProps) {
  return (
    <div className="relative z-10 border-b border-primary-500/20 bg-dark-900/50 px-6 py-4 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary-500/5 via-transparent to-purple-500/5" />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10"
      >
        <h1 className="mb-4 flex items-center gap-2 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-2xl font-bold text-transparent">
          <MagnifyingGlassIcon className="h-6 w-6 text-primary-400" />
          Search
        </h1>

        {/* Search Input */}
        <motion.div
          className="relative mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <GlassCard variant="crystal" className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-primary-400" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="Search users, groups, forums, posts..."
              className="relative z-10 w-full border-none bg-transparent py-3 pl-12 pr-12 text-white placeholder-gray-400 focus:outline-none"
            />
            <AnimatePresence>
              {inputValue && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => {
                    onClear();
                    HapticFeedback.light();
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute right-4 top-1/2 z-10 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="h-5 w-5" />
                </motion.button>
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          className="relative flex items-center gap-2 overflow-x-auto pb-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <motion.button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...springs.bouncy, delay: 0.25 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  category === cat.id ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {category === cat.id && (
                  <motion.div
                    layoutId="activeCategory"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-500/20 via-purple-500/20 to-transparent"
                    style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' }}
                    transition={springs.bouncy}
                  />
                )}
                <Icon className="relative z-10 h-4 w-4" />
                <span className="relative z-10">{cat.label}</span>
              </motion.button>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
}

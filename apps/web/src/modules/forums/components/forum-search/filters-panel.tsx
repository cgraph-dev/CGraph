/**
 * FiltersPanel Component
 *
 * Expandable panel with sort, time range, type, and category filters.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { SORT_OPTIONS, TIME_RANGE_OPTIONS, CONTENT_TYPE_OPTIONS } from './constants';
import type { FiltersPanelProps, SearchFilters } from './types';

/**
 * unknown for the forums module.
 */
/**
 * Filters Panel component.
 */
export function FiltersPanel({
  isOpen,
  filters,
  categories,
  primaryColor,
  onFilterChange,
  onToggleCategory,
  onClearFilters,
}: FiltersPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="space-y-4 border-t border-dark-600 p-4">
            {/* Sort Options */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-400">Sort By</label>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => onFilterChange({ sortBy: value })}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      filters.sortBy === value
                        ? 'text-white'
                        : 'bg-dark-600 text-gray-400 hover:bg-dark-500'
                    }`}
                    style={filters.sortBy === value ? { backgroundColor: primaryColor } : {}}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Range */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-400">Time Range</label>
              <div className="flex flex-wrap gap-2">
                {TIME_RANGE_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() =>
                       
                      onFilterChange({ timeRange: value as SearchFilters['timeRange'] }) // safe downcast – select event value
                    }
                    className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      filters.timeRange === value
                        ? 'text-white'
                        : 'bg-dark-600 text-gray-400 hover:bg-dark-500'
                    }`}
                    style={filters.timeRange === value ? { backgroundColor: primaryColor } : {}}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-400">Content Type</label>
              <div className="flex flex-wrap gap-2">
                {CONTENT_TYPE_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                     
                    onClick={() => onFilterChange({ type: value as SearchFilters['type'] })} // safe downcast – select event value
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      filters.type === value
                        ? 'text-white'
                        : 'bg-dark-600 text-gray-400 hover:bg-dark-500'
                    }`}
                    style={filters.type === value ? { backgroundColor: primaryColor } : {}}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-400">Categories</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => onToggleCategory(category.id)}
                      className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                        filters.categories.includes(category.id)
                          ? 'text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                      style={{
                        backgroundColor: filters.categories.includes(category.id)
                          ? category.color || primaryColor
                          : `${category.color || primaryColor}20`,
                      }}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Clear Filters */}
            <button
              onClick={onClearFilters}
              className="text-sm text-gray-400 underline hover:text-white"
            >
              Clear all filters
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

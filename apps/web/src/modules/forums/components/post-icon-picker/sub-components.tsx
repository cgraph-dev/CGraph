/**
 * Sub-components for PostIconPicker
 * @module modules/forums/components/post-icon-picker
 */

import { memo } from 'react';
import { motion } from 'motion/react';
import { MagnifyingGlassIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

import { BUTTON_SIZES, ICON_DISPLAY_SIZES } from './constants';
import { PostIconDisplay } from './post-icon-display';
import type { IconButtonProps, IconSearchProps } from './types';

/**
 * Icon button for grid selection
 */
export const IconButton = memo(function IconButton({
  icon,
  isSelected,
  onClick,
  size,
}: IconButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={` ${BUTTON_SIZES[size]} relative rounded-lg border-2 transition-colors ${
        isSelected
          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30'
          : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
      } `}
      title={icon.name}
      aria-label={`Select ${icon.name} icon`}
      aria-pressed={isSelected}
    >
      <PostIconDisplay icon={icon} size={ICON_DISPLAY_SIZES[size]} />
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500"
        >
          <CheckIcon className="h-3 w-3 text-white" />
        </motion.div>
      )}
    </motion.button>
  );
});

/**
 * Search input for filtering icons
 */
export const IconSearch = memo(function IconSearch({ value, onChange }: IconSearchProps) {
  return (
    <div className="relative">
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search icons..."
        className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-gray-700 dark:bg-gray-800"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
});

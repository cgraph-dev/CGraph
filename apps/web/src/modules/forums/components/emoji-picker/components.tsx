/**
 * Emoji Picker Sub-Components
 * Reusable components for the emoji picker
 */

import { memo } from 'react';
import { motion } from 'motion/react';
import { MagnifyingGlassIcon, StarIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import type { CustomEmoji } from './types';

/**
 * Single emoji button
 */
export const EmojiButton = memo(function EmojiButton({
  emoji,
  onSelect,
  isFavorite,
  onToggleFavorite,
  size = 'md',
}: {
  emoji: CustomEmoji;
  onSelect: (emoji: CustomEmoji) => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const buttonSizes = {
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2',
  };

  return (
    <div className="group relative">
      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onSelect(emoji)}
        className={` ${buttonSizes[size]} rounded-lg transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:hover:bg-gray-700`}
        title={`:${emoji.shortcode}:`}
        aria-label={`${emoji.name} emoji`}
      >
        <img
          src={emoji.image_url}
          alt={emoji.name}
          className={`${sizeClasses[size]} object-contain`}
          loading="lazy"
        />
      </motion.button>

      {onToggleFavorite && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="absolute -right-1 -top-1 opacity-0 transition-opacity group-hover:opacity-100"
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? (
            <StarSolidIcon className="h-3 w-3 text-yellow-500" />
          ) : (
            <StarIcon className="h-3 w-3 text-gray-400 hover:text-yellow-500" />
          )}
        </button>
      )}
    </div>
  );
});

/**
 * Unicode emoji button
 */
export const UnicodeEmojiButton = memo(function UnicodeEmojiButton({
  emoji,
  onSelect,
  size = 'md',
}: {
  emoji: string;
  onSelect: (emoji: string) => void;
  size?: 'sm' | 'md' | 'lg';
}) {
  const fontSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onSelect(emoji)}
      className={`rounded-lg p-1.5 ${fontSizes[size]} transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:hover:bg-gray-700`}
      title={emoji}
      aria-label={`${emoji} emoji`}
    >
      {emoji}
    </motion.button>
  );
});

/**
 * Category tab button
 */
export const CategoryTab = memo(function CategoryTab({
  icon,
  name,
  isActive,
  onClick,
}: {
  icon: string;
  name: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg p-2 text-lg transition-colors ${
        isActive
          ? 'bg-orange-100 dark:bg-orange-900/30'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
      } `}
      title={name}
      aria-label={name}
      aria-pressed={isActive}
    >
      {icon}
    </button>
  );
});

/**
 * Search input
 */
export const SearchInput = memo(function SearchInput({
  value,
  onChange,
  placeholder = 'Search emojis...',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700"
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

/**
 * Empty state
 */
export const EmptyState = memo(function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Icon className="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{description}</p>
      )}
    </div>
  );
});

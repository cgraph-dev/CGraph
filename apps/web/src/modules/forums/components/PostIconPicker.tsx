/**
 * Post Icon Picker Component
 *
 * Classic forum feature allowing users to select an icon when creating
 * threads or posts. Icons help visually categorize and distinguish content.
 *
 * Features:
 * - Grid layout for easy icon selection
 * - Search/filter icons by name
 * - Emoji fallback when image icons aren't available
 * - Recently used icons section
 * - Keyboard navigation support
 * - Accessible with ARIA labels
 *
 * @module components/forums/PostIconPicker
 */

import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaceSmileIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { useLocalStorage } from '@/hooks/useLocalStorage';

// =============================================================================
// TYPES
// =============================================================================

export interface PostIcon {
  id: string;
  name: string;
  icon_url: string;
  emoji?: string;
  display_order: number;
  is_active: boolean;
  forum_id?: string;
  usage_count: number;
}

export interface PostIconPickerProps {
  /** Currently selected icon */
  selectedIcon?: PostIcon | null;
  /** Callback when an icon is selected */
  onSelect: (icon: PostIcon | null) => void;
  /** Available icons to display */
  icons: PostIcon[];
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show as inline or dropdown */
  variant?: 'inline' | 'dropdown';
  /** Placeholder text when no icon selected */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Forum ID for context */
  forumId?: string;
}

export interface PostIconDisplayProps {
  icon: PostIcon;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const LOCAL_STORAGE_KEY = 'cgraph_recent_post_icons';
const MAX_RECENT_ICONS = 8;

const SIZE_CLASSES = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

const GRID_SIZES = {
  sm: 'grid-cols-6 gap-1',
  md: 'grid-cols-8 gap-2',
  lg: 'grid-cols-10 gap-2',
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Display a single post icon
 */
export const PostIconDisplay = memo(function PostIconDisplay({
  icon,
  size = 'md',
  showName = false,
  className = '',
}: PostIconDisplayProps) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  return (
    <span className={`inline-flex items-center gap-1 ${className}`} title={icon.name}>
      {!imageError && icon.icon_url ? (
        <img
          src={icon.icon_url}
          alt={icon.name}
          className={`${SIZE_CLASSES[size]} object-contain`}
          onError={handleImageError}
        />
      ) : icon.emoji ? (
        <span className={`${SIZE_CLASSES[size]} flex items-center justify-center text-base`}>
          {icon.emoji}
        </span>
      ) : (
        <FaceSmileIcon className={`${SIZE_CLASSES[size]} text-gray-400`} />
      )}
      {showName && <span className="text-sm text-gray-600 dark:text-gray-400">{icon.name}</span>}
    </span>
  );
});

/**
 * Icon button for grid selection
 */
const IconButton = memo(function IconButton({
  icon,
  isSelected,
  onClick,
  size,
}: {
  icon: PostIcon;
  isSelected: boolean;
  onClick: () => void;
  size: 'sm' | 'md' | 'lg';
}) {
  // Image error handling is delegated to PostIconDisplay component
  const buttonSizes = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  };

  const iconDisplaySizes = {
    sm: 'xs' as const,
    md: 'sm' as const,
    lg: 'md' as const,
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={` ${buttonSizes[size]} relative rounded-lg border-2 transition-colors ${
        isSelected
          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30'
          : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
      } `}
      title={icon.name}
      aria-label={`Select ${icon.name} icon`}
      aria-pressed={isSelected}
    >
      <PostIconDisplay icon={icon} size={iconDisplaySizes[size]} />
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
const IconSearch = memo(function IconSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
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

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Post Icon Picker
 *
 * Allows users to select an icon for their thread or post.
 *
 * @example
 * ```tsx
 * const [selectedIcon, setSelectedIcon] = useState<PostIcon | null>(null);
 *
 * <PostIconPicker
 *   icons={availableIcons}
 *   selectedIcon={selectedIcon}
 *   onSelect={setSelectedIcon}
 * />
 * ```
 */
export const PostIconPicker = memo(function PostIconPicker({
  selectedIcon,
  onSelect,
  icons,
  disabled = false,
  size = 'md',
  variant = 'dropdown',
  placeholder = 'Select an icon',
  className = '',
  forumId,
}: PostIconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentIcons, setRecentIcons] = useLocalStorage<string[]>(
    `${LOCAL_STORAGE_KEY}_${forumId || 'global'}`,
    []
  );

  // Filter icons based on search
  const filteredIcons = useMemo(() => {
    if (!searchQuery.trim()) return icons;
    const query = searchQuery.toLowerCase();
    return icons.filter(
      (icon) =>
        icon.name.toLowerCase().includes(query) || (icon.emoji && icon.emoji.includes(query))
    );
  }, [icons, searchQuery]);

  // Get recent icons from stored IDs
  const recentIconsData = useMemo(() => {
    return recentIcons
      .map((id) => icons.find((icon) => icon.id === id))
      .filter(Boolean) as PostIcon[];
  }, [recentIcons, icons]);

  // Handle icon selection
  const handleSelect = useCallback(
    (icon: PostIcon | null) => {
      if (icon) {
        // Add to recent icons
        const newRecent = [icon.id, ...recentIcons.filter((id) => id !== icon.id)].slice(
          0,
          MAX_RECENT_ICONS
        );
        setRecentIcons(newRecent);
      }
      onSelect(icon);
      setIsOpen(false);
      setSearchQuery('');
    },
    [onSelect, recentIcons, setRecentIcons]
  );

  // Clear selection
  const handleClear = useCallback(() => {
    onSelect(null);
    setIsOpen(false);
  }, [onSelect]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-post-icon-picker]')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  if (variant === 'inline') {
    return (
      <div className={`space-y-4 ${className}`} data-post-icon-picker>
        {/* Search */}
        <IconSearch value={searchQuery} onChange={setSearchQuery} />

        {/* Recent icons */}
        {recentIconsData.length > 0 && !searchQuery && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <ClockIcon className="h-4 w-4" />
              <span>Recently used</span>
            </div>
            <div className={`grid ${GRID_SIZES[size]}`}>
              {recentIconsData.map((icon) => (
                <IconButton
                  key={icon.id}
                  icon={icon}
                  isSelected={selectedIcon?.id === icon.id}
                  onClick={() => handleSelect(icon)}
                  size={size}
                />
              ))}
            </div>
          </div>
        )}

        {/* All icons */}
        <div className="space-y-2">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {searchQuery ? `Results (${filteredIcons.length})` : 'All icons'}
          </div>
          <div className={`grid ${GRID_SIZES[size]}`}>
            {/* No icon option */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClear}
              className={`rounded-lg border-2 p-2 transition-colors ${
                !selectedIcon
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30'
                  : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
              } `}
              title="No icon"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" />
            </motion.button>

            {filteredIcons.map((icon) => (
              <IconButton
                key={icon.id}
                icon={icon}
                isSelected={selectedIcon?.id === icon.id}
                onClick={() => handleSelect(icon)}
                size={size}
              />
            ))}
          </div>

          {filteredIcons.length === 0 && (
            <div className="py-4 text-center text-gray-500 dark:text-gray-400">No icons found</div>
          )}
        </div>
      </div>
    );
  }

  // Dropdown variant
  return (
    <div className={`relative ${className}`} data-post-icon-picker onKeyDown={handleKeyDown}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
          disabled
            ? 'cursor-not-allowed bg-gray-100 opacity-50 dark:bg-gray-800'
            : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
        } `}
      >
        {selectedIcon ? (
          <>
            <PostIconDisplay icon={selectedIcon} size="sm" />
            <span className="flex-1 text-left text-sm text-gray-700 dark:text-gray-300">
              {selectedIcon.name}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <FaceSmileIcon className="h-5 w-5 text-gray-400" />
            <span className="flex-1 text-left text-sm text-gray-500 dark:text-gray-400">
              {placeholder}
            </span>
          </>
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-900"
          >
            {/* Search */}
            <IconSearch value={searchQuery} onChange={setSearchQuery} />

            {/* Content */}
            <div className="mt-4 max-h-64 overflow-y-auto">
              {/* Recent icons */}
              {recentIconsData.length > 0 && !searchQuery && (
                <div className="mb-4">
                  <div className="mb-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <ClockIcon className="h-4 w-4" />
                    <span>Recently used</span>
                  </div>
                  <div className="grid grid-cols-8 gap-1">
                    {recentIconsData.map((icon) => (
                      <IconButton
                        key={icon.id}
                        icon={icon}
                        isSelected={selectedIcon?.id === icon.id}
                        onClick={() => handleSelect(icon)}
                        size="sm"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All icons */}
              <div>
                <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  {searchQuery ? `Results (${filteredIcons.length})` : 'All icons'}
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {filteredIcons.map((icon) => (
                    <IconButton
                      key={icon.id}
                      icon={icon}
                      isSelected={selectedIcon?.id === icon.id}
                      onClick={() => handleSelect(icon)}
                      size="sm"
                    />
                  ))}
                </div>

                {filteredIcons.length === 0 && (
                  <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No icons found
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to fetch post icons for a forum or board
 */
export function usePostIcons(forumId?: string, boardId?: string) {
  const [icons, setIcons] = useState<PostIcon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchIcons = async () => {
      try {
        setLoading(true);
        let url = '/api/v1/post-icons';
        const params = new URLSearchParams();

        if (forumId) params.set('forum_id', forumId);
        if (boardId) params.set('board_id', boardId);

        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch icons');

        const data = await response.json();
        setIcons(data.icons || data);
        setError(null);
      } catch (err) {
        setError(err as Error);
        // Fallback to emoji-based defaults
        setIcons(getDefaultIcons());
      } finally {
        setLoading(false);
      }
    };

    fetchIcons();
  }, [forumId, boardId]);

  return { icons, loading, error };
}

/**
 * Default emoji-based icons as fallback
 */
function getDefaultIcons(): PostIcon[] {
  const defaults = [
    { name: 'Default', emoji: '💬' },
    { name: 'Question', emoji: '❓' },
    { name: 'Exclamation', emoji: '❗' },
    { name: 'Lightbulb', emoji: '💡' },
    { name: 'Star', emoji: '⭐' },
    { name: 'Heart', emoji: '❤️' },
    { name: 'Check', emoji: '✅' },
    { name: 'Warning', emoji: '⚠️' },
    { name: 'Info', emoji: 'ℹ️' },
    { name: 'Thumbs Up', emoji: '👍' },
    { name: 'Thumbs Down', emoji: '👎' },
    { name: 'Fire', emoji: '🔥' },
    { name: 'Cool', emoji: '😎' },
    { name: 'Sad', emoji: '😢' },
    { name: 'Angry', emoji: '😠' },
    { name: 'Thinking', emoji: '🤔' },
  ];

  return defaults.map((d, i) => ({
    id: `default-${i}`,
    name: d.name,
    icon_url: '',
    emoji: d.emoji,
    display_order: i,
    is_active: true,
    usage_count: 0,
  }));
}

// =============================================================================
// EXPORTS
// =============================================================================

export default PostIconPicker;

/**
 * Post Icon Picker Component
 *
 * Classic forum feature allowing users to select an icon when creating
 * threads or posts. Icons help visually categorize and distinguish content.
 *
 * @module modules/forums/components/post-icon-picker
 */

import { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaceSmileIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';

import { useLocalStorage } from '@/hooks/useLocalStorage';

import { LOCAL_STORAGE_KEY, MAX_RECENT_ICONS, GRID_SIZES } from './constants';
import { PostIconDisplay } from './post-icon-display';
import { IconButton, IconSearch } from './sub-components';
import type { PostIconPickerProps, PostIcon } from './types';

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
      .filter(Boolean) as PostIcon[]; // safe downcast – structural boundary
  }, [recentIcons, icons]);

  // Handle icon selection
  const handleSelect = useCallback(
    (icon: PostIcon | null) => {
      if (icon) {
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
       
      const target = event.target as Element; // safe downcast – DOM element
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
        <IconSearch value={searchQuery} onChange={setSearchQuery} />

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

        <div className="space-y-2">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {searchQuery ? `Results (${filteredIcons.length})` : 'All icons'}
          </div>
          <div className={`grid ${GRID_SIZES[size]}`}>
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

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-900"
          >
            <IconSearch value={searchQuery} onChange={setSearchQuery} />

            <div className="mt-4 max-h-64 overflow-y-auto">
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

export default PostIconPicker;

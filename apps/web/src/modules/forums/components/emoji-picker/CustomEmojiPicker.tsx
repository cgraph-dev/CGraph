/**
 * Custom Emoji Picker Component
 *
 * A comprehensive emoji picker that supports:
 * - Standard Unicode emojis
 * - Custom server emojis
 * - Search and filtering
 * - Categories and tabs
 * - Recently used emojis
 * - Favorites
 * - Keyboard navigation
 *
 * @version 1.0.0
 * @module components/forums/CustomEmojiPicker
 */

import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaceSmileIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  StarIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

import { CustomEmojiPickerProps, CustomEmoji } from './types';
import { useCustomEmojis, useEmojiSearch } from './hooks';
import {
  EmojiButton,
  UnicodeEmojiButton,
  CategoryTab,
  SearchInput,
  EmptyState,
} from './components';
import { UNICODE_CATEGORIES } from './unicode-emojis';

/**
 * Main CustomEmojiPicker component
 */
export const CustomEmojiPicker = memo(function CustomEmojiPicker({
  forumId,
  onSelect,
  onClose,
  isOpen,
  showUnicode = true,
  position = 'bottom',
  className = '',
  maxHeight = 400,
}: CustomEmojiPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'recent' | 'favorites' | 'custom' | 'unicode'>(
    'custom'
  );
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { emojis, categories, favorites, recent, loading, toggleFavorite, trackUsage } =
    useCustomEmojis(forumId);

  const { searchTerm, setSearchTerm, searchResults, isSearching, isSearchActive } = useEmojiSearch(
    emojis,
    forumId
  );

  // Handle emoji selection
  const handleSelect = useCallback(
    (emoji: CustomEmoji | string) => {
      if (typeof emoji === 'object') {
        trackUsage(emoji);
      }
      onSelect(emoji);
      onClose();
    },
    [onSelect, onClose, trackUsage]
  );

  // Filter emojis by category
  const filteredEmojis = useMemo(() => {
    if (isSearchActive) return searchResults;
    if (!activeCategory) return emojis;
    return emojis.filter((e) => e.category_id === activeCategory);
  }, [emojis, activeCategory, isSearchActive, searchResults]);

  // Position styles
  const positionStyles: Record<string, string> = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  // Close on escape
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 10 : -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className={`absolute z-50 ${positionStyles[position]} w-80 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 ${className}`}
        style={{ maxHeight }}
      >
        {/* Header */}
        <div className="border-b border-gray-200 p-3 dark:border-gray-700">
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search emojis..." />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200 px-3 py-2 dark:border-gray-700">
          <CategoryTab
            icon="🕐"
            name="Recent"
            isActive={activeTab === 'recent'}
            onClick={() => {
              setActiveTab('recent');
              setActiveCategory(null);
            }}
          />
          <CategoryTab
            icon="⭐"
            name="Favorites"
            isActive={activeTab === 'favorites'}
            onClick={() => {
              setActiveTab('favorites');
              setActiveCategory(null);
            }}
          />
          <CategoryTab
            icon="✨"
            name="Custom"
            isActive={activeTab === 'custom'}
            onClick={() => {
              setActiveTab('custom');
              setActiveCategory(null);
            }}
          />
          {showUnicode && (
            <CategoryTab
              icon="😀"
              name="Unicode"
              isActive={activeTab === 'unicode'}
              onClick={() => {
                setActiveTab('unicode');
                setActiveCategory(null);
              }}
            />
          )}
        </div>

        {/* Category tabs for custom emojis */}
        {activeTab === 'custom' && categories.length > 0 && !isSearchActive && (
          <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-200 px-3 py-2 dark:border-gray-700">
            <button
              onClick={() => setActiveCategory(null)}
              className={`whitespace-nowrap rounded-full px-2 py-1 text-xs ${
                !activeCategory
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`whitespace-nowrap rounded-full px-2 py-1 text-xs ${
                  activeCategory === cat.id
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Emoji grid */}
        <div className="overflow-y-auto" style={{ maxHeight: maxHeight - 150 }}>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            </div>
          ) : isSearchActive ? (
            <SearchResultsGrid
              isSearching={isSearching}
              searchResults={searchResults}
              searchTerm={searchTerm}
              favorites={favorites}
              handleSelect={handleSelect}
              toggleFavorite={toggleFavorite}
            />
          ) : activeTab === 'recent' ? (
            <RecentEmojisGrid recent={recent} handleSelect={handleSelect} />
          ) : activeTab === 'favorites' ? (
            <FavoritesGrid
              favorites={favorites}
              handleSelect={handleSelect}
              toggleFavorite={toggleFavorite}
            />
          ) : activeTab === 'custom' ? (
            <CustomEmojisGrid
              emojis={filteredEmojis}
              favorites={favorites}
              handleSelect={handleSelect}
              toggleFavorite={toggleFavorite}
            />
          ) : activeTab === 'unicode' ? (
            <UnicodeEmojisGrid handleSelect={handleSelect} />
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-3 py-2 dark:border-gray-700">
          <span className="text-xs text-gray-400">{emojis.length} custom emojis</span>
          <button
            onClick={() => {
              /* TODO: Open emoji upload modal */
            }}
            className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600"
          >
            <PlusIcon className="h-3 w-3" />
            Add emoji
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

// =============================================================================
// GRID SUB-COMPONENTS
// =============================================================================

interface SearchResultsGridProps {
  isSearching: boolean;
  searchResults: CustomEmoji[];
  searchTerm: string;
  favorites: CustomEmoji[];
  handleSelect: (emoji: CustomEmoji | string) => void;
  toggleFavorite: (emoji: CustomEmoji) => void;
}

function SearchResultsGrid({
  isSearching,
  searchResults,
  searchTerm,
  favorites,
  handleSelect,
  toggleFavorite,
}: SearchResultsGridProps) {
  return (
    <div className="p-3">
      {isSearching ? (
        <div className="flex items-center justify-center py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        </div>
      ) : searchResults.length > 0 ? (
        <div className="grid grid-cols-8 gap-1">
          {searchResults.map((emoji) => (
            <EmojiButton
              key={emoji.id}
              emoji={emoji}
              onSelect={handleSelect}
              isFavorite={favorites.some((f) => f.id === emoji.id)}
              onToggleFavorite={() => toggleFavorite(emoji)}
              size="sm"
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={MagnifyingGlassIcon}
          title="No emojis found"
          description={`No results for "${searchTerm}"`}
        />
      )}
    </div>
  );
}

interface RecentEmojisGridProps {
  recent: CustomEmoji[];
  handleSelect: (emoji: CustomEmoji | string) => void;
}

function RecentEmojisGrid({ recent, handleSelect }: RecentEmojisGridProps) {
  return (
    <div className="p-3">
      {recent.length > 0 ? (
        <div className="grid grid-cols-8 gap-1">
          {recent.map((emoji) => (
            <EmojiButton key={emoji.id} emoji={emoji} onSelect={handleSelect} size="sm" />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ClockIcon}
          title="No recent emojis"
          description="Emojis you use will appear here"
        />
      )}
    </div>
  );
}

interface FavoritesGridProps {
  favorites: CustomEmoji[];
  handleSelect: (emoji: CustomEmoji | string) => void;
  toggleFavorite: (emoji: CustomEmoji) => void;
}

function FavoritesGrid({ favorites, handleSelect, toggleFavorite }: FavoritesGridProps) {
  return (
    <div className="p-3">
      {favorites.length > 0 ? (
        <div className="grid grid-cols-8 gap-1">
          {favorites.map((emoji) => (
            <EmojiButton
              key={emoji.id}
              emoji={emoji}
              onSelect={handleSelect}
              isFavorite
              onToggleFavorite={() => toggleFavorite(emoji)}
              size="sm"
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={StarIcon}
          title="No favorites yet"
          description="Star emojis to add them here"
        />
      )}
    </div>
  );
}

interface CustomEmojisGridProps {
  emojis: CustomEmoji[];
  favorites: CustomEmoji[];
  handleSelect: (emoji: CustomEmoji | string) => void;
  toggleFavorite: (emoji: CustomEmoji) => void;
}

function CustomEmojisGrid({
  emojis,
  favorites,
  handleSelect,
  toggleFavorite,
}: CustomEmojisGridProps) {
  return (
    <div className="p-3">
      {emojis.length > 0 ? (
        <div className="grid grid-cols-8 gap-1">
          {emojis.map((emoji) => (
            <EmojiButton
              key={emoji.id}
              emoji={emoji}
              onSelect={handleSelect}
              isFavorite={favorites.some((f) => f.id === emoji.id)}
              onToggleFavorite={() => toggleFavorite(emoji)}
              size="sm"
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FaceSmileIcon}
          title="No custom emojis"
          description="Custom emojis will appear here"
        />
      )}
    </div>
  );
}

interface UnicodeEmojisGridProps {
  handleSelect: (emoji: CustomEmoji | string) => void;
}

function UnicodeEmojisGrid({ handleSelect }: UnicodeEmojisGridProps) {
  return (
    <div className="space-y-4 p-3">
      {UNICODE_CATEGORIES.map((category) => (
        <div key={category.id}>
          <h4 className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            {category.icon} {category.name}
          </h4>
          <div className="grid grid-cols-8 gap-1">
            {category.emojis.slice(0, 32).map((emoji, idx) => (
              <UnicodeEmojiButton
                key={`${category.id}-${idx}`}
                emoji={emoji}
                onSelect={handleSelect}
                size="sm"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default CustomEmojiPicker;

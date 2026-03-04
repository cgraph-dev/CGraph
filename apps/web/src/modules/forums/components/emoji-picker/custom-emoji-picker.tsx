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
import { motion, AnimatePresence } from 'motion/react';
import { PlusIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { api } from '@/lib/api';

import { CustomEmojiPickerProps, CustomEmoji } from './types';
import { useCustomEmojis, useEmojiSearch } from './hooks';
import { CategoryTab, SearchInput } from './components';
import {
  SearchResultsGrid,
  RecentEmojisGrid,
  FavoritesGrid,
  UnicodeEmojisGrid,
} from './grids';
import { tweens } from '@/lib/animation-presets';

/**
 * Pack group with collapsible header and animated emoji preview
 */
const PackGroup = memo(function PackGroup({
  name,
  emojis: groupEmojis,
  favorites,
  handleSelect,
  toggleFavorite,
}: {
  name: string;
  emojis: CustomEmoji[];
  favorites: CustomEmoji[];
  handleSelect: (emoji: CustomEmoji | string) => void;
  toggleFavorite: (emoji: CustomEmoji) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const favIds = useMemo(() => new Set(favorites.map((f) => f.id)), [favorites]);

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center gap-1 rounded-md px-1 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/[0.06]"
      >
        <span className={`transition-transform ${collapsed ? '' : 'rotate-90'}`}>▶</span>
        {name}
        <span className="ml-auto text-[10px] text-gray-400">{groupEmojis.length}</span>
      </button>
      {!collapsed && (
        <div className="grid grid-cols-8 gap-1 px-1">
          {groupEmojis.map((emoji) => {
            const isAnimated = !!(emoji.is_animated || (emoji as unknown as Record<string, unknown>).isAnimated);
            const isHovered = hoveredId === emoji.id;
            return (
              <div
                key={emoji.id}
                className="group relative flex cursor-pointer flex-col items-center rounded-md p-1 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                onMouseEnter={() => setHoveredId(emoji.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => handleSelect(emoji)}
                title={`:${emoji.shortcode}:`}
              >
                <img
                  src={emoji.image_url}
                  alt={emoji.shortcode}
                  className={`h-7 w-7 object-contain ${isAnimated && !isHovered ? 'pause-animation' : ''}`}
                  loading="lazy"
                />
                {isAnimated && (
                  <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-purple-500" title="Animated" />
                )}
                <button
                  type="button"
                  className="absolute -left-0.5 -top-0.5 hidden group-hover:block"
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(emoji); }}
                >
                  {favIds.has(emoji.id) ? (
                    <StarIconSolid className="h-3 w-3 text-amber-500" />
                  ) : (
                    <StarIcon className="h-3 w-3 text-gray-400" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

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
       
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) { // safe downcast – DOM element
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
        transition={tweens.quickFade}
        className={`absolute z-50 ${positionStyles[position]} w-80 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-white/[0.08] dark:bg-white/[0.04] ${className}`}
        style={{ maxHeight }}
      >
        {/* Header */}
        <div className="border-b border-gray-200 p-3 dark:border-white/[0.08]">
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search emojis..." />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200 px-3 py-2 dark:border-white/[0.08]">
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
          <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-200 px-3 py-2 dark:border-white/[0.08]">
            <button
              onClick={() => setActiveCategory(null)}
              className={`whitespace-nowrap rounded-full px-2 py-1 text-xs ${
                !activeCategory
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-300'
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
                    : 'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-300'
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
            <div className="p-2">
              {/* Group by pack with collapsible headers */}
              {(() => {
                const grouped = new Map<string, { name: string; items: typeof filteredEmojis }>();
                const noPackKey = '__no_pack__';
                for (const e of filteredEmojis) {
                  const key = (e as unknown as Record<string, unknown>).pack_id as string || noPackKey;
                  const name = key === noPackKey ? 'Uncategorized' : (e as unknown as Record<string, unknown>).pack_name as string || 'Pack';
                  if (!grouped.has(key)) grouped.set(key, { name, items: [] });
                  grouped.get(key)!.items.push(e);
                }
                return Array.from(grouped.entries()).map(([key, group]) => (
                  <PackGroup key={key} name={group.name} emojis={group.items} favorites={favorites} handleSelect={handleSelect} toggleFavorite={toggleFavorite} />
                ));
              })()}
            </div>
          ) : activeTab === 'unicode' ? (
            <UnicodeEmojisGrid handleSelect={handleSelect} />
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-3 py-2 dark:border-white/[0.08]">
          <span className="text-xs text-gray-400">{emojis.length} custom emojis</span>
          <button
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/png,image/gif,image/webp';
              input.onchange = async (e) => {
                 
                const file = (e.target as HTMLInputElement).files?.[0]; // safe downcast – DOM element
                if (!file) return;
                const name = window.prompt('Emoji name (no spaces):', file.name.replace(/\.[^.]+$/, ''));
                if (!name?.trim()) return;
                const formData = new FormData();
                formData.append('image', file);
                formData.append('name', name.trim().replace(/\s+/g, '_'));
                try {
                  await api.post('/api/v1/emojis', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                  });
                } catch { /* silently fail */ }
              };
              input.click();
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

export default CustomEmojiPicker;

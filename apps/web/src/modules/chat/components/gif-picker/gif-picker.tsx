/**
 * GifPicker Component
 *
 * A comprehensive GIF selection interface for chat messaging.
 * Features GIF search via Tenor API, trending GIFs, categories,
 * favorites, and recently used GIFs.
 *
 * @version 0.9.4
 * @since 2026-01-20
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createLogger } from '@/lib/logger';
import { XMarkIcon, MagnifyingGlassIcon, ClockIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { GIF_CATEGORIES } from './constants';
import { generateSampleGifs } from './utils';
import { GifItem } from './gif-item';
import { CategoryButton } from './category-button';
import { EmptyState } from './empty-state';
import { useGifStorage } from './useGifStorage';
import type { GifPickerProps, GifResult } from './types';
import { tweens, loop } from '@/lib/animation-presets';

const logger = createLogger('GifPicker');

/**
 * unknown for the chat module.
 */
/**
 * Gif Picker component.
 */
export function GifPicker({ onSelect, onClose, isOpen, className }: GifPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('trending');
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showRecent, setShowRecent] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { favorites, recentlyUsed, toggleFavorite, addToRecent, isFavorite } = useGifStorage();

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Fetch GIFs from API
  const fetchGifs = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/v1/gifs/search', {
        params: { q: query || 'trending', limit: 30 },
      });

      if (response.data?.gifs) {
        setGifs(response.data.gifs);
      } else {
        setGifs(generateSampleGifs(query));
      }
    } catch (error) {
      logger.warn('GIF API not available, using fallback:', error);
      setGifs(generateSampleGifs(query));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (searchQuery.trim()) {
        fetchGifs(searchQuery);
        setShowFavorites(false);
        setShowRecent(false);
      } else if (!showFavorites && !showRecent) {
        const category = GIF_CATEGORIES.find((c) => c.id === activeCategory);
        fetchGifs(category?.searchTerm || '');
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, activeCategory, fetchGifs, showFavorites, showRecent]);

  // Handle category change
  const handleCategoryChange = useCallback(
    (categoryId: string) => {
      setActiveCategory(categoryId);
      setSearchQuery('');
      setShowFavorites(false);
      setShowRecent(false);
      const category = GIF_CATEGORIES.find((c) => c.id === categoryId);
      fetchGifs(category?.searchTerm || '');
    },
    [fetchGifs]
  );

  // Handle GIF selection
  const handleSelect = useCallback(
    (gif: GifResult) => {
      addToRecent(gif);
      onSelect(gif);
      onClose();
    },
    [addToRecent, onSelect, onClose]
  );

  // Current display list
  const displayGifs = useMemo(() => {
    if (showFavorites) return favorites;
    if (showRecent) return recentlyUsed;
    return gifs;
  }, [showFavorites, showRecent, favorites, recentlyUsed, gifs]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className={cn(
          'absolute z-50 w-[420px] overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04] shadow-2xl',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
          <h3 className="font-semibold text-white">Choose a GIF</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Search bar */}
        <div className="border-b border-white/[0.08] px-4 py-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search GIFs..."
              className="w-full rounded-lg border border-dark-500 bg-white/[0.06] py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-primary-500"
            />
          </div>
        </div>

        {/* Quick actions (Favorites & Recent) */}
        <div className="flex gap-2 border-b border-white/[0.08] px-4 py-2">
          <button
            onClick={() => {
              setShowFavorites(!showFavorites);
              setShowRecent(false);
            }}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              showFavorites
                ? 'bg-red-500/20 text-red-400'
                : 'bg-white/[0.06] text-gray-400 hover:bg-white/[0.10] hover:text-white'
            )}
          >
            <HeartSolidIcon className="h-3.5 w-3.5" />
            Favorites ({favorites.length})
          </button>
          <button
            onClick={() => {
              setShowRecent(!showRecent);
              setShowFavorites(false);
            }}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              showRecent
                ? 'bg-primary-500/20 text-primary-400'
                : 'bg-white/[0.06] text-gray-400 hover:bg-white/[0.10] hover:text-white'
            )}
          >
            <ClockIcon className="h-3.5 w-3.5" />
            Recent ({recentlyUsed.length})
          </button>
        </div>

        {/* Categories */}
        {!showFavorites && !showRecent && !searchQuery && (
          <div className="scrollbar-hide flex gap-2 overflow-x-auto border-b border-white/[0.08] px-4 py-2">
            {GIF_CATEGORIES.map((category) => (
              <CategoryButton
                key={category.id}
                category={category}
                isActive={activeCategory === category.id}
                onClick={() => handleCategoryChange(category.id)}
              />
            ))}
          </div>
        )}

        {/* GIF Grid */}
        <div className="scrollbar-thin scrollbar-track-dark-700 scrollbar-thumb-dark-500 h-[350px] overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={loop(tweens.slow)}
                className="h-8 w-8 rounded-full border-2 border-primary-500 border-t-transparent"
              />
            </div>
          ) : displayGifs.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-gray-500">
              <EmptyState type={showFavorites ? 'favorites' : showRecent ? 'recent' : 'search'} />
            </div>
          ) : (
            <div className="columns-2 gap-2 space-y-2">
              {displayGifs.map((gif) => (
                <GifItem
                  key={gif.id}
                  gif={gif}
                  onSelect={handleSelect}
                  isFavorite={isFavorite(gif.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer - Powered by */}
        <div className="border-t border-white/[0.08] px-4 py-2">
          <p className="text-center text-xs text-gray-500">
            Powered by{' '}
            <a
              href="https://tenor.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-400 hover:underline"
            >
              Tenor
            </a>
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default GifPicker;

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
import { motion, AnimatePresence } from 'framer-motion';
import { createLogger } from '@/lib/logger';

const logger = createLogger('GifPicker');
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  FireIcon,
  HeartIcon,
  ClockIcon,
  SparklesIcon,
  FaceSmileIcon,
  HandThumbUpIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

// ==================== TYPE DEFINITIONS ====================

export interface GifResult {
  id: string;
  title: string;
  url: string;
  previewUrl: string;
  width: number;
  height: number;
  source: 'tenor' | 'giphy';
}

export interface GifPickerProps {
  /** Callback when a GIF is selected */
  onSelect: (gif: GifResult) => void;
  /** Callback to close the picker */
  onClose: () => void;
  /** Whether the picker is open */
  isOpen: boolean;
  /** Optional className for positioning */
  className?: string;
}

interface GifItemProps {
  gif: GifResult;
  onSelect: (gif: GifResult) => void;
  isFavorite: boolean;
  onToggleFavorite: (gif: GifResult) => void;
}

interface CategoryButtonProps {
  category: GifCategory;
  isActive: boolean;
  onClick: () => void;
}

// ==================== CATEGORIES ====================

interface GifCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  searchTerm: string;
}

const GIF_CATEGORIES: GifCategory[] = [
  { id: 'trending', name: 'Trending', icon: <FireIcon className="h-4 w-4" />, searchTerm: '' },
  {
    id: 'reactions',
    name: 'Reactions',
    icon: <FaceSmileIcon className="h-4 w-4" />,
    searchTerm: 'reaction',
  },
  {
    id: 'emotions',
    name: 'Emotions',
    icon: <SparklesIcon className="h-4 w-4" />,
    searchTerm: 'emotion mood',
  },
  {
    id: 'agree',
    name: 'Agree',
    icon: <HandThumbUpIcon className="h-4 w-4" />,
    searchTerm: 'agree yes thumbs up',
  },
  { id: 'love', name: 'Love', icon: <HeartIcon className="h-4 w-4" />, searchTerm: 'love heart' },
  {
    id: 'memes',
    name: 'Memes',
    icon: <GlobeAltIcon className="h-4 w-4" />,
    searchTerm: 'meme funny',
  },
];

// ==================== LOCAL STORAGE KEYS ====================

const FAVORITES_KEY = 'cgraph-gif-favorites';
const RECENT_KEY = 'cgraph-gif-recent';
const MAX_RECENT = 20;
const MAX_FAVORITES = 50;

// ==================== GIF ITEM COMPONENT ====================

function GifItem({ gif, onSelect, isFavorite, onToggleFavorite }: GifItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <motion.div
      className="relative cursor-pointer overflow-hidden rounded-lg bg-dark-700"
      style={{ aspectRatio: gif.width / gif.height }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(gif)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Skeleton loader */}
      {!isLoaded && <div className="absolute inset-0 animate-pulse bg-dark-600" />}

      {/* GIF Image */}
      <img
        src={isHovered ? gif.url : gif.previewUrl}
        alt={gif.title}
        className={cn(
          'h-full w-full object-cover transition-opacity duration-200',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
      />

      {/* Hover overlay with favorite button */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(gif);
              }}
              className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 transition-colors hover:bg-black/70"
            >
              {isFavorite ? (
                <HeartSolidIcon className="h-4 w-4 text-red-500" />
              ) : (
                <HeartIcon className="h-4 w-4 text-white" />
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ==================== CATEGORY BUTTON COMPONENT ====================

function CategoryButton({ category, isActive, onClick }: CategoryButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary-600 text-white'
          : 'bg-dark-700 text-gray-400 hover:bg-dark-600 hover:text-white'
      )}
    >
      {category.icon}
      <span>{category.name}</span>
    </motion.button>
  );
}

// ==================== MAIN COMPONENT ====================

export function GifPicker({ onSelect, onClose, isOpen, className }: GifPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('trending');
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [favorites, setFavorites] = useState<GifResult[]>([]);
  const [recentlyUsed, setRecentlyUsed] = useState<GifResult[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showRecent, setShowRecent] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load favorites and recent from localStorage
  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem(FAVORITES_KEY);
      const storedRecent = localStorage.getItem(RECENT_KEY);
      if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
      if (storedRecent) setRecentlyUsed(JSON.parse(storedRecent));
    } catch (error) {
      logger.warn('Failed to load GIF preferences:', error);
    }
  }, []);

  // Save favorites to localStorage
  const saveFavorites = useCallback((newFavorites: GifResult[]) => {
    setFavorites(newFavorites);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
  }, []);

  // Save recent to localStorage
  const saveRecent = useCallback((newRecent: GifResult[]) => {
    setRecentlyUsed(newRecent);
    localStorage.setItem(RECENT_KEY, JSON.stringify(newRecent));
  }, []);

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
      // Try backend API first (which proxies to Tenor/Giphy)
      const response = await api.get('/api/v1/gifs/search', {
        params: { q: query || 'trending', limit: 30 },
      });

      if (response.data?.gifs) {
        setGifs(response.data.gifs);
      } else {
        // Fallback to sample data if API not available
        setGifs(generateSampleGifs(query));
      }
    } catch (error) {
      logger.warn('GIF API not available, using fallback:', error);
      // Use sample GIFs as fallback
      setGifs(generateSampleGifs(query));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate sample GIFs for demo/fallback
  const generateSampleGifs = (query: string): GifResult[] => {
    const terms = query || 'reaction';
    return Array.from({ length: 20 }, (_, i) => ({
      id: `sample-${terms}-${i}`,
      title: `${terms} GIF ${i + 1}`,
      url: `https://media.tenor.com/images/sample${i % 10}.gif`,
      previewUrl: `https://media.tenor.com/images/sample${i % 10}_preview.gif`,
      width: 200 + (i % 3) * 50,
      height: 200 + ((i + 1) % 3) * 50,
      source: 'tenor' as const,
    }));
  };

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
      // Add to recently used
      const newRecent = [gif, ...recentlyUsed.filter((g) => g.id !== gif.id)].slice(0, MAX_RECENT);
      saveRecent(newRecent);

      onSelect(gif);
      onClose();
    },
    [recentlyUsed, saveRecent, onSelect, onClose]
  );

  // Toggle favorite
  const toggleFavorite = useCallback(
    (gif: GifResult) => {
      const isFav = favorites.some((f) => f.id === gif.id);
      if (isFav) {
        saveFavorites(favorites.filter((f) => f.id !== gif.id));
      } else {
        saveFavorites([gif, ...favorites].slice(0, MAX_FAVORITES));
      }
    },
    [favorites, saveFavorites]
  );

  // Check if GIF is favorite
  const isFavorite = useCallback(
    (gifId: string) => favorites.some((f) => f.id === gifId),
    [favorites]
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
          'absolute z-50 w-[420px] overflow-hidden rounded-xl border border-dark-600 bg-dark-800 shadow-2xl',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-dark-600 px-4 py-3">
          <h3 className="font-semibold text-white">Choose a GIF</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-dark-700 hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Search bar */}
        <div className="border-b border-dark-600 px-4 py-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search GIFs..."
              className="w-full rounded-lg border border-dark-500 bg-dark-700 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-primary-500"
            />
          </div>
        </div>

        {/* Quick actions (Favorites & Recent) */}
        <div className="flex gap-2 border-b border-dark-600 px-4 py-2">
          <button
            onClick={() => {
              setShowFavorites(!showFavorites);
              setShowRecent(false);
            }}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              showFavorites
                ? 'bg-red-500/20 text-red-400'
                : 'bg-dark-700 text-gray-400 hover:bg-dark-600 hover:text-white'
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
                : 'bg-dark-700 text-gray-400 hover:bg-dark-600 hover:text-white'
            )}
          >
            <ClockIcon className="h-3.5 w-3.5" />
            Recent ({recentlyUsed.length})
          </button>
        </div>

        {/* Categories */}
        {!showFavorites && !showRecent && !searchQuery && (
          <div className="scrollbar-hide flex gap-2 overflow-x-auto border-b border-dark-600 px-4 py-2">
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
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="h-8 w-8 rounded-full border-2 border-primary-500 border-t-transparent"
              />
            </div>
          ) : displayGifs.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-gray-500">
              {showFavorites ? (
                <>
                  <HeartIcon className="mb-2 h-12 w-12" />
                  <p className="text-sm">No favorite GIFs yet</p>
                  <p className="text-xs">Click the heart on any GIF to save it</p>
                </>
              ) : showRecent ? (
                <>
                  <ClockIcon className="mb-2 h-12 w-12" />
                  <p className="text-sm">No recent GIFs</p>
                  <p className="text-xs">GIFs you use will appear here</p>
                </>
              ) : (
                <>
                  <MagnifyingGlassIcon className="mb-2 h-12 w-12" />
                  <p className="text-sm">No GIFs found</p>
                  <p className="text-xs">Try a different search term</p>
                </>
              )}
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
        <div className="border-t border-dark-600 px-4 py-2">
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

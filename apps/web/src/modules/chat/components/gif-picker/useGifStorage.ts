/**
 * useGifStorage Hook
 *
 * Manages favorites and recently used GIFs in localStorage.
 */

import { useState, useEffect, useCallback } from 'react';
import { createLogger } from '@/lib/logger';
import { FAVORITES_KEY, RECENT_KEY, MAX_FAVORITES, MAX_RECENT } from './constants';
import type { GifResult } from './types';

const logger = createLogger('useGifStorage');

/**
 * unknown for the chat module.
 */
/**
 * Hook for managing gif storage.
 */
export function useGifStorage() {
  const [favorites, setFavorites] = useState<GifResult[]>([]);
  const [recentlyUsed, setRecentlyUsed] = useState<GifResult[]>([]);

  // Load from localStorage on mount
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

  // Save favorites
  const saveFavorites = useCallback((newFavorites: GifResult[]) => {
    setFavorites(newFavorites);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
  }, []);

  // Save recent
  const saveRecent = useCallback((newRecent: GifResult[]) => {
    setRecentlyUsed(newRecent);
    localStorage.setItem(RECENT_KEY, JSON.stringify(newRecent));
  }, []);

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

  // Add to recent
  const addToRecent = useCallback(
    (gif: GifResult) => {
      const newRecent = [gif, ...recentlyUsed.filter((g) => g.id !== gif.id)].slice(0, MAX_RECENT);
      saveRecent(newRecent);
    },
    [recentlyUsed, saveRecent]
  );

  // Check if favorite
  const isFavorite = useCallback(
    (gifId: string) => favorites.some((f) => f.id === gifId),
    [favorites]
  );

  return {
    favorites,
    recentlyUsed,
    toggleFavorite,
    addToRecent,
    isFavorite,
  };
}

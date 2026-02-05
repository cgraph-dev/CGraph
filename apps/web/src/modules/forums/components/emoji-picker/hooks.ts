/**
 * Custom Emoji Hooks
 * Hooks for fetching and managing emoji state
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useDebounce } from '@/shared/hooks';
import { createLogger } from '@/lib/logger';
import type { CustomEmoji, EmojiCategory } from './types';

const logger = createLogger('EmojiHooks');

/**
 * Hook to fetch and manage custom emojis
 */
export function useCustomEmojis(forumId?: string) {
  const [emojis, setEmojis] = useState<CustomEmoji[]>([]);
  const [categories, setCategories] = useState<EmojiCategory[]>([]);
  const [favorites, setFavorites] = useState<CustomEmoji[]>([]);
  const [recent, setRecent] = useState<CustomEmoji[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmojis = async () => {
      try {
        setLoading(true);
        const params = forumId ? { forum_id: forumId } : {};

        const [emojisRes, categoriesRes, favoritesRes, recentRes] = await Promise.all([
          api.get('/api/v1/emojis', { params }),
          api.get('/api/v1/emojis/categories', { params }),
          api.get('/api/v1/emojis/favorites').catch(() => ({ data: { data: [] } })),
          api.get('/api/v1/emojis/recent').catch(() => ({ data: { data: [] } })),
        ]);

        setEmojis(emojisRes.data?.data || []);
        setCategories(categoriesRes.data?.data || []);
        setFavorites(favoritesRes.data?.data || []);
        setRecent(recentRes.data?.data || []);
        setError(null);
      } catch (err) {
        logger.error('Failed to fetch emojis:', err);
        setError('Failed to load emojis');
      } finally {
        setLoading(false);
      }
    };

    fetchEmojis();
  }, [forumId]);

  const toggleFavorite = useCallback(
    async (emoji: CustomEmoji) => {
      const isFavorite = favorites.some((f) => f.id === emoji.id);

      try {
        if (isFavorite) {
          await api.delete(`/api/v1/emojis/${emoji.id}/favorite`);
          setFavorites((prev) => prev.filter((f) => f.id !== emoji.id));
        } else {
          await api.post(`/api/v1/emojis/${emoji.id}/favorite`);
          setFavorites((prev) => [...prev, emoji]);
        }
      } catch (err) {
        logger.error('Failed to toggle favorite:', err);
      }
    },
    [favorites]
  );

  const trackUsage = useCallback(async (emoji: CustomEmoji) => {
    try {
      await api.post(`/api/v1/emojis/${emoji.id}/use`);
      // Update recent list
      setRecent((prev) => {
        const filtered = prev.filter((e) => e.id !== emoji.id);
        return [emoji, ...filtered].slice(0, 20);
      });
    } catch (_err) {
      // Silent fail - usage tracking is not critical
    }
  }, []);

  return {
    emojis,
    categories,
    favorites,
    recent,
    loading,
    error,
    toggleFavorite,
    trackUsage,
  };
}

/**
 * Hook for emoji search
 */
export function useEmojiSearch(emojis: CustomEmoji[], forumId?: string) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<CustomEmoji[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const search = async () => {
      setIsSearching(true);
      try {
        const params: Record<string, string> = { q: debouncedSearch };
        if (forumId) params.forum_id = forumId;

        const response = await api.get('/api/v1/emojis/search', { params });
        setSearchResults(response.data?.data || []);
      } catch (_err) {
        // Fall back to local search
        const term = debouncedSearch.toLowerCase();
        const results = emojis.filter(
          (e) =>
            e.shortcode.toLowerCase().includes(term) ||
            e.name.toLowerCase().includes(term) ||
            e.aliases.some((a) => a.toLowerCase().includes(term))
        );
        setSearchResults(results);
      } finally {
        setIsSearching(false);
      }
    };

    search();
  }, [debouncedSearch, emojis, forumId]);

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    isSearchActive: searchTerm.length >= 2,
  };
}

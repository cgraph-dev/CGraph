/**
 * Custom hooks for EmojiPicker
 * @module modules/chat/components/emoji-picker
 */

import { useState, useEffect, RefObject } from 'react';

import type { AnimatedEmoji } from '@/lib/lottie';
import { preloadAnimations } from '@/lib/lottie';
import {
  EMOJI_CATEGORIES,
  MAX_RECENT_EMOJIS,
  DISPLAY_RECENT_COUNT,
  fetchAnimatedEmojiCatalog,
} from './emojiData';
import type { EmojiCategory } from './types';

/**
 * Hook to manage recently used emojis in localStorage.
 */
export function useRecentEmojis() {
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);

  // Load recent emojis from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentEmojis');
    if (stored) {
      setRecentEmojis(JSON.parse(stored));
    }
  }, []);

  const addRecentEmoji = (emoji: string) => {
    const updated = [emoji, ...recentEmojis.filter((e) => e !== emoji)].slice(0, MAX_RECENT_EMOJIS);
    setRecentEmojis(updated);
    localStorage.setItem('recentEmojis', JSON.stringify(updated));

    // Update frequently used category
    EMOJI_CATEGORIES['Frequently Used'] = updated.slice(0, DISPLAY_RECENT_COUNT);
  };

  return { recentEmojis, addRecentEmoji };
}

/**
 * Hook to handle click outside detection for closing picker.
 */
export function useClickOutside(
  ref: RefObject<HTMLDivElement | null>,
  isOpen: boolean,
  onClose: () => void
) {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (ref.current && target instanceof Node && !ref.current.contains(target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [ref, isOpen, onClose]);
}

/**
 * Hook to filter emojis based on search query and category.
 */
export function useFilteredEmojis(searchQuery: string, activeCategory: EmojiCategory) {
  const filteredEmojis = searchQuery.trim()
    ? Object.values(EMOJI_CATEGORIES)
        .flat()
        .filter((emoji) => emoji.includes(searchQuery.trim()))
    : EMOJI_CATEGORIES[activeCategory];

  return filteredEmojis;
}

/**
 * Hook to load animated emoji catalog and preload visible animations.
 */
export function useAnimatedEmojiCatalog(isOpen: boolean) {
  const [catalog, setCatalog] = useState<Map<string, AnimatedEmoji> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (catalog) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      const result = await fetchAnimatedEmojiCatalog();
      if (!cancelled) {
        setCatalog(result);
        setLoading(false);

        // Preload first 20 animated emojis in the visible set
        const codepoints = [...result.values()]
          .filter((e) => e.hasAnimation)
          .slice(0, 20)
          .map((e) => e.codepoint);
        preloadAnimations(codepoints);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [isOpen, catalog]);

  return { catalog, loading };
}

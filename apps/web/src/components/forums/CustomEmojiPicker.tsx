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
  XMarkIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { api } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';

// =============================================================================
// TYPES
// =============================================================================

export interface CustomEmoji {
  id: string;
  shortcode: string;
  name: string;
  description?: string;
  image_url: string;
  image_type: string;
  is_animated: boolean;
  category_id?: string;
  category?: EmojiCategory;
  usage_count: number;
  aliases: string[];
}

export interface EmojiCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  display_order: number;
}

export interface CustomEmojiPickerProps {
  /** Callback when an emoji is selected */
  onSelect: (emoji: CustomEmoji | string) => void;
  /** Optional forum ID for forum-specific emojis */
  forumId?: string;
  /** Whether the picker is open */
  isOpen: boolean;
  /** Close the picker */
  onClose: () => void;
  /** Position relative to trigger */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Show Unicode emojis tab */
  showUnicode?: boolean;
  /** Custom class name */
  className?: string;
  /** Max height */
  maxHeight?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

// Common Unicode emoji categories
const UNICODE_CATEGORIES = [
  {
    id: 'smileys',
    name: 'Smileys',
    icon: '😀',
    emojis: [
      '😀',
      '😃',
      '😄',
      '😁',
      '😅',
      '😂',
      '🤣',
      '😊',
      '😇',
      '🙂',
      '🙃',
      '😉',
      '😌',
      '😍',
      '🥰',
      '😘',
      '😗',
      '😙',
      '😚',
      '😋',
      '😛',
      '😜',
      '🤪',
      '😝',
      '🤑',
      '🤗',
      '🤭',
      '🤫',
      '🤔',
      '🤐',
      '🤨',
      '😐',
      '😑',
      '😶',
      '😏',
      '😒',
      '🙄',
      '😬',
      '🤥',
      '😌',
      '😔',
      '😪',
      '🤤',
      '😴',
      '😷',
      '🤒',
      '🤕',
      '🤢',
      '🤮',
      '🤧',
      '🥵',
      '🥶',
      '🥴',
      '😵',
      '🤯',
      '🤠',
      '🥳',
      '😎',
      '🤓',
      '🧐',
    ],
  },
  {
    id: 'gestures',
    name: 'Gestures',
    icon: '👋',
    emojis: [
      '👋',
      '🤚',
      '🖐️',
      '✋',
      '🖖',
      '👌',
      '🤏',
      '✌️',
      '🤞',
      '🤟',
      '🤘',
      '🤙',
      '👈',
      '👉',
      '👆',
      '🖕',
      '👇',
      '☝️',
      '👍',
      '👎',
      '✊',
      '👊',
      '🤛',
      '🤜',
      '👏',
      '🙌',
      '👐',
      '🤲',
      '🤝',
      '🙏',
      '✍️',
      '💪',
    ],
  },
  {
    id: 'people',
    name: 'People',
    icon: '👤',
    emojis: [
      '👶',
      '👧',
      '🧒',
      '👦',
      '👩',
      '🧑',
      '👨',
      '👩‍🦱',
      '🧑‍🦱',
      '👨‍🦱',
      '👩‍🦰',
      '🧑‍🦰',
      '👨‍🦰',
      '👱‍♀️',
      '👱',
      '👱‍♂️',
      '👩‍🦳',
      '🧑‍🦳',
      '👨‍🦳',
      '👩‍🦲',
      '🧑‍🦲',
      '👨‍🦲',
      '🧔',
      '👵',
      '🧓',
      '👴',
    ],
  },
  {
    id: 'animals',
    name: 'Animals',
    icon: '🐱',
    emojis: [
      '🐶',
      '🐱',
      '🐭',
      '🐹',
      '🐰',
      '🦊',
      '🐻',
      '🐼',
      '🐨',
      '🐯',
      '🦁',
      '🐮',
      '🐷',
      '🐸',
      '🐵',
      '🙈',
      '🙉',
      '🙊',
      '🐒',
      '🐔',
      '🐧',
      '🐦',
      '🐤',
      '🦆',
      '🦅',
      '🦉',
      '🦇',
      '🐺',
      '🐗',
      '🐴',
      '🦄',
      '🐝',
      '🐛',
      '🦋',
      '🐌',
      '🐞',
      '🐜',
      '🦟',
      '🦗',
      '🕷️',
      '🦂',
      '🐢',
      '🐍',
      '🦎',
      '🦖',
      '🦕',
      '🐙',
      '🦑',
      '🦐',
      '🦞',
      '🦀',
      '🐡',
      '🐠',
      '🐟',
      '🐬',
      '🐳',
      '🐋',
      '🦈',
      '🐊',
    ],
  },
  {
    id: 'food',
    name: 'Food',
    icon: '🍕',
    emojis: [
      '🍏',
      '🍎',
      '🍐',
      '🍊',
      '🍋',
      '🍌',
      '🍉',
      '🍇',
      '🍓',
      '🍈',
      '🍒',
      '🍑',
      '🥭',
      '🍍',
      '🥥',
      '🥝',
      '🍅',
      '🍆',
      '🥑',
      '🥦',
      '🥬',
      '🥒',
      '🌶️',
      '🌽',
      '🥕',
      '🧄',
      '🧅',
      '🥔',
      '🍠',
      '🥐',
      '🥯',
      '🍞',
      '🥖',
      '🥨',
      '🧀',
      '🥚',
      '🍳',
      '🧈',
      '🥞',
      '🧇',
      '🥓',
      '🥩',
      '🍗',
      '🍖',
      '🦴',
      '🌭',
      '🍔',
      '🍟',
      '🍕',
      '🥪',
      '🥙',
      '🧆',
      '🌮',
      '🌯',
      '🥗',
      '🥘',
      '🥫',
      '🍝',
      '🍜',
      '🍲',
      '🍛',
      '🍣',
      '🍱',
      '🥟',
      '🦪',
      '🍤',
      '🍙',
      '🍚',
      '🍘',
      '🍥',
      '🥠',
      '🥮',
      '🍢',
      '🍡',
      '🍧',
      '🍨',
      '🍦',
      '🥧',
      '🧁',
      '🍰',
      '🎂',
      '🍮',
      '🍭',
      '🍬',
      '🍫',
      '🍿',
      '🍩',
      '🍪',
    ],
  },
  {
    id: 'activities',
    name: 'Activities',
    icon: '⚽',
    emojis: [
      '⚽',
      '🏀',
      '🏈',
      '⚾',
      '🥎',
      '🎾',
      '🏐',
      '🏉',
      '🥏',
      '🎱',
      '🪀',
      '🏓',
      '🏸',
      '🏒',
      '🏑',
      '🥍',
      '🏏',
      '🪃',
      '🥅',
      '⛳',
      '🪁',
      '🏹',
      '🎣',
      '🤿',
      '🥊',
      '🥋',
      '🎽',
      '🛹',
      '🛼',
      '🛷',
      '⛸️',
      '🥌',
      '🎿',
      '⛷️',
      '🏂',
      '🎮',
      '🕹️',
      '🎯',
      '🎲',
      '🧩',
      '🎰',
      '🎳',
    ],
  },
  {
    id: 'objects',
    name: 'Objects',
    icon: '💡',
    emojis: [
      '💡',
      '🔦',
      '🏮',
      '🪔',
      '📱',
      '💻',
      '🖥️',
      '🖨️',
      '⌨️',
      '🖱️',
      '🖲️',
      '💽',
      '💾',
      '💿',
      '📀',
      '📼',
      '📷',
      '📸',
      '📹',
      '🎥',
      '📽️',
      '🎞️',
      '📞',
      '☎️',
      '📟',
      '📠',
      '📺',
      '📻',
      '🎙️',
      '🎚️',
      '🎛️',
      '🧭',
      '⏱️',
      '⏲️',
      '⏰',
      '🕰️',
      '⌛',
      '⏳',
      '📡',
      '🔋',
      '🔌',
      '💎',
      '⚖️',
      '🧰',
      '🔧',
      '🔨',
      '⚒️',
      '🛠️',
      '⛏️',
      '🔩',
      '⚙️',
      '🧱',
      '⛓️',
      '🧲',
      '🔫',
      '💣',
      '🧨',
      '🪓',
      '🔪',
      '🗡️',
      '⚔️',
      '🛡️',
      '🚬',
      '⚰️',
      '🪦',
      '⚱️',
      '🏺',
      '🔮',
      '📿',
      '🧿',
      '💈',
      '⚗️',
      '🔭',
      '🔬',
      '🕳️',
      '🩹',
      '🩺',
      '💊',
      '💉',
      '🩸',
      '🧬',
      '🦠',
      '🧫',
      '🧪',
    ],
  },
  {
    id: 'symbols',
    name: 'Symbols',
    icon: '❤️',
    emojis: [
      '❤️',
      '🧡',
      '💛',
      '💚',
      '💙',
      '💜',
      '🖤',
      '🤍',
      '🤎',
      '💔',
      '❣️',
      '💕',
      '💞',
      '💓',
      '💗',
      '💖',
      '💘',
      '💝',
      '💟',
      '☮️',
      '✝️',
      '☪️',
      '🕉️',
      '☸️',
      '✡️',
      '🔯',
      '🕎',
      '☯️',
      '☦️',
      '🛐',
      '⛎',
      '♈',
      '♉',
      '♊',
      '♋',
      '♌',
      '♍',
      '♎',
      '♏',
      '♐',
      '♑',
      '♒',
      '♓',
      '🆔',
      '⚛️',
      '🉑',
      '☢️',
      '☣️',
      '📴',
      '📳',
      '🈶',
      '🈚',
      '🈸',
      '🈺',
      '🈷️',
      '✴️',
      '🆚',
      '💮',
      '🉐',
      '㊙️',
      '㊗️',
      '🈴',
      '🈵',
      '🈹',
      '🈲',
      '🅰️',
      '🅱️',
      '🆎',
      '🆑',
      '🅾️',
      '🆘',
      '❌',
      '⭕',
      '🛑',
      '⛔',
      '📛',
      '🚫',
      '💯',
      '💢',
      '♨️',
      '🚷',
      '🚯',
      '🚳',
      '🚱',
      '🔞',
      '📵',
      '🚭',
      '❗',
      '❕',
      '❓',
      '❔',
      '‼️',
      '⁉️',
      '🔅',
      '🔆',
      '〽️',
      '⚠️',
      '🚸',
      '🔱',
      '⚜️',
      '🔰',
      '♻️',
      '✅',
      '🈯',
      '💹',
      '❇️',
      '✳️',
      '❎',
      '🌐',
      '💠',
      'Ⓜ️',
      '🌀',
      '💤',
      '🏧',
      '🚾',
      '♿',
      '🅿️',
      '🈳',
      '🈂️',
      '🛂',
      '🛃',
      '🛄',
      '🛅',
      '🚹',
      '🚺',
      '🚼',
      '⚧️',
      '🚻',
      '🚮',
      '🎦',
      '📶',
      '🈁',
      '🔣',
      'ℹ️',
      '🔤',
      '🔡',
      '🔠',
      '🆖',
      '🆗',
      '🆙',
      '🆒',
      '🆕',
      '🆓',
      '0️⃣',
      '1️⃣',
      '2️⃣',
      '3️⃣',
      '4️⃣',
      '5️⃣',
      '6️⃣',
      '7️⃣',
      '8️⃣',
      '9️⃣',
      '🔟',
      '🔢',
      '#️⃣',
      '*️⃣',
      '⏏️',
      '▶️',
      '⏸️',
      '⏯️',
      '⏹️',
      '⏺️',
      '⏭️',
      '⏮️',
      '⏩',
      '⏪',
      '⏫',
      '⏬',
      '◀️',
      '🔼',
      '🔽',
      '➡️',
      '⬅️',
      '⬆️',
      '⬇️',
      '↗️',
      '↘️',
      '↙️',
      '↖️',
      '↕️',
      '↔️',
      '↪️',
      '↩️',
      '⤴️',
      '⤵️',
      '🔀',
      '🔁',
      '🔂',
      '🔄',
      '🔃',
      '🎵',
      '🎶',
      '➕',
      '➖',
      '➗',
      '✖️',
      '♾️',
      '💲',
      '💱',
      '™️',
      '©️',
      '®️',
      '〰️',
      '➰',
      '➿',
      '🔚',
      '🔙',
      '🔛',
      '🔝',
      '🔜',
      '✔️',
      '☑️',
      '🔘',
      '🔴',
      '🟠',
      '🟡',
      '🟢',
      '🔵',
      '🟣',
      '⚫',
      '⚪',
      '🟤',
      '🔺',
      '🔻',
      '🔸',
      '🔹',
      '🔶',
      '🔷',
      '🔳',
      '🔲',
      '▪️',
      '▫️',
      '◾',
      '◽',
      '◼️',
      '◻️',
      '🟥',
      '🟧',
      '🟨',
      '🟩',
      '🟦',
      '🟪',
      '⬛',
      '⬜',
      '🟫',
      '🔈',
      '🔇',
      '🔉',
      '🔊',
      '🔔',
      '🔕',
      '📣',
      '📢',
    ],
  },
];

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to fetch and manage custom emojis
 */
function useCustomEmojis(forumId?: string) {
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
        console.error('Failed to fetch emojis:', err);
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
        console.error('Failed to toggle favorite:', err);
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
function useEmojiSearch(emojis: CustomEmoji[], forumId?: string) {
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

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Single emoji button
 */
const EmojiButton = memo(function EmojiButton({
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
const UnicodeEmojiButton = memo(function UnicodeEmojiButton({
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
const CategoryTab = memo(function CategoryTab({
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
const SearchInput = memo(function SearchInput({
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
const EmptyState = memo(function EmptyState({
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

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const CustomEmojiPicker = memo(function CustomEmojiPicker({
  onSelect,
  forumId,
  isOpen,
  onClose,
  position = 'bottom',
  showUnicode = true,
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
        className={`absolute z-50 ${positionStyles[position]} w-80 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 ${className} `}
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
              } `}
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
                } `}
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
          ) : activeTab === 'recent' ? (
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
          ) : activeTab === 'favorites' ? (
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
          ) : activeTab === 'custom' ? (
            <div className="p-3">
              {filteredEmojis.length > 0 ? (
                <div className="grid grid-cols-8 gap-1">
                  {filteredEmojis.map((emoji) => (
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
          ) : activeTab === 'unicode' ? (
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

export default CustomEmojiPicker;

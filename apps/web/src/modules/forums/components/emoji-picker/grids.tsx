/**
 * Emoji Picker Grid Sub-Components
 *
 * Grid layouts for different emoji categories:
 * - Search results
 * - Recent emojis
 * - Favorites
 * - Custom emojis
 * - Unicode emojis
 *
 * @module components/forums/emoji-picker/grids
 */

import {
  MagnifyingGlassIcon,
  ClockIcon,
  StarIcon,
  FaceSmileIcon,
} from '@heroicons/react/24/outline';

import { CustomEmoji } from './types';
import { EmojiButton, UnicodeEmojiButton, EmptyState } from './components';
import { UNICODE_CATEGORIES } from './unicode-emojis';

// =============================================================================
// SEARCH RESULTS GRID
// =============================================================================

export interface SearchResultsGridProps {
  isSearching: boolean;
  searchResults: CustomEmoji[];
  searchTerm: string;
  favorites: CustomEmoji[];
  handleSelect: (emoji: CustomEmoji | string) => void;
  toggleFavorite: (emoji: CustomEmoji) => void;
}

export function SearchResultsGrid({
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

// =============================================================================
// RECENT EMOJIS GRID
// =============================================================================

export interface RecentEmojisGridProps {
  recent: CustomEmoji[];
  handleSelect: (emoji: CustomEmoji | string) => void;
}

export function RecentEmojisGrid({ recent, handleSelect }: RecentEmojisGridProps) {
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

// =============================================================================
// FAVORITES GRID
// =============================================================================

export interface FavoritesGridProps {
  favorites: CustomEmoji[];
  handleSelect: (emoji: CustomEmoji | string) => void;
  toggleFavorite: (emoji: CustomEmoji) => void;
}

export function FavoritesGrid({ favorites, handleSelect, toggleFavorite }: FavoritesGridProps) {
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

// =============================================================================
// CUSTOM EMOJIS GRID
// =============================================================================

export interface CustomEmojisGridProps {
  emojis: CustomEmoji[];
  favorites: CustomEmoji[];
  handleSelect: (emoji: CustomEmoji | string) => void;
  toggleFavorite: (emoji: CustomEmoji) => void;
}

export function CustomEmojisGrid({
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

// =============================================================================
// UNICODE EMOJIS GRID
// =============================================================================

export interface UnicodeEmojisGridProps {
  handleSelect: (emoji: CustomEmoji | string) => void;
}

export function UnicodeEmojisGrid({ handleSelect }: UnicodeEmojisGridProps) {
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

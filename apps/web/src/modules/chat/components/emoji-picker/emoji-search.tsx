/**
 * Search input component for emoji picker
 * @module modules/chat/components/emoji-picker
 */

import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface EmojiSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

/**
 * unknown for the chat module.
 */
/**
 * Emoji Search component.
 */
export function EmojiSearch({ searchQuery, onSearchChange }: EmojiSearchProps) {
  return (
    <div className="border-b border-white/10 p-3">
      <div className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2">
        <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search emojis..."
          className="w-full bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
        />
        {searchQuery && (
          <button onClick={() => onSearchChange('')} className="text-gray-400 hover:text-white">
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

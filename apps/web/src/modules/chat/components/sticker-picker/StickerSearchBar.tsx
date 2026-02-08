/**
 * StickerSearchBar - Search input for filtering stickers
 */

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface StickerSearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function StickerSearchBar({ searchQuery, onSearchChange }: StickerSearchBarProps) {
  return (
    <div className="border-b border-white/5 px-4 py-2">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search stickers..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            'w-full rounded-lg py-2 pl-9 pr-4',
            'border border-white/5 bg-dark-700/50',
            'text-white placeholder-gray-500',
            'focus:border-primary-500/50 focus:outline-none',
            'transition-colors'
          )}
        />
      </div>
    </div>
  );
}

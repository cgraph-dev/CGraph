/**
 * SearchBar component for theme filtering
 * @module pages/customize/theme-customization
 */

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search themes..."
        className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-white placeholder:text-white/40 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
    </div>
  );
}

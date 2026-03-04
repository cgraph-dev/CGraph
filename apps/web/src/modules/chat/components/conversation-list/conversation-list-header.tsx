/**
 * ConversationListHeader component
 * @module modules/chat/components/conversation-list
 */

import { motion } from 'motion/react';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useThemeStore, THEME_COLORS } from '@/stores/theme';
import type { FilterType } from './types';
import { FILTER_OPTIONS } from './constants';

interface ConversationListHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  onNewChat: () => void;
}

/**
 * unknown for the chat module.
 */
/**
 * Conversation List Header component.
 */
export function ConversationListHeader({
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  onNewChat,
}: ConversationListHeaderProps) {
  const { theme } = useThemeStore();
  const colors = THEME_COLORS[theme.colorPreset];

  return (
    <div className="border-b border-white/[0.06] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Messages</h2>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onNewChat}
          className="rounded-xl bg-primary-600 p-2 text-white"
          style={{ backgroundColor: colors.primary }}
        >
          <PlusIcon className="h-5 w-5" />
        </motion.button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] py-2 pl-9 pr-4 text-sm text-white placeholder-white/30 focus:border-primary-500/50 focus:outline-none"
        />
      </div>

      {/* Filters */}
      <div className="mt-3 flex gap-2">
        {FILTER_OPTIONS.map((f) => (
          <motion.button
            key={f.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onFilterChange(f.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.id
                ? 'bg-primary-600/20 text-primary-400'
                : 'bg-white/[0.06] text-gray-400 hover:text-white'
            }`}
          >
            {f.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

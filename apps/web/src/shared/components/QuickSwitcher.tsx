/**
 * QuickSwitcher - Cmd+K / Ctrl+K command palette for fast navigation
 * @module shared/components
 *
 * Search across: conversations, groups, channels, friends, settings pages
 * Keyboard: Arrow up/down to select, Enter to navigate, Escape to close
 * Shows recent items by default.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springs } from '@/lib/animation-presets/presets';
import {
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  HashtagIcon,
  UserIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

interface QuickSwitcherItem {
  id: string;
  type: 'conversation' | 'group' | 'channel' | 'friend' | 'settings';
  name: string;
  subtitle?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  path: string;
}

const ICON_MAP: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  conversation: ChatBubbleLeftRightIcon,
  group: UserGroupIcon,
  channel: HashtagIcon,
  friend: UserIcon,
  settings: Cog6ToothIcon,
};

const SETTINGS_PAGES: QuickSwitcherItem[] = [
  { id: 'settings-account', type: 'settings', name: 'Account Settings', path: '/settings/account', icon: Cog6ToothIcon },
  { id: 'settings-appearance', type: 'settings', name: 'Appearance', path: '/settings/appearance', icon: Cog6ToothIcon },
  { id: 'settings-notifications', type: 'settings', name: 'Notifications', path: '/settings/notifications', icon: Cog6ToothIcon },
  { id: 'settings-privacy', type: 'settings', name: 'Privacy & Security', path: '/settings/privacy', icon: Cog6ToothIcon },
  { id: 'settings-customization', type: 'settings', name: 'Customization', path: '/settings/customization', icon: Cog6ToothIcon },
];

interface QuickSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  items?: QuickSwitcherItem[];
}

export function QuickSwitcher({ isOpen, onClose, items = [] }: QuickSwitcherProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const allItems = useMemo(() => [...items, ...SETTINGS_PAGES], [items]);

  const filtered = useMemo(() => {
    if (!query.trim()) {
      // Show recent items (first 8)
      return allItems.slice(0, 8);
    }
    const q = query.toLowerCase();
    return allItems
      .filter((item) =>
        item.name.toLowerCase().includes(q) ||
        item.subtitle?.toLowerCase().includes(q) ||
        item.type.includes(q)
      )
      .slice(0, 12);
  }, [query, allItems]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered.length]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [selectedIndex]);

  const handleSelect = useCallback((item: QuickSwitcherItem) => {
    navigate(item.path);
    onClose();
  }, [navigate, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[selectedIndex]) {
          handleSelect(filtered[selectedIndex]);
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  }, [filtered, selectedIndex, handleSelect, onClose]);

  // Global Cmd+K / Ctrl+K handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 pt-[20vh] backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={springs.snappy}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg overflow-hidden rounded-xl border border-gray-700/50 bg-dark-800 shadow-2xl"
        >
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-gray-700/50 px-4 py-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Where would you like to go?"
              className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none"
            />
            <kbd className="rounded bg-dark-700 px-2 py-0.5 text-xs text-gray-500">ESC</kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No results for &ldquo;{query}&rdquo;
              </div>
            ) : (
              filtered.map((item, index) => {
                const Icon = item.icon || ICON_MAP[item.type] || Cog6ToothIcon;
                const isSelected = index === selectedIndex;
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.2 }}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      isSelected
                        ? 'bg-primary-600/20 text-white'
                        : 'text-gray-300 hover:bg-dark-700'
                    }`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${isSelected ? 'text-primary-400' : 'text-gray-500'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{highlightMatch(item.name, query)}</div>
                      {item.subtitle && (
                        <div className="truncate text-xs text-gray-500">{item.subtitle}</div>
                      )}
                    </div>
                    <span className="shrink-0 rounded bg-dark-700 px-1.5 py-0.5 text-[10px] uppercase text-gray-500">
                      {item.type}
                    </span>
                  </motion.button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 border-t border-gray-700/50 px-4 py-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-dark-700 px-1.5 py-0.5">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-dark-700 px-1.5 py-0.5">↵</kbd> Open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-dark-700 px-1.5 py-0.5">Esc</kbd> Close
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <span className="text-primary-400">{text.slice(index, index + query.length)}</span>
      {text.slice(index + query.length)}
    </>
  );
}

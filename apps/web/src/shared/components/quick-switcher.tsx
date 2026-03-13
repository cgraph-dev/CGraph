/**
 * QuickSwitcher - Cmd+K / Ctrl+K command palette for fast navigation
 * @module shared/components
 *
 * Search across: conversations, groups, channels, friends, settings pages
 * Keyboard: Arrow up/down to select, Enter to navigate, Escape to close
 * Shows recent items by default.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { springPreset, glassSurfaceElevated } from '@/components/liquid-glass/shared';
import {
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  HashtagIcon,
  UserIcon,
  Cog6ToothIcon,
  NewspaperIcon,
  PlusCircleIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

interface QuickSwitcherItem {
  id: string;
  type: 'conversation' | 'group' | 'channel' | 'friend' | 'settings' | 'forum' | 'action';
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
  forum: NewspaperIcon,
  action: PlusCircleIcon,
};

const SETTINGS_PAGES: QuickSwitcherItem[] = [
  {
    id: 'settings-account',
    type: 'settings',
    name: 'Account Settings',
    path: '/settings/account',
    icon: Cog6ToothIcon,
  },
  {
    id: 'settings-appearance',
    type: 'settings',
    name: 'Appearance',
    path: '/settings/appearance',
    icon: Cog6ToothIcon,
  },
  {
    id: 'settings-notifications',
    type: 'settings',
    name: 'Notifications',
    path: '/settings/notifications',
    icon: Cog6ToothIcon,
  },
  {
    id: 'settings-privacy',
    type: 'settings',
    name: 'Privacy & Security',
    path: '/settings/privacy',
    icon: Cog6ToothIcon,
  },
  {
    id: 'settings-customization',
    type: 'settings',
    name: 'Customization',
    path: '/settings/customization',
    icon: Cog6ToothIcon,
  },
];

const QUICK_ACTIONS: QuickSwitcherItem[] = [
  {
    id: 'action-new-dm',
    type: 'action',
    name: 'New Message',
    subtitle: 'Start a conversation',
    path: '/messages?new=true',
    icon: ChatBubbleLeftRightIcon,
  },
  {
    id: 'action-new-group',
    type: 'action',
    name: 'Create Group',
    subtitle: 'Start a new group',
    path: '/groups/create',
    icon: UserGroupIcon,
  },
  {
    id: 'action-explore',
    type: 'action',
    name: 'Explore Communities',
    subtitle: 'Discover groups & forums',
    path: '/explore',
    icon: GlobeAltIcon,
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  conversation: 'Conversations',
  channel: 'Channels',
  group: 'Groups',
  forum: 'Forums',
  friend: 'Friends',
  action: 'Actions',
  settings: 'Settings',
};

interface QuickSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  items?: QuickSwitcherItem[];
}

/**
 * unknown for the quick-switcher.tsx module.
 */
/**
 * Quick Switcher component.
 */
export function QuickSwitcher({ isOpen, onClose, items = [] }: QuickSwitcherProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const allItems = useMemo(() => [...items, ...SETTINGS_PAGES, ...QUICK_ACTIONS], [items]);

  const filtered = useMemo(() => {
    if (!query.trim()) {
      // Show recent items (first 8)
      return allItems.slice(0, 8);
    }
    const q = query.toLowerCase();
    return allItems
      .filter(
        (item) =>
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
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined; // safe downcast – DOM element
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (item: QuickSwitcherItem) => {
      navigate(item.path);
      onClose();
    },
    [navigate, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
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
    },
    [filtered, selectedIndex, handleSelect, onClose]
  );

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
          transition={springPreset}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-lg overflow-hidden rounded-xl ${glassSurfaceElevated}`}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-blue-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Where would you like to go?"
              className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none"
            />
            <kbd className="rounded border border-white/[0.06] bg-white/[0.08] px-2 py-0.5 text-xs text-gray-500">
              ESC
            </kbd>
          </div>

          {/* Results with category headers */}
          <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No results for &ldquo;{query}&rdquo;
              </div>
            ) : (
              (() => {
                let lastCategory = '';
                let flatIndex = -1;
                return filtered.map((item) => {
                  flatIndex++;
                  const currentFlatIndex = flatIndex;
                  const Icon = item.icon || ICON_MAP[item.type] || Cog6ToothIcon;
                  const isSelected = currentFlatIndex === selectedIndex;
                  const showHeader = item.type !== lastCategory;
                  lastCategory = item.type;

                  return (
                    <React.Fragment key={item.id}>
                      {showHeader && (
                        <div className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          {CATEGORY_LABELS[item.type] || item.type}
                        </div>
                      )}
                      <motion.button
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: currentFlatIndex * 0.03, ...springPreset }}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(currentFlatIndex)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                          isSelected
                            ? 'bg-white/[0.10] text-white'
                            : 'text-gray-300 hover:bg-white/[0.06]'
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 shrink-0 ${isSelected ? 'text-primary-400' : 'text-gray-500'}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            {highlightMatch(item.name, query)}
                          </div>
                          {item.subtitle && (
                            <div className="truncate text-xs text-gray-500">{item.subtitle}</div>
                          )}
                        </div>
                        <span className="shrink-0 rounded border border-white/[0.06] bg-white/[0.08] px-1.5 py-0.5 text-[10px] uppercase text-gray-500">
                          {item.type}
                        </span>
                      </motion.button>
                    </React.Fragment>
                  );
                });
              })()
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 border-t border-white/[0.06] px-4 py-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-white/[0.06] bg-white/[0.08] px-1.5 py-0.5">
                ↑↓
              </kbd>{' '}
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-white/[0.06] bg-white/[0.08] px-1.5 py-0.5">
                ↵
              </kbd>{' '}
              Open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-white/[0.06] bg-white/[0.08] px-1.5 py-0.5">
                Esc
              </kbd>{' '}
              Close
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

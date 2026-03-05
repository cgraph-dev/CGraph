/**
 * Command Palette — Discord-style Cmd+K quick navigation
 *
 * Features:
 * - Global Cmd/Ctrl+K keyboard shortcut
 * - Fuzzy search across conversations, channels, users, threads, settings
 * - Keyboard nav: arrow keys, enter, esc
 * - Recent items before typing
 * - Animated entry: scale from center + backdrop blur
 *
 * @module shared/components/command-palette
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MagnifyingGlassIcon,
  HashtagIcon,
  UserIcon,
  ChatBubbleLeftIcon,
  Cog6ToothIcon,
  ClockIcon,
  ArrowRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────

type ResultCategory = 'recent' | 'people' | 'channels' | 'threads' | 'settings';

interface PaletteResult {
  id: string;
  category: ResultCategory;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  avatar?: string;
  action?: () => void;
}

interface CommandPaletteProps {
  results?: PaletteResult[];
  recentItems?: PaletteResult[];
  onSearch?: (query: string) => void;
  onSelect?: (item: PaletteResult) => void;
}

// ── Category Config ────────────────────────────────────────────────────

const categoryConfig: Record<ResultCategory, { label: string; icon: React.ReactNode }> = {
  recent: { label: 'Recent', icon: <ClockIcon className="h-4 w-4" /> },
  people: { label: 'People', icon: <UserIcon className="h-4 w-4" /> },
  channels: { label: 'Channels', icon: <HashtagIcon className="h-4 w-4" /> },
  threads: { label: 'Threads', icon: <ChatBubbleLeftIcon className="h-4 w-4" /> },
  settings: { label: 'Settings', icon: <Cog6ToothIcon className="h-4 w-4" /> },
};

// ── Highlight Match ────────────────────────────────────────────────────

function highlightMatch(text: string, query: string) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-primary-400 font-semibold">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

// ── Component ──────────────────────────────────────────────────────────

export function CommandPalette({
  results = [],
  recentItems = [],
  onSearch,
  onSelect,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Global keyboard shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => onSearch?.(query), 150);
    return () => clearTimeout(t);
  }, [query, onSearch]);

  // Display items
  const displayItems = useMemo(() => {
    if (!query.trim()) return recentItems.slice(0, 5);
    return results;
  }, [query, results, recentItems]);

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<ResultCategory, PaletteResult[]>();
    for (const item of displayItems) {
      const existing = map.get(item.category) || [];
      existing.push(item);
      map.set(item.category, existing);
    }
    return map;
  }, [displayItems]);

  const flatList = useMemo(() => displayItems, [displayItems]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, flatList.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && flatList[activeIndex]) {
        e.preventDefault();
        const item = flatList[activeIndex];
        item.action?.();
        onSelect?.(item);
        setOpen(false);
      }
    },
    [flatList, activeIndex, onSelect],
  );

  // Scroll active into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Palette */}
          <motion.div
            className="relative w-full max-w-[640px] mx-4 rounded-xl bg-[#1e1f22] shadow-2xl border border-white/[0.06] overflow-hidden"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
              <MagnifyingGlassIcon className="h-5 w-5 text-white/40 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Where would you like to go?"
                className="flex-1 bg-transparent text-white text-[15px] placeholder:text-white/25 outline-none"
              />
              <kbd className="text-[10px] text-white/20 border border-white/10 rounded px-1.5 py-0.5 font-mono">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2">
              {flatList.length === 0 ? (
                <div className="px-4 py-8 text-center text-white/25 text-sm">
                  {query ? 'No results found' : 'Start typing to search...'}
                </div>
              ) : (
                Array.from(grouped.entries()).map(([category, items]) => {
                  const conf = categoryConfig[category];
                  return (
                    <div key={category} className="mb-1">
                      <div className="px-4 py-1.5 text-[11px] font-semibold text-white/30 uppercase tracking-wider flex items-center gap-1.5">
                        {conf.icon}
                        {conf.label}
                      </div>
                      {items.map((item) => {
                        const globalIdx = flatList.indexOf(item);
                        const isActive = globalIdx === activeIndex;
                        return (
                          <button
                            key={item.id}
                            data-index={globalIdx}
                            onClick={() => {
                              item.action?.();
                              onSelect?.(item);
                              setOpen(false);
                            }}
                            onMouseEnter={() => setActiveIndex(globalIdx)}
                            className={cn(
                              'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors',
                              isActive ? 'bg-primary-600/20 text-white' : 'text-white/60 hover:bg-white/[0.04]',
                            )}
                          >
                            {item.avatar ? (
                              <img
                                src={item.avatar}
                                alt=""
                                className="h-8 w-8 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                                {item.icon || conf.icon}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">
                                {highlightMatch(item.label, query)}
                              </p>
                              {item.sublabel && (
                                <p className="text-xs text-white/30 truncate">{item.sublabel}</p>
                              )}
                            </div>
                            {isActive && (
                              <ArrowRightIcon className="h-4 w-4 text-white/30 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer hints */}
            <div className="px-4 py-2 border-t border-white/[0.06] flex items-center gap-4 text-[10px] text-white/20">
              <span className="flex items-center gap-1">
                <kbd className="border border-white/10 rounded px-1 font-mono">↑↓</kbd> navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="border border-white/10 rounded px-1 font-mono">↵</kbd> open
              </span>
              <span className="flex items-center gap-1">
                <kbd className="border border-white/10 rounded px-1 font-mono">esc</kbd> close
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CommandPalette;

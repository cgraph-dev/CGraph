/**
 * CommandPalette Component
 *
 * Global command palette for quick actions and navigation.
 * Features:
 * - Keyboard shortcut (Cmd/Ctrl + K)
 * - Search through commands
 * - Recent searches
 * - Keyboard navigation
 * - Command categories
 *
 * @module components/layout/CommandPalette
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, ClockIcon } from '@heroicons/react/24/outline';
import { springPreset, glassSurfaceElevated } from '@/components/liquid-glass/shared';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { useAuthStore } from '@/modules/auth/store';
import { buildCommands, CATEGORY_LABELS, type Command } from './command-registry';

/** Pastel accent per command category */
const CATEGORY_ACCENT: Record<string, string> = {
  navigation: 'text-blue-400 dark:text-blue-300',
  actions: 'text-purple-400 dark:text-purple-300',
  user: 'text-green-400 dark:text-green-300',
  recent: 'text-amber-400 dark:text-amber-300',
};

export type { Command };

export interface CommandPaletteProps {
  /** Whether the palette is open */
  isOpen: boolean;
  /** Close callback */
  onClose: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * unknown for the layout module.
 */
/**
 * Command Palette component.
 */
export function CommandPalette({
  isOpen,
  onClose,
  className = '',
}: CommandPaletteProps): React.ReactElement {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const commands = useMemo(
    () => buildCommands(navigate, onClose, logout),
    [navigate, onClose, logout]
  );

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (cmd) => cmd.label.toLowerCase().includes(q) || cmd.description?.toLowerCase().includes(q)
    );
  }, [commands, query]);

  // Group commands by category
  const groupedCommands = useMemo(
    () =>
      filteredCommands.reduce<Record<string, Command[]>>((acc, cmd) => {
        (acc[cmd.category] ??= []).push(cmd);
        return acc;
      }, {}),
    [filteredCommands]
  );

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          HapticFeedback.medium();
          filteredCommands[selectedIndex].action();
          // Save to recent searches
          if (query && !recentSearches.includes(query)) {
            setRecentSearches((prev) => [query, ...prev.slice(0, 4)]);
          }
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [filteredCommands, selectedIndex, query, recentSearches, onClose]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[6px] dark:bg-black/60"
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -16 }}
            transition={springPreset}
            className={`fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 ${className}`}
          >
            <div
              className={`overflow-hidden rounded-2xl ${glassSurfaceElevated} shadow-[0_8px_32px_rgba(0,0,0,0.25)]`}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 border-b border-white/[0.06] p-4">
                <MagnifyingGlassIcon className="h-5 w-5 text-blue-400/80 dark:text-blue-300/80" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a command or search..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-white placeholder-white/40 focus:outline-none"
                />
                <kbd className="rounded-md border border-white/[0.06] bg-white/[0.06] px-2 py-0.5 text-[10px] text-white/50">
                  esc
                </kbd>
              </div>

              {/* Commands list */}
              <div className="max-h-96 overflow-y-auto p-2">
                {Object.entries(groupedCommands).map(([category, cmds]) => (
                  <div key={category} className="mb-2">
                    <p
                      className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${CATEGORY_ACCENT[category] ?? 'text-white/40'}`}
                    >
                      {CATEGORY_LABELS[category]}
                    </p>
                    {cmds.map((cmd) => {
                      const globalIndex = filteredCommands.indexOf(cmd);
                      const isSelected = globalIndex === selectedIndex;

                      return (
                        <motion.button
                          key={cmd.id}
                          onClick={() => {
                            HapticFeedback.light();
                            cmd.action();
                          }}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-all duration-150 ${
                            isSelected
                              ? 'bg-white/[0.08] text-white shadow-[inset_0_0.5px_0_rgba(255,255,255,0.06)]'
                              : 'text-white/70 hover:bg-white/[0.04]'
                          } `}
                        >
                          <span
                            className={
                              isSelected
                                ? (CATEGORY_ACCENT[cmd.category] ?? 'text-blue-400')
                                : 'text-white/40'
                            }
                          >
                            {cmd.icon}
                          </span>
                          <span className="flex-1">{cmd.label}</span>
                          {cmd.shortcut && (
                            <div className="flex items-center gap-1">
                              {cmd.shortcut.split(' ').map((key, i) => (
                                <kbd
                                  key={i}
                                  className="rounded border border-white/[0.06] bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-white/40"
                                >
                                  {key}
                                </kbd>
                              ))}
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                ))}

                {filteredCommands.length === 0 && (
                  <div className="py-8 text-center text-white/40">
                    No commands found for &ldquo;{query}&rdquo;
                  </div>
                )}

                {/* Recent searches */}
                {!query && recentSearches.length > 0 && (
                  <div className="mt-2 border-t border-white/[0.06] pt-2">
                    <p className="flex items-center gap-2 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-400/70 dark:text-amber-300/70">
                      <ClockIcon className="h-3 w-3" />
                      Recent
                    </p>
                    {recentSearches.map((search, i) => (
                      <button
                        key={i}
                        onClick={() => setQuery(search)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-white/50 transition-colors hover:bg-white/[0.04]"
                      >
                        <ClockIcon className="h-4 w-4" />
                        {search}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2 text-[10px] text-white/40">
                <div className="flex items-center gap-2">
                  <kbd className="rounded border border-white/[0.06] bg-white/[0.05] px-1.5 py-0.5">
                    ↑
                  </kbd>
                  <kbd className="rounded border border-white/[0.06] bg-white/[0.05] px-1.5 py-0.5">
                    ↓
                  </kbd>
                  <span>to navigate</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="rounded border border-white/[0.06] bg-white/[0.05] px-1.5 py-0.5">
                    ↵
                  </kbd>
                  <span>to select</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CommandPalette;

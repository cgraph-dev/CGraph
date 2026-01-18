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
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  HomeIcon,
  NewspaperIcon,
  SparklesIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ClockIcon,
  HashtagIcon,
  AtSymbolIcon,
} from '@heroicons/react/24/outline';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { useAuthStore } from '@/stores/authStore';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category: 'navigation' | 'actions' | 'user' | 'recent';
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  className = '',
}) => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const commands: Command[] = [
    // Navigation
    {
      id: 'home',
      label: 'Go to Home',
      icon: <HomeIcon className="h-5 w-5" />,
      shortcut: 'G H',
      action: () => { navigate('/'); onClose(); },
      category: 'navigation',
    },
    {
      id: 'messages',
      label: 'Go to Messages',
      icon: <ChatBubbleLeftRightIcon className="h-5 w-5" />,
      shortcut: 'G M',
      action: () => { navigate('/messages'); onClose(); },
      category: 'navigation',
    },
    {
      id: 'groups',
      label: 'Go to Groups',
      icon: <UserGroupIcon className="h-5 w-5" />,
      shortcut: 'G G',
      action: () => { navigate('/groups'); onClose(); },
      category: 'navigation',
    },
    {
      id: 'forums',
      label: 'Go to Forums',
      icon: <NewspaperIcon className="h-5 w-5" />,
      shortcut: 'G F',
      action: () => { navigate('/forums'); onClose(); },
      category: 'navigation',
    },
    {
      id: 'settings',
      label: 'Go to Settings',
      icon: <Cog6ToothIcon className="h-5 w-5" />,
      shortcut: 'G S',
      action: () => { navigate('/settings'); onClose(); },
      category: 'navigation',
    },
    {
      id: 'premium',
      label: 'Go to Premium',
      icon: <SparklesIcon className="h-5 w-5" />,
      action: () => { navigate('/premium'); onClose(); },
      category: 'navigation',
    },
    // Actions
    {
      id: 'new-message',
      label: 'New Message',
      icon: <ChatBubbleLeftRightIcon className="h-5 w-5" />,
      shortcut: 'N M',
      action: () => { navigate('/messages?new=true'); onClose(); },
      category: 'actions',
    },
    {
      id: 'create-group',
      label: 'Create Group',
      icon: <UserGroupIcon className="h-5 w-5" />,
      shortcut: 'N G',
      action: () => { navigate('/groups/create'); onClose(); },
      category: 'actions',
    },
    {
      id: 'search-users',
      label: 'Search Users',
      icon: <AtSymbolIcon className="h-5 w-5" />,
      action: () => { navigate('/search?type=users'); onClose(); },
      category: 'actions',
    },
    {
      id: 'search-channels',
      label: 'Search Channels',
      icon: <HashtagIcon className="h-5 w-5" />,
      action: () => { navigate('/search?type=channels'); onClose(); },
      category: 'actions',
    },
    // User
    {
      id: 'profile',
      label: 'View Profile',
      icon: <UserCircleIcon className="h-5 w-5" />,
      shortcut: 'G P',
      action: () => { navigate('/profile'); onClose(); },
      category: 'user',
    },
    {
      id: 'logout',
      label: 'Sign Out',
      icon: <ArrowRightOnRectangleIcon className="h-5 w-5" />,
      action: () => { logout(); navigate('/login'); onClose(); },
      category: 'user',
    },
  ];

  // Filter commands based on query
  const filteredCommands = query
    ? commands.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(query.toLowerCase()) ||
          cmd.description?.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  // Group commands by category
  const groupedCommands = filteredCommands.reduce(
    (acc, cmd) => {
      if (!acc[cmd.category]) {
        acc[cmd.category] = [];
      }
      acc[cmd.category]!.push(cmd);
      return acc;
    },
    {} as Record<string, Command[]>
  );

  const categoryLabels: Record<string, string> = {
    navigation: 'Navigation',
    actions: 'Actions',
    user: 'User',
    recent: 'Recent',
  };

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
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
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
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className={`fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-full max-w-lg ${className}`}
          >
            <GlassCard variant="crystal" className="overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 p-4 border-b border-white/10">
                <MagnifyingGlassIcon className="h-5 w-5 text-white/40" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a command or search..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-white placeholder-white/40 focus:outline-none"
                />
                <kbd className="px-2 py-1 bg-white/10 rounded text-xs text-white/50">
                  esc
                </kbd>
              </div>

              {/* Commands list */}
              <div className="max-h-96 overflow-y-auto p-2">
                {Object.entries(groupedCommands).map(([category, cmds]) => (
                  <div key={category} className="mb-2">
                    <p className="px-3 py-1 text-xs font-semibold text-white/40 uppercase tracking-wider">
                      {categoryLabels[category]}
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
                          className={`
                            w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left
                            transition-colors
                            ${isSelected
                              ? 'bg-primary-500/20 text-white'
                              : 'text-white/70 hover:bg-white/5'
                            }
                          `}
                        >
                          <span className={isSelected ? 'text-primary-400' : 'text-white/50'}>
                            {cmd.icon}
                          </span>
                          <span className="flex-1">{cmd.label}</span>
                          {cmd.shortcut && (
                            <div className="flex items-center gap-1">
                              {cmd.shortcut.split(' ').map((key, i) => (
                                <kbd
                                  key={i}
                                  className="px-1.5 py-0.5 bg-white/10 rounded text-xs text-white/50"
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
                    No commands found for "{query}"
                  </div>
                )}

                {/* Recent searches */}
                {!query && recentSearches.length > 0 && (
                  <div className="border-t border-white/10 pt-2 mt-2">
                    <p className="px-3 py-1 text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-2">
                      <ClockIcon className="h-3 w-3" />
                      Recent
                    </p>
                    {recentSearches.map((search, i) => (
                      <button
                        key={i}
                        onClick={() => setQuery(search)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-white/50 hover:bg-white/5"
                      >
                        <ClockIcon className="h-4 w-4" />
                        {search}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 text-xs text-white/40">
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 bg-white/10 rounded">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-white/10 rounded">↓</kbd>
                  <span>to navigate</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 bg-white/10 rounded">↵</kbd>
                  <span>to select</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;

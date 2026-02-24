/**
 * Command Registry
 *
 * Defines all available commands for the CommandPalette,
 * grouped by category (navigation, actions, user).
 *
 * @module components/layout/command-registry
 */

import React from 'react';
import {
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  HomeIcon,
  NewspaperIcon,
  SparklesIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  HashtagIcon,
  AtSymbolIcon,
} from '@heroicons/react/24/outline';

/** Command category type */
export type CommandCategory = 'navigation' | 'actions' | 'user' | 'recent';

/** A single command definition */
export interface Command {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Optional description for search filtering */
  description?: string;
  /** Icon element */
  icon: React.ReactNode;
  /** Keyboard shortcut hint (e.g. "G H") */
  shortcut?: string;
  /** Execute the command */
  action: () => void;
  /** Grouping category */
  category: CommandCategory;
}

/** Human-readable labels for each category */
export const CATEGORY_LABELS: Record<string, string> = {
  navigation: 'Navigation',
  actions: 'Actions',
  user: 'User',
  recent: 'Recent',
};

/**
 * Build the full command list.
 *
 * @param navigate - React Router navigate function
 * @param onClose  - Close the palette after executing
 * @param logout   - Auth store logout action
 */
export function buildCommands(
  navigate: (path: string) => void,
  onClose: () => void,
  logout: () => void
): Command[] {
  const go = (path: string) => () => {
    navigate(path);
    onClose();
  };

  return [
    // ── Navigation ────────────────────────────────────────────────────
    {
      id: 'home',
      label: 'Go to Home',
      icon: <HomeIcon className="h-5 w-5" />,
      shortcut: 'G H',
      action: go('/'),
      category: 'navigation',
    },
    {
      id: 'messages',
      label: 'Go to Messages',
      icon: <ChatBubbleLeftRightIcon className="h-5 w-5" />,
      shortcut: 'G M',
      action: go('/messages'),
      category: 'navigation',
    },
    {
      id: 'groups',
      label: 'Go to Groups',
      icon: <UserGroupIcon className="h-5 w-5" />,
      shortcut: 'G G',
      action: go('/groups'),
      category: 'navigation',
    },
    {
      id: 'forums',
      label: 'Go to Forums',
      icon: <NewspaperIcon className="h-5 w-5" />,
      shortcut: 'G F',
      action: go('/forums'),
      category: 'navigation',
    },
    {
      id: 'settings',
      label: 'Go to Settings',
      icon: <Cog6ToothIcon className="h-5 w-5" />,
      shortcut: 'G S',
      action: go('/settings'),
      category: 'navigation',
    },
    {
      id: 'premium',
      label: 'Go to Premium',
      icon: <SparklesIcon className="h-5 w-5" />,
      action: go('/premium'),
      category: 'navigation',
    },

    // ── Actions ───────────────────────────────────────────────────────
    {
      id: 'new-message',
      label: 'New Message',
      icon: <ChatBubbleLeftRightIcon className="h-5 w-5" />,
      shortcut: 'N M',
      action: go('/messages?new=true'),
      category: 'actions',
    },
    {
      id: 'create-group',
      label: 'Create Group',
      icon: <UserGroupIcon className="h-5 w-5" />,
      shortcut: 'N G',
      action: go('/groups/create'),
      category: 'actions',
    },
    {
      id: 'search-users',
      label: 'Search Users',
      icon: <AtSymbolIcon className="h-5 w-5" />,
      action: go('/search?type=users'),
      category: 'actions',
    },
    {
      id: 'search-channels',
      label: 'Search Channels',
      icon: <HashtagIcon className="h-5 w-5" />,
      action: go('/search?type=channels'),
      category: 'actions',
    },

    // ── User ──────────────────────────────────────────────────────────
    {
      id: 'profile',
      label: 'View Profile',
      icon: <UserCircleIcon className="h-5 w-5" />,
      shortcut: 'G P',
      action: go('/profile'),
      category: 'user',
    },
    {
      id: 'logout',
      label: 'Sign Out',
      icon: <ArrowRightOnRectangleIcon className="h-5 w-5" />,
      action: () => {
        logout();
        navigate('/login');
        onClose();
      },
      category: 'user',
    },
  ];
}

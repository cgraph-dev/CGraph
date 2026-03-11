/**
 * AdminDashboard constants
 */

import type { NavItem } from './types';

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard', shortcut: '⌘1' },
  { id: 'events', icon: '🎉', label: 'Events', shortcut: '⌘2' },
  { id: 'users', icon: '👥', label: 'Users', shortcut: '⌘3' },
  { id: 'analytics', icon: '📈', label: 'Analytics', shortcut: '⌘4' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];

export const RISK_COLORS = {
  low: 'bg-green-500/20 text-green-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  high: 'bg-orange-500/20 text-orange-400',
  critical: 'bg-red-500/20 text-red-400',
} as const;

export const STATUS_COLORS = {
  active: 'bg-green-500/20 text-green-400',
  scheduled: 'bg-blue-500/20 text-blue-400',
  draft: 'bg-gray-500/20 text-gray-400',
  ended: 'bg-red-500/20 text-red-400',
  paused: 'bg-yellow-500/20 text-yellow-400',
} as const;

export const EVENT_FILTERS = ['All', 'Active', 'Scheduled', 'Draft', 'Ended'] as const;

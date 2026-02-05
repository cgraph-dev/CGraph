/**
 * Forum Admin Constants
 *
 * Configuration data for the Forum Admin dashboard.
 *
 * @module pages/forums/ForumAdmin/constants
 */

import {
  Cog6ToothIcon,
  PaintBrushIcon,
  UserGroupIcon,
  FolderIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  TagIcon,
  DocumentTextIcon,
  FlagIcon,
} from '@heroicons/react/24/outline';
import type { TabConfig, ThemePreset, MemberRole, PostFlair } from './types';

// =============================================================================
// TAB CONFIGURATION
// =============================================================================

export const TABS: TabConfig[] = [
  { id: 'general', name: 'General', icon: Cog6ToothIcon, description: 'Basic forum settings' },
  {
    id: 'appearance',
    name: 'Appearance',
    icon: PaintBrushIcon,
    description: 'Customize look and feel',
  },
  { id: 'moderators', name: 'Moderators', icon: ShieldCheckIcon, description: 'Manage mod team' },
  { id: 'categories', name: 'Categories', icon: FolderIcon, description: 'Organize content' },
  { id: 'members', name: 'Members', icon: UserGroupIcon, description: 'Manage members' },
  { id: 'posts', name: 'Post Settings', icon: TagIcon, description: 'Flairs and prefixes' },
  { id: 'rules', name: 'Rules', icon: DocumentTextIcon, description: 'Community guidelines' },
  { id: 'analytics', name: 'Analytics', icon: ChartBarIcon, description: 'Forum insights' },
  { id: 'modqueue', name: 'Mod Queue', icon: FlagIcon, description: 'Reports and approvals' },
];

// =============================================================================
// THEME PRESETS
// =============================================================================

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'default', name: 'Default', primary: '#8B5CF6', secondary: '#6366F1', accent: '#EC4899' },
  { id: 'ocean', name: 'Ocean', primary: '#0EA5E9', secondary: '#06B6D4', accent: '#14B8A6' },
  { id: 'forest', name: 'Forest', primary: '#22C55E', secondary: '#10B981', accent: '#84CC16' },
  { id: 'sunset', name: 'Sunset', primary: '#F97316', secondary: '#EF4444', accent: '#F59E0B' },
  { id: 'midnight', name: 'Midnight', primary: '#6366F1', secondary: '#8B5CF6', accent: '#A855F7' },
  { id: 'rose', name: 'Rose', primary: '#EC4899', secondary: '#F43F5E', accent: '#FB7185' },
  {
    id: 'monochrome',
    name: 'Monochrome',
    primary: '#71717A',
    secondary: '#52525B',
    accent: '#A1A1AA',
  },
  { id: 'neon', name: 'Neon', primary: '#00FF87', secondary: '#00D9FF', accent: '#FF00E5' },
];

// =============================================================================
// MEMBER ROLES
// =============================================================================

export const MEMBER_ROLES: MemberRole[] = [
  {
    id: 'member',
    name: 'Member',
    color: 'text-gray-400',
    permissions: ['post', 'comment', 'vote'],
  },
  {
    id: 'trusted',
    name: 'Trusted',
    color: 'text-blue-400',
    permissions: ['post', 'comment', 'vote', 'report'],
  },
  {
    id: 'contributor',
    name: 'Contributor',
    color: 'text-green-400',
    permissions: ['post', 'comment', 'vote', 'report', 'flair'],
  },
  { id: 'moderator', name: 'Moderator', color: 'text-purple-400', permissions: ['all'] },
  { id: 'admin', name: 'Admin', color: 'text-yellow-400', permissions: ['all'] },
];

// =============================================================================
// DEFAULT FLAIRS
// =============================================================================

export const DEFAULT_FLAIRS: PostFlair[] = [
  { id: 'discussion', name: 'Discussion', color: '#3B82F6', emoji: '💬' },
  { id: 'question', name: 'Question', color: '#8B5CF6', emoji: '❓' },
  { id: 'help', name: 'Help', color: '#F59E0B', emoji: '🆘' },
  { id: 'solved', name: 'Solved', color: '#22C55E', emoji: '✅' },
  { id: 'announcement', name: 'Announcement', color: '#EF4444', emoji: '📢' },
  { id: 'guide', name: 'Guide', color: '#14B8A6', emoji: '📖' },
  { id: 'news', name: 'News', color: '#0EA5E9', emoji: '📰' },
  { id: 'bug', name: 'Bug', color: '#DC2626', emoji: '🐛' },
  { id: 'feature', name: 'Feature Request', color: '#A855F7', emoji: '✨' },
  { id: 'media', name: 'Media', color: '#EC4899', emoji: '🎬' },
];

// =============================================================================
// DEFAULT VALUES
// =============================================================================

export const DEFAULT_APPEARANCE = {
  iconUrl: '',
  bannerUrl: '',
  primaryColor: '#8B5CF6',
  secondaryColor: '#6366F1',
  accentColor: '#EC4899',
  themePreset: 'default',
  customCss: '',
  headerStyle: 'default' as const,
  cardStyle: 'default' as const,
};

export const DEFAULT_RULES = [
  {
    id: '1',
    title: 'Be Respectful',
    description: 'Treat others with respect. No harassment, hate speech, or personal attacks.',
    order: 1,
  },
  {
    id: '2',
    title: 'Stay On Topic',
    description: "Keep discussions relevant to the forum's purpose.",
    order: 2,
  },
  {
    id: '3',
    title: 'No Spam',
    description: "Don't post spam, self-promotion, or duplicate content.",
    order: 3,
  },
];

/**
 * ForumShowcase - Constants and Sample Data
 */

import type {
  ForumCategory,
  ThreadPrefix,
  Feature,
  TabItem,
  SampleThread,
  ModerationAction,
  QueueItem,
} from './types';

export const initialCategories: ForumCategory[] = [
  {
    id: 'announcements',
    name: 'Announcements',
    icon: 'announcement',
    collapsed: false,
    boards: [
      {
        id: 'news',
        name: 'News & Updates',
        icon: 'news',
        description: 'Latest platform updates',
        threads: 42,
        posts: 156,
        color: '#10b981',
      },
      {
        id: 'events',
        name: 'Events',
        icon: 'event',
        description: 'Community events calendar',
        threads: 18,
        posts: 89,
        color: '#06b6d4',
      },
    ],
  },
  {
    id: 'community',
    name: 'Community',
    icon: 'community',
    collapsed: false,
    boards: [
      {
        id: 'introductions',
        name: 'Introductions',
        icon: 'welcome',
        description: 'Say hello to the community',
        threads: 234,
        posts: 1205,
        color: '#8b5cf6',
      },
      {
        id: 'general',
        name: 'General Discussion',
        icon: 'chat',
        description: 'Talk about anything',
        threads: 892,
        posts: 5621,
        color: '#f97316',
      },
      {
        id: 'showcase',
        name: 'Project Showcase',
        icon: 'rocket',
        description: 'Share your creations',
        threads: 156,
        posts: 743,
        color: '#ec4899',
      },
    ],
  },
  {
    id: 'support',
    name: 'Support',
    icon: 'support',
    collapsed: false,
    boards: [
      {
        id: 'help',
        name: 'Help & Questions',
        icon: 'question',
        description: 'Get help from the community',
        threads: 567,
        posts: 2341,
        color: '#eab308',
      },
      {
        id: 'bugs',
        name: 'Bug Reports',
        icon: 'bug',
        description: 'Report issues',
        threads: 89,
        posts: 412,
        color: '#ef4444',
      },
      {
        id: 'feedback',
        name: 'Feedback',
        icon: 'idea',
        description: 'Share your ideas',
        threads: 123,
        posts: 678,
        color: '#22c55e',
      },
    ],
  },
];

export const features: Feature[] = [
  {
    icon: 'target',
    title: 'Drag & Drop',
    description: 'Reorganize boards instantly with intuitive drag and drop',
  },
  {
    icon: 'folder',
    title: 'Categories',
    description: 'Group related boards into collapsible categories',
  },
  {
    icon: 'palette',
    title: 'Custom Icons',
    description: 'Personalize each board with custom icons and colors',
  },
  {
    icon: 'stats',
    title: 'Live Stats',
    description: 'Real-time thread and post counts per board',
  },
  {
    icon: 'lock',
    title: 'Permissions',
    description: 'Fine-grained access control per board',
  },
  {
    icon: 'bolt',
    title: 'Instant Save',
    description: 'Changes sync automatically across all devices',
  },
];

export const threadPrefixes: ThreadPrefix[] = [
  { name: 'SOLVED', color: '#22c55e', bg: '#22c55e20' },
  { name: 'HELP', color: '#eab308', bg: '#eab30820' },
  { name: 'BUG', color: '#ef4444', bg: '#ef444420' },
  { name: 'FEATURE', color: '#8b5cf6', bg: '#8b5cf620' },
  { name: 'DISCUSSION', color: '#06b6d4', bg: '#06b6d420' },
  { name: 'ANNOUNCEMENT', color: '#ec4899', bg: '#ec489920' },
];

export const tabs: TabItem[] = [
  { id: 'organize', label: 'Organize Boards', icon: 'clipboard' },
  { id: 'threads', label: 'Thread Prefixes', icon: 'tag' },
  { id: 'moderation', label: 'Moderation', icon: 'shield' },
];

export const sampleThreads: SampleThread[] = [
  {
    prefix: 'SOLVED',
    title: 'How to set up end-to-end encryption?',
    replies: 24,
    views: 1203,
  },
  {
    prefix: 'HELP',
    title: 'Need help with forum permissions',
    replies: 8,
    views: 456,
  },
  {
    prefix: 'ANNOUNCEMENT',
    title: 'New drag-and-drop feature released!',
    replies: 156,
    views: 8921,
  },
  {
    prefix: 'DISCUSSION',
    title: 'Best practices for community moderation',
    replies: 67,
    views: 2341,
  },
];

export const moderationActions: ModerationAction[] = [
  {
    icon: 'pin',
    title: 'Pin Threads',
    desc: 'Highlight important discussions',
  },
  { icon: 'lock', title: 'Lock Threads', desc: 'Prevent further replies' },
  { icon: 'move', title: 'Move Threads', desc: 'Reorganize between boards' },
  {
    icon: 'split',
    title: 'Split Threads',
    desc: 'Separate off-topic discussions',
  },
  { icon: 'link', title: 'Merge Threads', desc: 'Combine duplicate topics' },
  { icon: 'warning', title: 'User Warnings', desc: 'Track rule violations' },
];

export const moderationQueue: QueueItem[] = [
  { type: 'Report', item: 'Spam post in General Discussion' },
  { type: 'Flagged', item: 'New user post awaiting approval' },
  { type: 'Appeal', item: 'User warning appeal #1234' },
];

/**
 * Documentation page data — categories, API overview, security table
 *
 * To add a new doc category or modify the documentation index,
 * edit the arrays below. Each article slug must match an entry
 * in docs/articles.ts.
 *
 * @since v0.9.26
 */

import type { DocCategory } from './types';

export const docCategories: DocCategory[] = [
  {
    id: 'getting-started',
    icon: '🚀',
    title: 'Getting Started',
    color: '#34d399',
    description:
      'Create your account, set up your first server, and understand the platform basics.',
    articles: [
      { title: 'What is CGraph?', time: '3 min read' },
      { title: 'Creating Your Account', time: '2 min read' },
      { title: 'Setting Up Your First Server', time: '5 min read' },
      { title: 'Channels: Text, Voice, Forum & Announcements', time: '6 min read' },
      { title: 'Inviting Members & Permissions', time: '4 min read' },
    ],
  },
  {
    id: 'messaging',
    icon: '💬',
    title: 'Messaging & Communication',
    color: '#60a5fa',
    description: 'Real-time messaging, voice/video calls, DMs, and group conversations.',
    articles: [
      { title: 'Real-Time Messaging & Typing Indicators', time: '5 min read' },
      { title: 'Message Editing, Deletion & Forwarding', time: '4 min read' },
      { title: 'Voice Messages & Waveform Visualization', time: '3 min read' },
      { title: 'Voice & Video Calls (WebRTC)', time: '8 min read' },
      { title: 'Screen Sharing & Group Calls', time: '5 min read' },
      { title: 'Message Scheduling & Reactions', time: '3 min read' },
    ],
  },
  {
    id: 'forums',
    icon: '📋',
    title: 'Community Forums',
    color: '#a78bfa',
    description: 'Threaded discussions with voting, karma, moderation, and rich text.',
    articles: [
      { title: 'Creating Posts & Nested Threads', time: '6 min read' },
      { title: 'Voting, Karma & Leaderboards', time: '5 min read' },
      { title: 'Rich Text Editor & BBCode Parser', time: '7 min read' },
      { title: 'Thread Prefixes, Polls & Ratings', time: '4 min read' },
      { title: 'Moderator Tools: Pin, Lock, Split, Merge', time: '8 min read' },
      { title: 'RSS/Atom Feeds & Thread Subscriptions', time: '3 min read' },
    ],
  },
  {
    id: 'security',
    icon: '🔐',
    title: 'Security & Encryption',
    color: '#f87171',
    description:
      'Triple Ratchet E2EE with PQXDH, key management, device verification, and security architecture.',
    articles: [
      { title: 'E2EE Overview: PQXDH + Triple Ratchet', time: '15 min read' },
      { title: 'Key Exchange: ML-KEM-768 + P-256 ECDH', time: '12 min read' },
      { title: 'Forward Secrecy & Key Derivation (HKDF)', time: '10 min read' },
      { title: 'Device Verification & Safety Numbers', time: '6 min read' },
      { title: 'Security Headers: CSP, HSTS, CORS', time: '8 min read' },
      { title: 'Reporting Vulnerabilities', time: '3 min read' },
    ],
  },
  {
    id: 'gamification',
    icon: '🎮',
    title: 'Gamification & Rewards',
    color: '#fbbf24',
    description: '30+ achievements, XP/levels, quests, streaks, and the virtual marketplace.',
    articles: [
      { title: 'XP, Levels & How Progression Works', time: '6 min read' },
      { title: '30+ Achievements Across 6 Categories', time: '8 min read' },
      { title: 'Daily & Weekly Quests', time: '4 min read' },
      { title: 'Streak System & Multipliers', time: '3 min read' },
      { title: 'Virtual Currency & Marketplace', time: '5 min read' },
      { title: 'Leaderboards & Seasonal Events', time: '5 min read' },
    ],
  },
  {
    id: 'api-reference',
    icon: '📡',
    title: 'REST API Reference',
    color: '#2dd4bf',
    description:
      'Complete API documentation with endpoints, authentication, rate limits, and WebSocket events.',
    articles: [
      { title: 'Authentication: JWT Bearer Tokens', time: '10 min read' },
      { title: 'Users, Servers & Channels API', time: '12 min read' },
      { title: 'Messages API (Paginated, Cursor-Based)', time: '8 min read' },
      { title: 'E2EE Key Exchange Endpoints', time: '10 min read' },
      { title: 'WebSocket API & Real-Time Events', time: '15 min read' },
      { title: 'Rate Limits & Error Codes', time: '5 min read' },
    ],
  },
  {
    id: 'architecture',
    icon: '🏗️',
    title: 'Architecture & Design',
    color: '#818cf8',
    description: 'Monorepo structure, module system, caching layers, and supervision trees.',
    articles: [
      { title: 'Monorepo: pnpm Workspaces + Turborepo', time: '8 min read' },
      { title: 'Dual-App Architecture (Landing vs Web App)', time: '10 min read' },
      { title: '12 Feature Modules & 7 Facade Hooks', time: '12 min read' },
      { title: 'Backend Sub-module Architecture & Defdelegate Pattern', time: '10 min read' },
      { title: '3-Tier Caching: ETS → Cachex → Redis', time: '10 min read' },
      { title: 'Phoenix Supervision Tree', time: '8 min read' },
      { title: 'Socket Architecture & Channel Modules', time: '10 min read' },
    ],
  },
  {
    id: 'mobile',
    icon: '📱',
    title: 'Mobile Development',
    color: '#f472b6',
    description:
      'React Native with Expo SDK 54, offline support, push notifications, and biometrics.',
    articles: [
      { title: 'React Native 0.81 & Expo SDK 54', time: '6 min read' },
      { title: 'Offline Support & Message Queuing', time: '8 min read' },
      { title: 'Reanimated v4 & Gesture Handler', time: '7 min read' },
      { title: 'Push Notifications & Biometric Auth', time: '5 min read' },
      { title: 'Customization Screens (6 Screens)', time: '4 min read' },
    ],
  },
];

export const apiOverview = [
  { label: 'Base URL', value: 'api.cgraph.org/api/v1' },
  { label: 'Auth', value: 'JWT Bearer (15min access + refresh rotation)' },
  { label: 'Pagination', value: 'Cursor-based (never offset)' },
  { label: 'WebSocket', value: 'wss://api.cgraph.org/socket' },
  { label: 'Rate Limit', value: '300 req/min general, 60 msg/min, 5 auth/15min' },
  { label: 'Upload Limit', value: '25MB free, 100MB premium' },
];

export const securityTable = [
  {
    component: 'Key Exchange',
    algorithm: 'PQXDH (P-256 + ML-KEM-768)',
    level: '256-bit (post-quantum)',
  },
  { component: 'Encryption', algorithm: 'AES-256-GCM + Triple Ratchet', level: '256-bit' },
  { component: 'Signatures', algorithm: 'Ed25519', level: '128-bit' },
  { component: 'Passwords', algorithm: 'Argon2id', level: 'Memory-hard' },
  { component: 'Transport', algorithm: 'TLS 1.3', level: 'Enforced' },
  { component: 'Key Derivation', algorithm: 'HKDF-SHA256', level: 'Per-conversation' },
];

export const apiEndpointGroups = [
  {
    group: 'Authentication',
    icon: '🔑',
    endpoints: [
      { method: 'POST', path: '/auth/register' },
      { method: 'POST', path: '/auth/login' },
      { method: 'POST', path: '/auth/refresh' },
      { method: 'POST', path: '/auth/logout' },
    ],
  },
  {
    group: 'Messaging',
    icon: '💬',
    endpoints: [
      { method: 'GET', path: '/channels/:id/messages' },
      { method: 'POST', path: '/channels/:id/messages' },
      { method: 'GET', path: '/dms' },
      { method: 'POST', path: '/dms/:id/messages' },
    ],
  },
  {
    group: 'Servers',
    icon: '🏠',
    endpoints: [
      { method: 'GET', path: '/servers' },
      { method: 'POST', path: '/servers' },
      { method: 'GET', path: '/servers/:id/channels' },
      { method: 'POST', path: '/servers/:id/webhooks' },
    ],
  },
  {
    group: 'Users & Profiles',
    icon: '👤',
    endpoints: [
      { method: 'GET', path: '/users/me' },
      { method: 'PATCH', path: '/users/me' },
      { method: 'GET', path: '/users/:id/profile' },
      { method: 'GET', path: '/users/me/servers' },
    ],
  },
  {
    group: 'E2EE Keys',
    icon: '🔐',
    endpoints: [
      { method: 'POST', path: '/e2ee/keys/upload' },
      { method: 'GET', path: '/e2ee/keys/:user_id' },
      { method: 'POST', path: '/e2ee/sessions' },
    ],
  },
  {
    group: 'WebSocket Events',
    icon: '⚡',
    endpoints: [
      { method: 'WS', path: 'message:new' },
      { method: 'WS', path: 'typing:start' },
      { method: 'WS', path: 'presence:update' },
      { method: 'WS', path: 'channel:join' },
    ],
  },
];

export const methodColors: Record<string, { bg: string; text: string }> = {
  GET: { bg: 'rgba(52, 211, 153, 0.12)', text: '#34d399' },
  POST: { bg: 'rgba(96, 165, 250, 0.12)', text: '#60a5fa' },
  PATCH: { bg: 'rgba(251, 191, 36, 0.12)', text: '#fbbf24' },
  DELETE: { bg: 'rgba(248, 113, 113, 0.12)', text: '#f87171' },
  WS: { bg: 'rgba(167, 139, 250, 0.12)', text: '#a78bfa' },
};

export const defaultMethodColor = methodColors.GET ?? {
  bg: 'rgba(52, 211, 153, 0.12)',
  text: '#34d399',
};

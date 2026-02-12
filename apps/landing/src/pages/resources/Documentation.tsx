/**
 * Documentation Page - Comprehensive developer documentation hub
 *
 * All content sourced from actual project documentation, architecture docs,
 * API references, and security documentation.
 *
 * @since v0.9.2
 * @updated v0.9.14 - Professional rewrite with real technical data
 * @updated v0.9.15 - Enhanced visual design, API endpoint badges, quick nav
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MarketingLayout } from '@/components/marketing';

const docCategories = [
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
    description: 'Reddit-style threaded discussions with voting, karma, moderation, and rich text.',
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
      'Signal Protocol E2EE, key management, device verification, and security architecture.',
    articles: [
      { title: 'E2EE Overview: X3DH + Double Ratchet', time: '15 min read' },
      { title: 'Key Exchange: X25519 & AES-256-GCM', time: '12 min read' },
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

const apiOverview = [
  { label: 'Base URL', value: 'api.cgraph.org/api/v1' },
  { label: 'Auth', value: 'JWT Bearer (15min access + refresh rotation)' },
  { label: 'Pagination', value: 'Cursor-based (never offset)' },
  { label: 'WebSocket', value: 'wss://api.cgraph.org/socket' },
  { label: 'Rate Limit', value: '300 req/min general, 60 msg/min, 5 auth/15min' },
  { label: 'Upload Limit', value: '25MB free, 100MB premium' },
];

const securityTable = [
  { component: 'Key Exchange', algorithm: 'X25519 (X3DH)', level: '128-bit' },
  { component: 'Encryption', algorithm: 'AES-256-GCM + Double Ratchet', level: '256-bit' },
  { component: 'Signatures', algorithm: 'Ed25519', level: '128-bit' },
  { component: 'Passwords', algorithm: 'Argon2id', level: 'Memory-hard' },
  { component: 'Transport', algorithm: 'TLS 1.3', level: 'Enforced' },
  { component: 'Key Derivation', algorithm: 'HKDF-SHA256', level: 'Per-conversation' },
];

const apiEndpointGroups = [
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

const methodColors: Record<string, { bg: string; text: string }> = {
  GET: { bg: 'rgba(52, 211, 153, 0.12)', text: '#34d399' },
  POST: { bg: 'rgba(96, 165, 250, 0.12)', text: '#60a5fa' },
  PATCH: { bg: 'rgba(251, 191, 36, 0.12)', text: '#fbbf24' },
  DELETE: { bg: 'rgba(248, 113, 113, 0.12)', text: '#f87171' },
  WS: { bg: 'rgba(167, 139, 250, 0.12)', text: '#a78bfa' },
};

const defaultMethodColor = methodColors.GET!;

export default function Documentation() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const filteredCategories = docCategories.filter(
    (cat) =>
      cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.articles.some((a) => a.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalArticles = docCategories.reduce((sum, cat) => sum + cat.articles.length, 0);

  // Generate slug from title matching DocArticle.tsx keys
  const generateSlug = (title: string): string =>
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

  return (
    <MarketingLayout
      title="Documentation"
      subtitle="Architecture guides, API references, security documentation, and developer resources — all sourced from our internal engineering docs."
      eyebrow="Developer Docs"
      showCTA
    >
      {/* Quick Nav */}
      <section
        className="marketing-section marketing-section--dark"
        style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}
      >
        <div className="mx-auto max-w-5xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-2"
          >
            {docCategories.map((cat) => (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-xs font-medium text-gray-300 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                <span>{cat.icon}</span>
                <span className="hidden sm:inline">{cat.title.split(' ')[0]}</span>
                <span className="sm:hidden">{cat.icon}</span>
              </a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Search */}
      <section
        className="marketing-section marketing-section--alt"
        style={{ paddingTop: '2rem', paddingBottom: '2rem' }}
      >
        <div className="mx-auto max-w-xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            <div className="absolute inset-y-0 left-4 flex items-center">
              <svg
                className="h-5 w-5"
                style={{ color: 'var(--color-gray)' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="contact-form__input w-full pl-12"
            />
            {searchQuery && (
              <div className="absolute inset-y-0 right-4 flex items-center">
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-gray-500 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-3 text-center text-xs"
            style={{ color: 'var(--color-gray)' }}
          >
            {filteredCategories.length} categories · {totalArticles} articles · Covers every aspect
            of the platform
          </motion.p>
        </div>
      </section>

      {/* Status Notice */}
      <section
        className="marketing-section marketing-section--dark"
        style={{ paddingTop: '0.5rem', paddingBottom: '1.5rem' }}
      >
        <div className="mx-auto max-w-3xl px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-5 py-3"
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
              style={{ background: 'rgba(16, 185, 129, 0.15)' }}
            >
              📝
            </div>
            <p className="text-sm" style={{ color: 'var(--color-gray)' }}>
              These docs reflect our internal engineering documentation. Full public developer docs
              will ship with v1.0 at{' '}
              <span className="font-semibold text-white">docs.cgraph.org</span>.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Documentation Categories */}
      <section className="marketing-section marketing-section--alt">
        <div className="marketing-section__container">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title font-zentry">Documentation Index</h2>
              <p className="marketing-section__desc">
                Comprehensive guides organized by topic — from getting started to advanced
                architecture.
              </p>
            </motion.div>
          </div>

          <div className="marketing-grid marketing-grid--2">
            {filteredCategories.map((category, index) => (
              <motion.div
                key={category.id}
                id={category.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                viewport={{ once: true }}
                className="marketing-card relative overflow-hidden"
                style={{ padding: 0 }}
              >
                {/* Top color accent */}
                <div
                  className="h-1 w-full"
                  style={{
                    background: `linear-gradient(90deg, ${category.color}, transparent)`,
                  }}
                />

                <div className="p-6">
                  <div className="mb-4 flex items-center gap-4">
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-2xl"
                      style={{
                        background: `${category.color}15`,
                        border: `1px solid ${category.color}25`,
                      }}
                    >
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{category.title}</h3>
                      <p className="text-sm" style={{ color: 'var(--color-gray)' }}>
                        {category.articles.length} articles
                      </p>
                    </div>
                  </div>
                  <p
                    className="mb-6 text-sm leading-relaxed"
                    style={{ color: 'var(--color-gray)' }}
                  >
                    {category.description}
                  </p>
                  <div className="space-y-2">
                    {category.articles
                      .slice(0, expandedCategory === category.id ? undefined : 3)
                      .map((article, i) => (
                        <Link
                          key={article.title}
                          to={`/docs/${generateSlug(article.title)}`}
                          className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2.5 no-underline transition-colors hover:bg-white/10"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold"
                              style={{
                                background: `${category.color}15`,
                                color: category.color,
                              }}
                            >
                              {i + 1}
                            </span>
                            <span className="text-sm text-white">{article.title}</span>
                          </div>
                          <span className="shrink-0 text-xs" style={{ color: 'var(--color-gray)' }}>
                            {article.time}
                          </span>
                        </Link>
                      ))}
                  </div>
                  {category.articles.length > 3 && (
                    <button
                      onClick={() =>
                        setExpandedCategory(expandedCategory === category.id ? null : category.id)
                      }
                      className="mt-4 flex items-center gap-1 text-sm font-medium transition-colors hover:text-emerald-300"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {expandedCategory === category.id
                        ? '← Show less'
                        : `View all ${category.articles.length} articles →`}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* API Overview */}
      <section className="marketing-section marketing-section--dark">
        <div className="marketing-section__container">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title font-zentry">API at a Glance</h2>
              <p className="marketing-section__desc">
                RESTful API with WebSocket real-time events. Full OpenAPI spec coming with v1.0.
              </p>
            </motion.div>
          </div>

          <div className="mx-auto max-w-4xl">
            {/* API Overview Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="marketing-card overflow-hidden"
              style={{ padding: 0 }}
            >
              <div
                className="flex items-center gap-3 px-5 py-3"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(139, 92, 246, 0.12))',
                }}
              >
                <span className="font-mono text-sm font-bold text-white">
                  https://api.cgraph.org/api/v1
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}
                >
                  REST + WebSocket
                </span>
              </div>
              <div className="divide-y divide-white/5">
                {apiOverview.map((item) => (
                  <div key={item.label} className="flex items-start gap-4 px-5 py-3">
                    <span
                      className="w-28 shrink-0 text-sm font-semibold"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {item.label}
                    </span>
                    <span className="text-sm text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Endpoint Groups with Method Badges */}
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {apiEndpointGroups.map((group, index) => (
                <motion.div
                  key={group.group}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="marketing-card"
                  style={{ padding: '1.25rem' }}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-lg">{group.icon}</span>
                    <h4 className="text-sm font-bold text-white">{group.group}</h4>
                  </div>
                  <div className="space-y-1.5">
                    {group.endpoints.map((ep) => {
                      const mc = methodColors[ep.method] ?? defaultMethodColor;
                      return (
                        <div
                          key={`${ep.method}-${ep.path}`}
                          className="flex items-center gap-2 rounded-md bg-white/5 px-2.5 py-1.5"
                        >
                          <span
                            className="inline-flex w-12 shrink-0 items-center justify-center rounded px-1.5 py-0.5 font-mono text-[10px] font-bold"
                            style={{ background: mc.bg, color: mc.text }}
                          >
                            {ep.method}
                          </span>
                          <span className="font-mono text-xs text-white">{ep.path}</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security Reference */}
      <section className="marketing-section marketing-section--alt">
        <div className="marketing-section__container">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title font-zentry">Cryptographic Reference</h2>
              <p className="marketing-section__desc">
                Every algorithm, every security level — no black boxes.
              </p>
            </motion.div>
          </div>

          <div className="mx-auto max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="marketing-card overflow-hidden"
              style={{ padding: 0 }}
            >
              {/* Header */}
              <div
                className="grid grid-cols-3 gap-4 px-5 py-3 text-xs font-bold uppercase tracking-wider"
                style={{
                  color: 'var(--color-primary)',
                  background:
                    'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(248, 113, 113, 0.05))',
                }}
              >
                <span>Component</span>
                <span>Algorithm</span>
                <span>Security</span>
              </div>
              {/* Rows */}
              <div className="divide-y divide-white/5">
                {securityTable.map((row) => (
                  <div
                    key={row.component}
                    className="grid grid-cols-3 gap-4 px-5 py-3 text-sm transition-colors hover:bg-white/5"
                  >
                    <span className="font-medium text-white">{row.component}</span>
                    <span className="font-mono text-xs" style={{ color: 'var(--color-gray)' }}>
                      {row.algorithm}
                    </span>
                    <span>
                      <span
                        className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: 'var(--color-primary)',
                        }}
                      >
                        {row.level}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Security badges */}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {[
                { label: '28 E2EE Tests', icon: '✓' },
                { label: 'Gitleaks Scanning', icon: '🔍' },
                { label: 'Sobelow SAST', icon: '🛡️' },
                { label: 'Grype CVE Scanning', icon: '📋' },
              ].map((badge) => (
                <motion.div
                  key={badge.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs"
                >
                  <span>{badge.icon}</span>
                  <span className="text-gray-300">{badge.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Decision Records */}
      <section className="marketing-section marketing-section--dark">
        <div className="marketing-section__container">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title font-zentry">Architecture Decisions</h2>
              <p className="marketing-section__desc">
                Key ADRs documenting why we made critical technical choices.
              </p>
            </motion.div>
          </div>

          <div className="marketing-grid marketing-grid--3">
            {[
              {
                id: 'ADR-001',
                title: 'Monorepo Structure',
                detail: 'pnpm workspaces + Turborepo for 4 apps and 12 shared packages.',
                status: 'Accepted',
              },
              {
                id: 'ADR-002',
                title: 'Dual-App Architecture',
                detail: 'Separate landing (~200KB) from web app (~2MB) for optimal loading.',
                status: 'Accepted',
              },
              {
                id: 'ADR-003',
                title: 'Zustand State Mgmt',
                detail:
                  '7 facade stores consolidating 32 original stores. Discord-style composition.',
                status: 'Accepted',
              },
              {
                id: 'ADR-004',
                title: 'Signal Protocol E2EE',
                detail: 'X3DH + Double Ratchet chosen for proven security with forward secrecy.',
                status: 'Accepted',
              },
              {
                id: 'ADR-005',
                title: 'Phoenix Channels',
                detail: 'WebSocket-based real-time via Elixir for millions of concurrent users.',
                status: 'Accepted',
              },
              {
                id: 'ADR-018',
                title: 'Reanimated v4 Migration',
                detail:
                  'Resolved 222 TypeScript errors, adopted shared-value-first animation model.',
                status: 'Completed',
              },
            ].map((adr, index) => (
              <motion.div
                key={adr.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="marketing-card relative overflow-hidden"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className="font-mono text-xs font-bold"
                    style={{ color: 'var(--color-secondary)' }}
                  >
                    {adr.id}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      background:
                        adr.status === 'Completed'
                          ? 'rgba(16, 185, 129, 0.12)'
                          : 'rgba(99, 102, 241, 0.12)',
                      color: adr.status === 'Completed' ? '#34d399' : '#818cf8',
                    }}
                  >
                    {adr.status}
                  </span>
                </div>
                <h3 className="mb-2 text-base font-bold text-white">{adr.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-gray)' }}>
                  {adr.detail}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="marketing-section marketing-section--alt">
        <div className="marketing-section__container">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title font-zentry">Tech Stack</h2>
              <p className="marketing-section__desc">The technologies powering CGraph.</p>
            </motion.div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                name: 'Elixir / Phoenix',
                icon: '💜',
                desc: 'Backend API, WebSockets, PubSub',
                version: '1.17+ / 1.8',
              },
              {
                name: 'PostgreSQL 16',
                icon: '🐘',
                desc: '91 tables, ULID IDs, full-text search',
                version: 'v16',
              },
              {
                name: 'React 19 / Vite 6',
                icon: '⚛️',
                desc: 'Web app with 62 lazy-loaded pages',
                version: 'v19 / v6.3',
              },
              {
                name: 'React Native / Expo',
                icon: '📱',
                desc: 'iOS & Android with offline support',
                version: '0.81 / SDK 54',
              },
              {
                name: 'Signal Protocol',
                icon: '🔐',
                desc: 'X3DH, Double Ratchet, AES-256-GCM',
                version: 'Custom impl',
              },
              {
                name: 'Fly.io / Vercel',
                icon: '☁️',
                desc: 'Frankfurt region + edge deployment',
                version: 'Production',
              },
              {
                name: 'Redis 7',
                icon: '⚡',
                desc: '3-tier cache, PubSub, rate limiting',
                version: 'v7',
              },
              {
                name: 'Cloudflare',
                icon: '🛡️',
                desc: 'CDN, WAF, DDoS protection, TLS 1.3',
                version: 'Enterprise',
              },
            ].map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                viewport={{ once: true }}
                className="marketing-card text-center"
                style={{ padding: '1.5rem 1rem' }}
              >
                <div className="mb-3 text-3xl">{tech.icon}</div>
                <h3 className="mb-1 text-sm font-bold text-white">{tech.name}</h3>
                <p className="mb-2 text-xs" style={{ color: 'var(--color-gray)' }}>
                  {tech.desc}
                </p>
                <span
                  className="inline-block rounded-full px-2 py-0.5 font-mono text-[10px]"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-gray)' }}
                >
                  {tech.version}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Need Help CTA */}
      <section className="marketing-section marketing-section--dark">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl border border-white/10 text-center"
            style={{
              padding: '3rem',
              background:
                'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(139, 92, 246, 0.08))',
            }}
          >
            <div
              className="absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-10"
              style={{ background: 'var(--color-secondary)' }}
            />
            <div className="relative">
              <h2 className="mb-4 font-zentry text-3xl font-bold text-white">
                Questions or Feedback?
              </h2>
              <p className="mx-auto mb-8 max-w-xl" style={{ color: 'var(--color-gray)' }}>
                Found an issue? Want to contribute? Reach out on GitHub or contact us directly.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href="https://github.com/cgraph-dev/CGraph"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="marketing-btn marketing-btn--primary"
                >
                  GitHub Repository
                </a>
                <Link to="/contact" className="marketing-btn marketing-btn--secondary">
                  Contact Us
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
}

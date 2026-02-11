/**
 * Documentation Page - Comprehensive developer documentation hub
 *
 * All content sourced from actual project documentation, architecture docs,
 * API references, and security documentation.
 *
 * @since v0.9.2
 * @updated v0.9.14 - Professional rewrite with real technical data
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MarketingLayout } from '@/components/marketing';

const docCategories = [
  {
    id: 'getting-started',
    icon: '🚀',
    title: 'Getting Started',
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
    description: 'Monorepo structure, module system, caching layers, and supervision trees.',
    articles: [
      { title: 'Monorepo: pnpm Workspaces + Turborepo', time: '8 min read' },
      { title: 'Dual-App Architecture (Landing vs Web App)', time: '10 min read' },
      { title: '12 Feature Modules & 7 Facade Hooks', time: '12 min read' },
      { title: '3-Tier Caching: ETS \u2192 Cachex \u2192 Redis', time: '10 min read' },
      { title: 'Phoenix Supervision Tree', time: '8 min read' },
      { title: 'Socket Architecture & Channel Modules', time: '10 min read' },
    ],
  },
  {
    id: 'mobile',
    icon: '📱',
    title: 'Mobile Development',
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

export default function Documentation() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const filteredCategories = docCategories.filter(
    (cat) =>
      cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.articles.some((a) => a.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <MarketingLayout
      title="Documentation"
      subtitle="Architecture guides, API references, security documentation, and developer resources \u2014 all sourced from our internal engineering docs."
      eyebrow="Developer Docs"
      showCTA
    >
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
          </motion.div>
        </div>
      </section>

      {/* Status Notice */}
      <section
        className="marketing-section marketing-section--dark"
        style={{ paddingTop: '1rem', paddingBottom: '1rem' }}
      >
        <div className="mx-auto max-w-3xl px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-center text-sm"
            style={{ color: 'var(--color-primary)' }}
          >
            These docs reflect our internal engineering documentation. Full public developer docs
            will ship with v1.0 at <span className="font-semibold text-white">docs.cgraph.org</span>
            .
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
                8 categories \u00b7 45+ articles \u00b7 covering every aspect of the platform
              </p>
            </motion.div>
          </div>

          <div className="marketing-grid marketing-grid--2">
            {filteredCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                viewport={{ once: true }}
                className="marketing-card"
                style={{ padding: '2rem' }}
              >
                <div className="mb-4 flex items-center gap-4">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-2xl"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(139, 92, 246, 0.2))',
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
                <p className="mb-6 text-sm" style={{ color: 'var(--color-gray)' }}>
                  {category.description}
                </p>
                <div className="space-y-2">
                  {category.articles
                    .slice(0, expandedCategory === category.id ? undefined : 3)
                    .map((article) => (
                      <div
                        key={article.title}
                        className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2.5"
                      >
                        <span className="text-sm text-white">{article.title}</span>
                        <span className="shrink-0 text-xs" style={{ color: 'var(--color-gray)' }}>
                          {article.time}
                        </span>
                      </div>
                    ))}
                </div>
                {category.articles.length > 3 && (
                  <button
                    onClick={() =>
                      setExpandedCategory(expandedCategory === category.id ? null : category.id)
                    }
                    className="mt-4 text-sm font-medium transition-colors hover:text-emerald-300"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {expandedCategory === category.id
                      ? 'Show less'
                      : `View all ${category.articles.length} articles \u2192`}
                  </button>
                )}
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
                RESTful API with WebSocket real-time events. SDKs coming soon.
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
              <div
                className="px-5 py-3 text-sm font-semibold text-white"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(139, 92, 246, 0.15))',
                }}
              >
                https://api.cgraph.org/api/v1
              </div>
              <div className="divide-y divide-white/5">
                {apiOverview.map((item) => (
                  <div key={item.label} className="flex items-start gap-4 px-5 py-3">
                    <span
                      className="w-28 shrink-0 text-sm font-medium"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {item.label}
                    </span>
                    <span className="text-sm text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Endpoint Groups */}
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                {
                  group: 'Auth',
                  endpoints: ['/auth/login', '/auth/register', '/auth/refresh'],
                },
                {
                  group: 'Messaging',
                  endpoints: ['/channels/:id/messages', '/dms', '/dms/:id/messages'],
                },
                {
                  group: 'Servers',
                  endpoints: ['/servers', '/servers/:id/channels', '/servers/:id/webhooks'],
                },
              ].map((group, index) => (
                <motion.div
                  key={group.group}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="marketing-card"
                >
                  <h4 className="mb-3 text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                    {group.group}
                  </h4>
                  <div className="space-y-1.5">
                    {group.endpoints.map((ep) => (
                      <div
                        key={ep}
                        className="rounded bg-white/5 px-2.5 py-1.5 font-mono text-xs text-white"
                      >
                        {ep}
                      </div>
                    ))}
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
                Every algorithm, every security level \u2014 no black boxes.
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
                className="grid grid-cols-3 gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                style={{
                  color: 'var(--color-primary)',
                  background: 'rgba(16, 185, 129, 0.05)',
                }}
              >
                <span>Component</span>
                <span>Algorithm</span>
                <span>Security</span>
              </div>
              {/* Rows */}
              <div className="divide-y divide-white/5">
                {securityTable.map((row) => (
                  <div key={row.component} className="grid grid-cols-3 gap-4 px-5 py-3 text-sm">
                    <span className="font-medium text-white">{row.component}</span>
                    <span style={{ color: 'var(--color-gray)' }}>{row.algorithm}</span>
                    <span>
                      <span
                        className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
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
              },
              {
                id: 'ADR-002',
                title: 'Dual-App Architecture',
                detail: 'Separate landing (~200KB) from web app (~2MB) for optimal loading.',
              },
              {
                id: 'ADR-003',
                title: 'Zustand State Mgmt',
                detail:
                  '7 facade stores consolidating 32 original stores. Discord-style composition.',
              },
              {
                id: 'ADR-004',
                title: 'Signal Protocol E2EE',
                detail: 'X3DH + Double Ratchet chosen for proven security with forward secrecy.',
              },
              {
                id: 'ADR-005',
                title: 'Phoenix Channels',
                detail: 'WebSocket-based real-time via Elixir for millions of concurrent users.',
              },
              {
                id: 'ADR-018',
                title: 'Reanimated v4 Migration',
                detail:
                  'Resolved 222 TypeScript errors, adopted shared-value-first animation model.',
              },
            ].map((adr, index) => (
              <motion.div
                key={adr.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="marketing-card"
              >
                <span
                  className="mb-2 inline-block font-mono text-xs font-bold"
                  style={{ color: 'var(--color-secondary)' }}
                >
                  {adr.id}
                </span>
                <h3 className="mb-2 text-base font-bold text-white">{adr.title}</h3>
                <p className="text-sm" style={{ color: 'var(--color-gray)' }}>
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

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: 'Elixir / Phoenix', icon: '💜', desc: 'Backend API, WebSockets, PubSub' },
              { name: 'PostgreSQL 16', icon: '🐘', desc: '91 tables, ULID IDs, full-text search' },
              {
                name: 'React 19 / Vite 6',
                icon: '\u269b\ufe0f',
                desc: 'Web app with 62 lazy-loaded pages',
              },
              {
                name: 'React Native / Expo',
                icon: '📱',
                desc: 'iOS & Android with offline support',
              },
              { name: 'Signal Protocol', icon: '🔐', desc: 'X3DH, Double Ratchet, AES-256-GCM' },
              {
                name: 'Fly.io / Vercel',
                icon: '\u2601\ufe0f',
                desc: 'Frankfurt region + edge deployment',
              },
              { name: 'Redis 7', icon: '\u26a1', desc: '3-tier cache, PubSub, rate limiting' },
              { name: 'Cloudflare', icon: '🛡\ufe0f', desc: 'CDN, WAF, DDoS protection, TLS 1.3' },
            ].map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                viewport={{ once: true }}
                className="marketing-card text-center"
              >
                <div className="mb-3 text-3xl">{tech.icon}</div>
                <h3 className="mb-1 text-sm font-semibold text-white">{tech.name}</h3>
                <p className="text-xs" style={{ color: 'var(--color-gray)' }}>
                  {tech.desc}
                </p>
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
            className="marketing-card text-center"
            style={{
              padding: '3rem',
              background:
                'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(139, 92, 246, 0.1))',
            }}
          >
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
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
}

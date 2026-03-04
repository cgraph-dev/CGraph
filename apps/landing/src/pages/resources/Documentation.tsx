/**
 * Documentation Page - Comprehensive developer documentation hub
 *
 * All content sourced from actual project documentation, architecture docs,
 * API references, and security documentation.
 *
 * @since v0.9.2
 * @updated v0.9.14 - Professional rewrite with real technical data
 * @updated v0.9.15 - Enhanced visual design, API endpoint badges, quick nav
 * @updated v0.9.30 - Migrated to Liquid Glass design system
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LiquidGlassLayout } from '@/components/liquid-glass';
import { docCategories, apiOverview, securityTable, apiEndpointGroups } from '@/data/docs';

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
    <LiquidGlassLayout
      title="Documentation"
      subtitle="Comprehensive guides and API reference"
      maxWidth="max-w-6xl"
    >
      {/* Quick Nav */}
      <section className="pb-4 pt-2">
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
                className="flex items-center gap-1.5 rounded-lg border border-slate-200/60 bg-white/50 px-3 py-2 text-xs font-medium text-slate-600 backdrop-blur-sm transition-all hover:border-purple-300/60 hover:bg-white/80 hover:text-purple-700"
              >
                <span className="text-sm">{cat.icon}</span>
                <span>{cat.title.split(' ')[0]}</span>
              </a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Search */}
      <section className="py-6">
        <div className="mx-auto max-w-xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            <div className="absolute inset-y-0 left-4 flex items-center">
              <svg
                className="h-5 w-5 text-slate-400"
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
              aria-label="Search documentation"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200/60 bg-white/60 px-4 py-3 pl-12 text-slate-800 outline-none backdrop-blur-sm transition-all placeholder:text-slate-400 focus:border-purple-300/70 focus:shadow-[0_0_0_3px_rgba(196,181,253,0.3)]"
            />
            {searchQuery && (
              <div className="absolute inset-y-0 right-4 flex items-center">
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-slate-700"
                >
                  Clear
                </button>
              </div>
            )}
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-3 text-center text-xs text-slate-500"
          >
            {filteredCategories.length} categories · {totalArticles} articles · Covers every aspect
            of the platform
          </motion.p>
        </div>
      </section>

      {/* Status Notice */}
      <section className="pb-6">
        <div className="mx-auto max-w-3xl px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 rounded-xl border border-purple-200/40 bg-purple-50/40 px-5 py-3 backdrop-blur-sm"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100/60">
              <span className="text-base">📝</span>
            </div>
            <p className="text-sm text-slate-600">
              These docs reflect our internal engineering documentation. Full public developer docs
              will ship with v1.0 at{' '}
              <span className="font-semibold text-slate-900">docs.cgraph.org</span>.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Documentation Categories */}
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-slate-900">Documentation Index</h2>
              <p className="mt-3 text-slate-500">
                Guides organized by topic — from getting started to architecture deep-dives.
              </p>
            </motion.div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {filteredCategories.map((category, index) => (
              <motion.div
                key={category.id}
                id={category.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                viewport={{ once: true }}
                className="glass-surface overflow-hidden rounded-2xl p-6 shadow-glass transition-shadow hover:shadow-glass-lg"
              >
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-purple-200/30 bg-purple-50/60">
                    <span className="text-2xl">{category.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{category.title}</h3>
                    <p className="text-sm text-slate-500">{category.articles.length} articles</p>
                  </div>
                </div>
                <p className="mb-6 text-sm leading-relaxed text-slate-500">
                  {category.description}
                </p>
                <div className="space-y-2">
                  {category.articles
                    .slice(0, expandedCategory === category.id ? undefined : 3)
                    .map((article, i) => (
                      <Link
                        key={article.title}
                        to={`/docs/${generateSlug(article.title)}`}
                        className="flex items-center justify-between rounded-lg border border-slate-200/50 bg-white/40 px-3 py-2.5 no-underline transition-colors hover:bg-white/70"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-5 w-5 items-center justify-center rounded bg-purple-50 text-[10px] font-bold text-purple-600">
                            {i + 1}
                          </span>
                          <span className="text-sm text-slate-800">{article.title}</span>
                        </div>
                        <span className="shrink-0 text-xs text-slate-400">{article.time}</span>
                      </Link>
                    ))}
                </div>
                {category.articles.length > 3 && (
                  <button
                    onClick={() =>
                      setExpandedCategory(expandedCategory === category.id ? null : category.id)
                    }
                    className="mt-4 flex items-center gap-1 text-sm font-medium text-glow-purple transition-colors hover:text-purple-700"
                  >
                    {expandedCategory === category.id
                      ? '← Show less'
                      : `View all ${category.articles.length} articles →`}
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* API Overview */}
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-slate-900">API at a Glance</h2>
              <p className="mt-3 text-slate-500">
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
              className="glass-surface overflow-hidden rounded-xl shadow-glass"
            >
              <div className="flex items-center gap-3 border-b border-slate-200/50 bg-slate-50/80 px-5 py-3">
                <span className="font-mono text-sm font-bold text-slate-900">
                  https://cgraph-backend.fly.dev/api/v1
                </span>
                <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                  REST + WebSocket
                </span>
              </div>
              <div className="divide-y divide-slate-200/50">
                {apiOverview.map((item) => (
                  <div key={item.label} className="flex items-start gap-4 px-5 py-3">
                    <span className="w-28 shrink-0 text-sm font-semibold text-glow-purple">
                      {item.label}
                    </span>
                    <span className="text-sm text-slate-800">{item.value}</span>
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
                  className="glass-surface rounded-xl p-5 shadow-glass"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-lg">{group.icon}</span>
                    <h4 className="text-sm font-bold text-slate-900">{group.group}</h4>
                  </div>
                  <div className="space-y-1.5">
                    {group.endpoints.map((ep) => {
                      const badgeClass =
                        ep.method === 'GET'
                          ? 'bg-emerald-50 text-emerald-700'
                          : ep.method === 'POST'
                            ? 'bg-blue-50 text-blue-700'
                            : ep.method === 'PUT'
                              ? 'bg-amber-50 text-amber-700'
                              : ep.method === 'DELETE'
                                ? 'bg-red-50 text-red-700'
                                : ep.method === 'PATCH'
                                  ? 'bg-purple-50 text-purple-700'
                                  : 'bg-slate-50 text-slate-700';
                      return (
                        <div
                          key={`${ep.method}-${ep.path}`}
                          className="flex items-center gap-2 rounded-md bg-slate-50/50 px-2.5 py-1.5"
                        >
                          <span
                            className={`inline-flex w-12 shrink-0 items-center justify-center rounded-md px-2 py-0.5 font-mono text-xs font-bold ${badgeClass}`}
                          >
                            {ep.method}
                          </span>
                          <span className="font-mono text-xs text-slate-700">{ep.path}</span>
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
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-slate-900">Cryptographic Reference</h2>
              <p className="mt-3 text-slate-500">
                Every algorithm, every security level — no black boxes.
              </p>
            </motion.div>
          </div>

          <div className="mx-auto max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-surface overflow-hidden rounded-xl shadow-glass"
            >
              {/* Header */}
              <div className="grid grid-cols-3 gap-4 border-b border-slate-200/50 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wider text-glow-purple">
                <span>Component</span>
                <span>Algorithm</span>
                <span>Security</span>
              </div>
              {/* Rows */}
              <div>
                {securityTable.map((row) => (
                  <div
                    key={row.component}
                    className="grid grid-cols-3 gap-4 border-b border-slate-200/50 px-5 py-3 text-sm transition-colors hover:bg-white/40"
                  >
                    <span className="font-medium text-slate-900">{row.component}</span>
                    <span className="font-mono text-xs text-slate-500">{row.algorithm}</span>
                    <span>
                      <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
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
                  className="flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/50 px-4 py-2 text-xs backdrop-blur-sm"
                >
                  <span>{badge.icon}</span>
                  <span className="text-slate-600">{badge.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Decision Records */}
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-slate-900">Architecture Decisions</h2>
              <p className="mt-3 text-slate-500">
                Key ADRs documenting why we made critical technical choices.
              </p>
            </motion.div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                  '7 facade stores consolidating 32 original stores. Composition-based architecture.',
                status: 'Accepted',
              },
              {
                id: 'ADR-004',
                title: 'Post-Quantum E2EE (ADR-004)',
                detail: 'PQXDH + Triple Ratchet with ML-KEM-768 for post-quantum forward secrecy.',
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
                className="glass-surface relative overflow-hidden rounded-2xl p-6 shadow-glass"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-purple-600">{adr.id}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      adr.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-purple-50 text-purple-700'
                    }`}
                  >
                    {adr.status}
                  </span>
                </div>
                <h3 className="mb-2 text-base font-bold text-slate-900">{adr.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{adr.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-slate-900">Tech Stack</h2>
              <p className="mt-3 text-slate-500">The technologies powering CGraph.</p>
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
                name: 'Triple Ratchet / PQXDH',
                icon: '🔐',
                desc: 'PQXDH, Triple Ratchet, ML-KEM-768, AES-256-GCM',
                version: 'v0.9.28',
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
                className="glass-surface rounded-2xl p-6 text-center shadow-glass"
              >
                <div className="mb-3 text-3xl">{tech.icon}</div>
                <h3 className="mb-1 text-sm font-bold text-slate-900">{tech.name}</h3>
                <p className="mb-2 text-xs text-slate-500">{tech.desc}</p>
                <span className="inline-block rounded-full bg-slate-100/60 px-2 py-0.5 font-mono text-[10px] text-slate-500">
                  {tech.version}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Need Help CTA */}
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-surface relative overflow-hidden rounded-2xl p-12 text-center shadow-glass"
          >
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-purple-200/20 opacity-60" />
            <div className="relative">
              <h2 className="mb-4 text-3xl font-bold text-slate-900">Questions or Feedback?</h2>
              <p className="mx-auto mb-8 max-w-xl text-slate-500">
                Found an issue? Want to contribute? Reach out on GitHub or contact us directly.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href="https://github.com/cgraph-dev/CGraph"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-500 px-6 py-3 font-medium text-white shadow-glass transition-colors hover:bg-purple-600"
                >
                  GitHub Repository
                </a>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200/60 bg-white/50 px-6 py-3 font-medium text-slate-700 shadow-glass backdrop-blur-sm transition-colors hover:bg-white/80"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </LiquidGlassLayout>
  );
}

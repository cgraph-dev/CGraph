/**
 * About Page
 *
 * Company information, mission, platform overview, and technical foundation.
 * All data sourced from actual project documentation.
 *
 * @since v0.9.2
 * @updated v0.9.14 - Professional rewrite with real project data
 * @updated v0.10.0 - Migrated to Liquid Glass design system
 */

import { motion } from 'framer-motion';
import { LiquidGlassLayout } from '@/components/liquid-glass';

const platformStats = [
  { label: 'Features Shipped', value: '55+', detail: 'of 69 tracked' },
  { label: 'Database Tables', value: '91', detail: 'PostgreSQL 16' },
  { label: 'Passing Tests', value: '1,342', detail: 'across all apps' },
  { label: 'Shared Packages', value: '12', detail: 'monorepo modules' },
];

const capabilities = [
  {
    icon: '💬',
    title: 'Real-Time Messaging',
    description:
      'Instant delivery with typing indicators, read receipts, voice messages, reactions, message editing, deletion, forwarding, and scheduling.',
  },
  {
    icon: '🔐',
    title: 'End-to-End Encryption',
    description:
      'Triple Ratchet protocol — PQXDH key exchange (P-256 + ML-KEM-768), hybrid post-quantum ratchet, AES-256-GCM encryption, and forward secrecy.',
  },
  {
    icon: '🏛️',
    title: 'Servers & Channels',
    description:
      'Organized servers with text, voice, forum, and announcement channels. Custom roles with 20+ granular permissions.',
  },
  {
    icon: '📋',
    title: 'Community Forums',
    description:
      'Posts with voting, karma, nested threads, rich text editor, BBCode parser, poll system, and moderator tools.',
  },
  {
    icon: '🎮',
    title: 'Gamification Engine',
    description:
      '30+ achievements across 6 categories, XP & levels, daily/weekly quests, streak multipliers, leaderboards, and virtual currency.',
  },
  {
    icon: '📹',
    title: 'Voice & Video Calls',
    description:
      'WebRTC-powered 1:1 and group calls with screen sharing. Built on Phoenix Channels for signaling.',
  },
];

const techStack = [
  {
    category: 'Backend',
    items: [
      { name: 'Elixir 1.17+ / Phoenix 1.8', role: 'API, WebSockets, PubSub' },
      { name: 'PostgreSQL 16', role: '91 tables, ULID IDs, full-text search' },
      { name: 'Redis 7', role: 'Distributed cache, PubSub, rate limiting' },
      { name: 'Oban', role: 'Background job processing' },
    ],
  },
  {
    category: 'Frontend',
    items: [
      { name: 'React 19 / TypeScript 5.8', role: 'Web application' },
      { name: 'React Native 0.81 / Expo 54', role: 'iOS & Android' },
      { name: 'Zustand 5', role: '7 facade stores, Composition' },
      { name: 'Vite 6.3', role: '168 optimized chunks, 62 lazy-loaded pages' },
    ],
  },
  {
    category: 'Infrastructure',
    items: [
      { name: 'Fly.io (Frankfurt)', role: 'Backend hosting' },
      { name: 'Vercel', role: 'Landing site deployment' },
      { name: 'Fly.io (IAD)', role: 'Web app deployment' },
      { name: 'Cloudflare', role: 'CDN, WAF, DDoS protection' },
      { name: 'Supabase', role: 'Managed PostgreSQL, Europe region' },
    ],
  },
];

const milestones = [
  {
    version: 'v0.9.7',
    date: 'Jan 27, 2026',
    title: 'Dual-App Architecture',
    description:
      'Separated landing site from web app. Enterprise-grade architecture with Modular architecture.',
    completed: true,
  },
  {
    version: 'v0.9.8',
    date: 'Jan 30, 2026',
    title: 'Code Simplification',
    description:
      'Major component extraction. 840 passing tests. Architecture score improved from 4.2 to 6.0.',
    completed: true,
  },
  {
    version: 'v0.9.10',
    date: 'Feb 1, 2026',
    title: 'E2EE Test Suite & Store Facades',
    description:
      '28 dedicated encryption tests. Store consolidation from 32 stores to 7 facades. 893 total tests.',
    completed: true,
  },
  {
    version: 'v0.9.11',
    date: 'Feb 2, 2026',
    title: 'Architecture Transformation',
    description:
      'Architecture score: 4.2 → 8.0. 12 feature modules, 7 facade hooks, 90+ shared UI components.',
    completed: true,
  },
  {
    version: 'v0.9.13–14',
    date: 'Feb 8, 2026',
    title: 'Platform Parity',
    description:
      '17/17 features on web + mobile. 1,342 passing tests. Reanimated v4 migration (222 → 0 TS errors).',
    completed: true,
  },
  {
    version: 'v1.0.0',
    date: 'Target: Mar 2026',
    title: 'Public Beta Launch',
    description:
      'Public discoverable servers, shareable invite links, forum channels, mobile beta on TestFlight & Play Store.',
    completed: false,
  },
];

const values = [
  {
    icon: '🔒',
    title: 'Privacy by Design',
    description:
      'Zero-knowledge architecture. The server never sees your encrypted messages. Forward secrecy ensures past messages stay safe even if keys are compromised.',
  },
  {
    icon: '⚡',
    title: 'Performance at Scale',
    description:
      'Elixir/BEAM VM for massive concurrency. 3-tier caching (ETS → Cachex → Redis). Sub-200ms latency targets. Built to handle millions of concurrent connections.',
  },
  {
    icon: '🎨',
    title: 'Full Customization',
    description:
      'Themes, custom CSS, seasonal events, avatar borders, particle effects, and a complete customization hub. Make your community truly yours.',
  },
  {
    icon: '🛡️',
    title: 'Security First',
    description:
      'Argon2id password hashing, CSP headers, HSTS, rate limiting, CSRF protection, magic-byte file validation, and automated security scanning in CI.',
  },
  {
    icon: '📱',
    title: 'Cross-Platform',
    description:
      'Native mobile apps with offline support, priority-based message queuing, and automatic sync on reconnect. Web, iOS, and Android — all in parity.',
  },
  {
    icon: '🏗️',
    title: 'Engineering Excellence',
    description:
      '9.0/10 architecture score. Strict TypeScript, 0 ESLint errors, conventional commits, automated quality gates, and comprehensive CI pipeline.',
  },
];

export default function About() {
  return (
    <LiquidGlassLayout
      title="About CGraph"
      subtitle="Building the future of private communication"
      maxWidth="max-w-6xl"
    >
      {/* Mission Section */}
      <section className="py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="text-3xl font-bold text-slate-900">Why I Built This</h2>
          <p className="mt-4 text-xl leading-relaxed text-slate-500">
            I got tired of needing one app for chat, another for forums, and a separate plugin for
            anything engaging.{' '}
            <span className="font-semibold text-glow-purple">
              CGraph puts messaging, forums, encryption, and gamification in one place
            </span>
            . Private by default. Fun to use. That&apos;s the whole idea.
          </p>
        </motion.div>
      </section>

      {/* Platform Stats */}
      <section className="py-16">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-slate-900">Platform at a Glance</h2>
            <p className="mt-3 text-lg text-slate-500">
              Real numbers from our codebase — no vanity metrics.
            </p>
          </motion.div>
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl gap-6 sm:grid-cols-2">
          {platformStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="glass-surface rounded-2xl p-6 text-center shadow-glass"
            >
              <motion.div
                className="text-5xl font-bold text-slate-900"
                initial={{ scale: 0.5 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
              >
                {stat.value}
              </motion.div>
              <div className="mt-2 text-lg font-semibold text-slate-900">{stat.label}</div>
              <div className="mt-1 text-sm text-slate-500">{stat.detail}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* What We're Building */}
      <section className="py-16">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-slate-900">What&apos;s in Here</h2>
            <p className="mt-3 text-lg text-slate-500">
              Six things CGraph does, all shipped and working.
            </p>
          </motion.div>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((cap, index) => (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              className="glass-surface rounded-2xl p-6 shadow-glass"
            >
              <span className="text-3xl">{cap.icon}</span>
              <h3 className="mt-3 text-lg font-semibold text-slate-900">{cap.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{cap.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-slate-900">What We Care About</h2>
            <p className="mt-3 text-lg text-slate-500">
              The principles that shape every decision in the codebase.
            </p>
          </motion.div>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              className="glass-surface rounded-2xl p-6 shadow-glass"
            >
              <span className="text-3xl">{value.icon}</span>
              <h3 className="mt-3 text-lg font-semibold text-slate-900">{value.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{value.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-16">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-slate-900">Tech Stack</h2>
            <p className="mt-3 text-lg text-slate-500">
              The technologies behind CGraph and why they were picked.
            </p>
          </motion.div>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {techStack.map((group, gIndex) => (
            <motion.div
              key={group.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: gIndex * 0.15, duration: 0.5 }}
              className="glass-surface rounded-2xl p-8 shadow-glass"
            >
              <h3 className="mb-6 text-lg font-bold text-glow-purple">{group.category}</h3>
              <div className="space-y-4">
                {group.items.map((item) => (
                  <div key={item.name}>
                    <div className="text-sm font-semibold text-slate-900">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.role}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-16">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-slate-900">Meet the Founder</h2>
            <p className="mt-3 text-lg text-slate-500">Solo project. I do everything.</p>
          </motion.div>
        </div>

        <div className="mx-auto mt-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="glass-surface rounded-2xl p-10 text-center shadow-glass"
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-violet-600 text-2xl font-bold text-white">
              BL
            </div>
            <h3 className="mt-4 text-xl font-bold text-slate-900">Burca Lucas</h3>
            <p className="mt-1 text-sm font-medium text-glow-purple">Founder & Developer</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Full-stack developer based in Georgia. I handle the backend (Elixir/Phoenix), frontend
              (React), mobile (React Native), crypto (Triple Ratchet / PQXDH), infrastructure, and
              design. Yeah, all of it.
            </p>
            <div className="mt-4 flex justify-center gap-4">
              <a
                href="https://github.com/cgraph-dev/CGraph"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-glow-purple transition-colors hover:text-slate-900"
              >
                GitHub →
              </a>
              <a
                href="mailto:hello@cgraph.org"
                className="text-sm text-glow-purple transition-colors hover:text-slate-900"
              >
                Contact →
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Development Timeline */}
      <section className="py-16">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-slate-900">Timeline</h2>
            <p className="mt-3 text-lg text-slate-500">
              What shipped and when — straight from the changelog.
            </p>
          </motion.div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {milestones.map((milestone, index) => (
            <motion.div
              key={milestone.version}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.03, y: -5 }}
              className="glass-surface relative overflow-hidden rounded-2xl p-6 shadow-glass"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-glow-purple">
                  {milestone.version}
                </span>

                <div className="relative flex items-center justify-center">
                  <motion.div
                    className="relative flex h-7 w-7 items-center justify-center rounded-full"
                    style={{
                      background: milestone.completed ? 'rgb(139, 92, 246)' : 'rgb(168, 85, 247)',
                      boxShadow: milestone.completed
                        ? '0 0 12px rgba(139, 92, 246, 0.4)'
                        : '0 0 12px rgba(168, 85, 247, 0.4)',
                    }}
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                  >
                    {milestone.completed ? (
                      <svg
                        className="h-3.5 w-3.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <motion.div
                        className="h-2 w-2 rounded-full bg-white"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    )}
                  </motion.div>
                  {!milestone.completed && (
                    <motion.div
                      className="absolute h-7 w-7 rounded-full"
                      style={{ background: 'rgba(168, 85, 247, 0.4)' }}
                      animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                    />
                  )}
                </div>
              </div>

              <div className="mb-1 text-xs text-slate-500">{milestone.date}</div>

              <h3 className="mb-2 text-base font-bold text-slate-900">{milestone.title}</h3>

              <p className="text-sm leading-relaxed text-slate-500">{milestone.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Security Commitment */}
      <section className="py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="text-3xl font-bold text-slate-900">Security</h2>
          <p className="mb-8 mt-3 text-lg text-slate-500">
            Security isn&apos;t a feature we ship. It&apos;s the foundation.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {[
            {
              title: 'Post-Quantum E2EE',
              detail:
                'PQXDH + Triple Ratchet with AES-256-GCM and ML-KEM-768. Past messages stay safe even if a key gets compromised — including against quantum computers.',
            },
            {
              title: 'Automated Security in CI',
              detail:
                'Gitleaks for secrets, Sobelow for Elixir, Grype for containers, pnpm audit for deps. All blocking — nothing merges if these fail.',
            },
            {
              title: 'GDPR',
              detail:
                "Full data export as JSON. Account deletion. Data minimization. Configurable retention. We don't keep what we don't need.",
            },
            {
              title: 'Infrastructure',
              detail:
                'Cloudflare WAF + DDoS protection, TLS 1.3, HSTS, CSP headers, rate limiting, trusted proxy validation.',
            },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="glass-surface rounded-2xl p-6 shadow-glass"
            >
              <h3 className="mb-2 font-semibold text-slate-900">{item.title}</h3>
              <p className="text-sm text-slate-500">{item.detail}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-slate-900">What&apos;s Next</h2>
          <p className="mx-auto mt-3 max-w-2xl text-lg leading-relaxed text-slate-500">
            Public beta is targeting Q2 2026. After that: message threads, SSO/SAML for teams,
            desktop apps, and more. The roadmap goes through 2027.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="https://github.com/cgraph-dev/CGraph"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              Follow on GitHub
            </a>
            <a
              href="mailto:hello@cgraph.org"
              className="rounded-xl border border-slate-200/50 px-6 py-3 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
            >
              Get in Touch
            </a>
          </div>
        </motion.div>
      </section>
    </LiquidGlassLayout>
  );
}

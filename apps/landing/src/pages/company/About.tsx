/**
 * About Page
 *
 * Company information, mission, platform overview, and technical foundation.
 * All data sourced from actual project documentation.
 *
 * @since v0.9.2
 * @updated v0.9.14 - Professional rewrite with real project data
 */

import { motion } from 'framer-motion';

const springs = { bouncy: { type: 'spring' as const, stiffness: 300, damping: 10 } };
import { MarketingLayout } from '@/components/marketing';
import { NeonIcon } from '@/components/marketing/ui';

const platformStats = [
  { label: 'Features Shipped', value: '142', detail: '38 phases complete' },
  { label: 'Database Tables', value: '94', detail: 'PostgreSQL 16 + Supabase' },
  { label: 'Passing Tests', value: '6,900+', detail: 'across web, mobile & backend' },
  { label: 'Shared Packages', value: '7', detail: 'monorepo modules' },
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
    icon: '✨',
    title: 'Cosmetics & Self-Expression',
    description:
      '325 collectible items across 7 categories — badges, titles, nameplates, profile themes, name styles, profile frames, and forum themes. 7 rarity tiers and 70 achievements.',
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
      { name: 'PostgreSQL 16', role: '94 tables, UUID IDs, full-text search' },
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
      { name: 'Vite 6.4', role: '168 optimized chunks, 62 lazy-loaded pages' },
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
    version: 'v0.9.26',
    date: 'Feb 15, 2026',
    title: 'Architecture Refactor',
    description:
      'Router split into 7 domain modules. 28 components organized. Turborepo remote caching. Architecture score: 9.2/10.',
    completed: true,
  },
  {
    version: 'v1.0.0',
    date: 'Mar 4, 2026',
    title: 'v1.0 Release',
    description:
      '38 phases complete. 142 requirements shipped. Full E2EE, forums, cosmetics, voice/video, creator economy, and mobile parity.',
    completed: true,
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
      '8.7/10 architecture score. Strict TypeScript, 0 ESLint errors, conventional commits, automated quality gates, and comprehensive CI pipeline.',
  },
];

export default function About() {
  return (
    <MarketingLayout
      title="About CGraph"
      subtitle="The all-in-one secure communication platform — real-time messaging, community forums, E2EE, cosmetics, and creator economy."
      eyebrow="Our Story"
    >
      {/* Mission Section */}
      <section className="marketing-section marketing-section--alt">
        <div className="marketing-section__container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl text-center"
          >
            <h2 className="marketing-section__title">Why I Built This</h2>
            <p className="text-xl leading-relaxed" style={{ color: 'var(--color-gray)' }}>
              I got tired of needing one app for chat, another for forums, and a separate plugin for
              anything engaging.{' '}
              <span className="marketing-hero__highlight">
                CGraph puts messaging, forums, encryption, cosmetics, and creator economy in one
                place
              </span>
              . Private by default. Fun to use. That’s the whole idea.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="marketing-section marketing-section--dark">
        <div className="marketing-section__container">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title">Platform at a Glance</h2>
              <p className="marketing-section__desc">
                Real numbers from our codebase — no vanity metrics.
              </p>
            </motion.div>
          </div>

          <div
            className="marketing-grid marketing-grid--2"
            style={{ maxWidth: '48rem', margin: '0 auto' }}
          >
            {platformStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="marketing-card text-center"
              >
                <motion.div
                  className="font-zentry text-5xl font-bold"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                  initial={{ scale: 0.5 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 + 0.2, ...springs.bouncy }}
                >
                  {stat.value}
                </motion.div>
                <div className="mt-2 text-lg font-semibold text-white">{stat.label}</div>
                <div className="mt-1 text-sm" style={{ color: 'var(--color-gray)' }}>
                  {stat.detail}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What We're Building */}
      <section className="marketing-section marketing-section--alt">
        <div className="marketing-section__container">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title">What's in Here</h2>
              <p className="marketing-section__desc">
                Six things CGraph does, all shipped and working.
              </p>
            </motion.div>
          </div>

          <div className="marketing-grid marketing-grid--3">
            {capabilities.map((cap, index) => (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="marketing-card"
              >
                <span className="marketing-card__icon">
                  <NeonIcon symbol={cap.icon} size={34} title={cap.title} />
                </span>
                <h3 className="marketing-card__title">{cap.title}</h3>
                <p className="marketing-card__desc">{cap.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="marketing-section marketing-section--dark">
        <div className="marketing-section__container">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title">What We Care About</h2>
              <p className="marketing-section__desc">
                The principles that shape every decision in the codebase.
              </p>
            </motion.div>
          </div>

          <div className="marketing-grid marketing-grid--3">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="marketing-card"
              >
                <span className="marketing-card__icon">
                  <NeonIcon symbol={value.icon} size={34} title={value.title} />
                </span>
                <h3 className="marketing-card__title">{value.title}</h3>
                <p className="marketing-card__desc">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="marketing-section marketing-section--alt">
        <div className="marketing-section__container">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title">Tech Stack</h2>
              <p className="marketing-section__desc">
                The technologies behind CGraph and why they were picked.
              </p>
            </motion.div>
          </div>

          <div className="marketing-grid marketing-grid--3">
            {techStack.map((group, gIndex) => (
              <motion.div
                key={group.category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: gIndex * 0.15 }}
                className="marketing-card"
                style={{ padding: '2rem' }}
              >
                <h3
                  className="mb-6 text-lg font-bold"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {group.category}
                </h3>
                <div className="space-y-4">
                  {group.items.map((item) => (
                    <div key={item.name}>
                      <div className="text-sm font-semibold text-white">{item.name}</div>
                      <div className="text-xs" style={{ color: 'var(--color-gray)' }}>
                        {item.role}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="marketing-section marketing-section--dark">
        <div className="marketing-section__container">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title">Meet the Founder</h2>
              <p className="marketing-section__desc">Solo project. I do everything.</p>
            </motion.div>
          </div>

          <div className="mx-auto max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="marketing-card team-card text-center"
              style={{ padding: '2.5rem' }}
            >
              <div
                className="team-card__avatar mx-auto"
                style={{
                  width: '5rem',
                  height: '5rem',
                  fontSize: '1.5rem',
                  background:
                    'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                }}
              >
                BL
              </div>
              <h3 className="team-card__name mt-4">Burca Lucas</h3>
              <p className="team-card__role">Founder & Developer</p>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-gray)' }}>
                Full-stack developer based in Georgia. I handle the backend (Elixir/Phoenix),
                frontend (React), mobile (React Native), crypto (Triple Ratchet / PQXDH),
                infrastructure, and design. Yeah, all of it.
              </p>
              <div className="mt-4 flex justify-center gap-4">
                <a
                  href="https://github.com/cgraph-dev/CGraph"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm transition-colors hover:text-white"
                  style={{ color: 'var(--color-primary)' }}
                >
                  GitHub →
                </a>
                <a
                  href="mailto:hello@cgraph.org"
                  className="text-sm transition-colors hover:text-white"
                  style={{ color: 'var(--color-primary)' }}
                >
                  Contact →
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Development Timeline */}
      <section className="marketing-section marketing-section--alt">
        <div className="mx-auto max-w-5xl px-4">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title">Timeline</h2>
              <p className="marketing-section__desc">
                What shipped and when — straight from the changelog.
              </p>
            </motion.div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.version}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.03, y: -5 }}
                className="marketing-card relative overflow-hidden"
                style={{
                  borderColor: milestone.completed
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'rgba(139, 92, 246, 0.3)',
                }}
              >
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    background: milestone.completed
                      ? 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.4), transparent 70%)'
                      : 'radial-gradient(circle at top right, rgba(139, 92, 246, 0.4), transparent 70%)',
                  }}
                />

                <div className="relative mb-3 flex items-center justify-between">
                  <span
                    className="font-mono text-sm font-bold"
                    style={{
                      color: milestone.completed
                        ? 'var(--color-primary)'
                        : 'var(--color-secondary)',
                    }}
                  >
                    {milestone.version}
                  </span>

                  <div className="relative flex items-center justify-center">
                    <motion.div
                      className="relative flex h-7 w-7 items-center justify-center rounded-full"
                      style={{
                        background: milestone.completed
                          ? 'var(--color-primary)'
                          : 'var(--color-secondary)',
                        boxShadow: milestone.completed
                          ? '0 0 12px rgba(16, 185, 129, 0.5)'
                          : '0 0 12px rgba(139, 92, 246, 0.5)',
                      }}
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 + 0.3, ...springs.bouncy }}
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
                        style={{ background: 'rgba(139, 92, 246, 0.4)' }}
                        animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                      />
                    )}
                  </div>
                </div>

                <div className="relative mb-1 text-xs" style={{ color: 'var(--color-gray)' }}>
                  {milestone.date}
                </div>

                <h3 className="relative mb-2 text-base font-bold text-white">{milestone.title}</h3>

                <p
                  className="relative text-sm"
                  style={{ color: 'var(--color-gray)', margin: 0, lineHeight: 1.6 }}
                >
                  {milestone.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Commitment */}
      <section className="marketing-section marketing-section--dark">
        <div className="marketing-section__container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl text-center"
          >
            <h2 className="marketing-section__title">Security</h2>
            <p className="mb-8 text-lg" style={{ color: 'var(--color-gray)' }}>
              Security isn’t a feature we ship. It’s the foundation.
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
                  'Full data export as JSON. Account deletion. Data minimization. Configurable retention. We don’t keep what we don’t need.',
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
                transition={{ delay: index * 0.1 }}
                className="marketing-card"
              >
                <h3 className="mb-2 font-semibold text-white">{item.title}</h3>
                <p className="text-sm" style={{ color: 'var(--color-gray)' }}>
                  {item.detail}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="marketing-section marketing-section--alt">
        <div className="marketing-section__container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="marketing-section__title">What's Next</h2>
            <p className="marketing-section__desc mx-auto max-w-2xl" style={{ lineHeight: 1.8 }}>
              v1.0 is live. Next up: message threads, SSO/SAML for teams, desktop apps, and scaling.
              The roadmap goes through 2027.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href="https://github.com/cgraph-dev/CGraph"
                target="_blank"
                rel="noopener noreferrer"
                className="marketing-btn marketing-btn--primary"
              >
                Follow on GitHub
              </a>
              <a href="mailto:hello@cgraph.org" className="marketing-btn marketing-btn--secondary">
                Get in Touch
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
}

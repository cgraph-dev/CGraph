/**
 * Blog Page - Development log and engineering updates
 *
 * All posts reflect real milestones from the project changelog and documentation.
 * No fabricated content.
 *
 * @since v0.9.2
 * @updated v0.9.14 - Professional rewrite with real development milestones
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MarketingLayout } from '@/components/marketing';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  featured: boolean;
  image: string;
  tags: string[];
}

const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: 'Platform Parity: 17/17 Features on Web & Mobile',
    excerpt:
      'v0.9.13\u201314 marks full feature parity between web and mobile. 1,342 passing tests, Reanimated v4 migration complete (222 \u2192 0 TypeScript errors), and 132 facade tests ensuring store reliability.',
    category: 'Engineering',
    author: 'Burca Lucas',
    date: 'February 8, 2026',
    readTime: '6 min read',
    featured: true,
    image: '🎯',
    tags: ['React Native', 'Reanimated v4', 'Testing'],
  },
  {
    id: 2,
    title: 'Architecture Transformation: From 4.2 to 9.0',
    excerpt:
      'How we restructured the entire codebase into 12 feature modules with 7 facade hooks, consolidated 32 stores into 7 facades, and built 90+ shared UI components. Architecture score jumped from 4.2/10 to 9.0/10.',
    category: 'Engineering',
    author: 'Burca Lucas',
    date: 'February 2, 2026',
    readTime: '12 min read',
    featured: true,
    image: '🏗️',
    tags: ['Architecture', 'Zustand', 'Modules'],
  },
  {
    id: 3,
    title: 'E2EE Test Suite: 28 Tests for Signal Protocol',
    excerpt:
      'We built a dedicated test suite for our Signal Protocol implementation covering X3DH key exchange, Double Ratchet message encryption, forward secrecy verification, ciphertext randomization, and tampered-message rejection.',
    category: 'Security',
    author: 'Burca Lucas',
    date: 'February 1, 2026',
    readTime: '10 min read',
    featured: false,
    image: '🔐',
    tags: ['E2EE', 'Signal Protocol', 'Testing'],
  },
  {
    id: 4,
    title: 'Store Consolidation: 32 Stores \u2192 7 Facades',
    excerpt:
      'Adopting Discord-style composition patterns, we consolidated 32 scattered Zustand stores into 7 clean facade hooks: Auth, Chat, Gamification, Settings, Community, Marketplace, and UI. 25 dedicated facade tests ensure reliability.',
    category: 'Engineering',
    author: 'Burca Lucas',
    date: 'February 1, 2026',
    readTime: '8 min read',
    featured: false,
    image: '\u2699\ufe0f',
    tags: ['Zustand', 'State Management', 'Facades'],
  },
  {
    id: 5,
    title: 'Code Simplification Sprint: console.log 325 \u2192 2',
    excerpt:
      'A deep-dive into our simplification sprint: eliminated 96% of `as any` casts (27 \u2192 1), removed 99% of console.log calls (325 \u2192 2), reduced Settings.tsx from 1,172 to 221 lines, and split SocketManager from 960 to 616 lines across 5 modules.',
    category: 'Engineering',
    author: 'Burca Lucas',
    date: 'January 30, 2026',
    readTime: '7 min read',
    featured: false,
    image: '\u2728',
    tags: ['Code Quality', 'TypeScript', 'Refactoring'],
  },
  {
    id: 6,
    title: 'Dual-App Architecture: Landing vs Web App',
    excerpt:
      'Why we separated cgraph.org (landing, ~200KB) from app.cgraph.org (full app, ~2MB). The enterprise-grade dual-app pattern with Discord-style module system, 62 lazy-loaded pages, and 168 optimized build chunks.',
    category: 'Architecture',
    author: 'Burca Lucas',
    date: 'January 27, 2026',
    readTime: '9 min read',
    featured: false,
    image: '🌐',
    tags: ['Architecture', 'Performance', 'Vite'],
  },
  {
    id: 7,
    title: 'Critical Security Fixes: E2EE Plaintext Fallback',
    excerpt:
      'We discovered and fixed a critical vulnerability where messages could silently fall back to unencrypted delivery. Plus: presence privacy leak, Stripe webhook misconfiguration, IP spoofing, and MIME type spoofing fixes.',
    category: 'Security',
    author: 'Burca Lucas',
    date: 'January 27, 2026',
    readTime: '8 min read',
    featured: false,
    image: '🛡\ufe0f',
    tags: ['Security', 'E2EE', 'Vulnerability'],
  },
  {
    id: 8,
    title: 'Why Elixir, Phoenix, and the BEAM VM',
    excerpt:
      'Our tech stack deep-dive: Elixir 1.17+ with Phoenix 1.8 for the backend, PostgreSQL 16 with 91 tables, 3-tier caching (ETS \u2192 Cachex \u2192 Redis), and Phoenix Channels for WebSocket real-time. Why we chose the same stack Discord uses.',
    category: 'Engineering',
    author: 'Burca Lucas',
    date: 'January 2026',
    readTime: '14 min read',
    featured: false,
    image: '💜',
    tags: ['Elixir', 'Phoenix', 'Backend'],
  },
  {
    id: 9,
    title: 'Introducing CGraph: The Vision',
    excerpt:
      'The vision behind CGraph \u2014 combining Discord-style messaging, Reddit-style forums, Signal-level encryption, and RPG gamification into one platform. 5 subscription tiers from free to enterprise, built for communities of all sizes.',
    category: 'Product',
    author: 'Burca Lucas',
    date: 'January 2026',
    readTime: '5 min read',
    featured: false,
    image: '🚀',
    tags: ['Product', 'Vision', 'Launch'],
  },
];

const categories = ['All', 'Engineering', 'Security', 'Architecture', 'Product'];

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const filteredPosts =
    selectedCategory === 'All'
      ? blogPosts
      : blogPosts.filter((post) => post.category === selectedCategory);

  const featuredPosts = filteredPosts.filter((p) => p.featured);
  const regularPosts = filteredPosts.filter((p) => !p.featured);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
    setTimeout(() => setSubscribed(false), 3000);
    setEmail('');
  };

  return (
    <MarketingLayout
      title="Engineering Blog"
      subtitle="Development milestones, architecture decisions, and security updates \u2014 every post backed by real commits."
      eyebrow="Dev Log"
      showCTA
    >
      {/* Category Filter */}
      <section
        className="marketing-section marketing-section--alt"
        style={{ paddingTop: '2rem', paddingBottom: '2rem' }}
      >
        <div className="marketing-section__container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-2"
          >
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'text-white'
                    : 'border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
                style={
                  selectedCategory === category
                    ? {
                        background:
                          'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                      }
                    : undefined
                }
              >
                {category}
                {category !== 'All' && (
                  <span className="ml-1.5 opacity-60">
                    ({blogPosts.filter((p) => p.category === category).length})
                  </span>
                )}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="marketing-section marketing-section--dark">
          <div className="marketing-section__container">
            <div className="marketing-section__header">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="marketing-section__title font-zentry">Featured</h2>
                <p className="marketing-section__desc">Latest highlights from development</p>
              </motion.div>
            </div>

            <div className="marketing-grid marketing-grid--2">
              {featuredPosts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="marketing-card group relative overflow-hidden"
                  style={{ padding: '2rem' }}
                >
                  {/* Featured badge */}
                  <div
                    className="absolute right-4 top-4 rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{
                      background:
                        'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                      color: 'white',
                    }}
                  >
                    Featured
                  </div>

                  <div className="mb-5 text-5xl">{post.image}</div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-medium"
                      style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      {post.category}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-gray)' }}>
                      {post.date}
                    </span>
                  </div>
                  <h3 className="mb-3 text-xl font-bold leading-tight text-white">{post.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-gray)' }}>
                    {post.excerpt}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-white/5 px-2 py-0.5 text-xs"
                        style={{ color: 'var(--color-gray)' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-medium text-white">{post.author}</span>
                    <span className="text-xs" style={{ color: 'var(--color-gray)' }}>
                      {post.readTime}
                    </span>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Posts */}
      <section className="marketing-section marketing-section--alt">
        <div className="marketing-section__container">
          {featuredPosts.length > 0 && regularPosts.length > 0 && (
            <div className="marketing-section__header">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="marketing-section__title font-zentry">All Posts</h2>
              </motion.div>
            </div>
          )}

          <div className="mx-auto max-w-3xl space-y-4">
            {(featuredPosts.length > 0 ? regularPosts : filteredPosts).map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                whileHover={{ x: 4 }}
                className="marketing-card flex gap-5"
                style={{ padding: '1.5rem' }}
              >
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-2xl"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(139, 92, 246, 0.15))',
                  }}
                >
                  {post.image}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      {post.category}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-gray)' }}>
                      {post.date}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-gray)' }}>
                      \u00b7 {post.readTime}
                    </span>
                  </div>
                  <h3 className="mb-1.5 text-base font-bold leading-snug text-white">
                    {post.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-gray)' }}>
                    {post.excerpt}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-white/5 px-2 py-0.5 text-xs"
                        style={{ color: 'var(--color-gray)' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Development Stats */}
      <section className="marketing-section marketing-section--dark">
        <div className="marketing-section__container">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title font-zentry">By the Numbers</h2>
              <p className="marketing-section__desc">
                Real metrics from the codebase \u2014 updated with each release.
              </p>
            </motion.div>
          </div>

          <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { value: '1,342', label: 'Passing Tests' },
              { value: '9.0/10', label: 'Architecture Score' },
              { value: '0', label: 'TypeScript Errors' },
              { value: '80%', label: 'Features Complete' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="marketing-card text-center"
              >
                <div
                  className="font-zentry text-3xl font-bold"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {stat.value}
                </div>
                <div className="mt-1 text-sm" style={{ color: 'var(--color-gray)' }}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="marketing-section marketing-section--alt">
        <div className="marketing-section__container" style={{ maxWidth: '48rem' }}>
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
            <h2 className="mb-4 font-zentry text-3xl font-bold text-white">Stay Updated</h2>
            <p className="mx-auto mb-8 max-w-xl" style={{ color: 'var(--color-gray)' }}>
              Get notified about engineering updates, security advisories, and launch announcements.
            </p>

            {subscribed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 rounded-xl px-6 py-4"
                style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-primary)' }}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Thanks for subscribing!
              </motion.div>
            ) : (
              <form
                onSubmit={handleSubscribe}
                className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row"
              >
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="contact-form__input flex-1"
                />
                <button type="submit" className="marketing-btn marketing-btn--primary">
                  Subscribe
                </button>
              </form>
            )}

            <p className="mt-4 text-xs" style={{ color: 'var(--color-gray)' }}>
              No spam. Unsubscribe anytime.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Social */}
      <section
        className="marketing-section marketing-section--dark"
        style={{ padding: '3rem 2rem' }}
      >
        <div className="mx-auto max-w-4xl">
          <div
            className="flex flex-wrap items-center justify-center gap-6 text-sm"
            style={{ color: 'var(--color-gray)' }}
          >
            <a
              href="https://github.com/cgraph-dev/CGraph"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 transition-colors hover:text-white"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
            <a
              href="mailto:hello@cgraph.org"
              className="flex items-center gap-2 transition-colors hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
              hello@cgraph.org
            </a>
            <a
              href="mailto:security@cgraph.org"
              className="flex items-center gap-2 transition-colors hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
              Security Reports
            </a>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

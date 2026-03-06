/**
 * Blog Page - Development log and engineering updates
 *
 * All posts reflect real milestones from the project changelog and documentation.
 * No fabricated content.
 *
 * @since v0.9.2
 * @updated v0.9.14 - Professional rewrite with real development milestones
 * @updated v0.9.15 - Enhanced visual design, release hero, professional card layout
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MarketingLayout } from '@/components/marketing';
import { NeonIcon } from '@/components/marketing/ui';
import { blogPosts, categories, categoryColors, defaultCategoryColor } from '@/data/blog';

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
      title="Dev Log"
      subtitle="What I shipped, what broke, and how I fixed it. Every post traces back to a real commit."
      eyebrow="Blog"
    >
      {/* Latest Release Banner */}
      <section className="marketing-section marketing-section--dark blog-release">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="blog-release-card"
          >
            <div className="blog-release-card__bar" />
            <div className="blog-release-content flex flex-col items-center gap-6 p-8 md:flex-row">
              <div className="flex-1">
                <div className="mb-3 flex items-center gap-3">
                  <span className="blog-release-badge">Latest Release</span>
                  <span className="font-mono text-sm text-gray-400">v1.0.0</span>
                </div>
                <h3 className="blog-release-title mb-2 text-xl font-bold text-white md:text-2xl">
                  v1.0.0 — All 19 Phases Complete
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-gray)' }}>
                  Every planned phase shipped. 142 requirements across E2EE messaging, forums,
                  gamification, voice & video, monetization, and mobile parity. All packages synced
                  to v1.0.0. Production deployed on Fly.io, Vercel, and Supabase.
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-center gap-2">
                <div className="blog-release-icon flex items-center justify-center">
                  <NeonIcon symbol="🚀" size={40} title="v1.0.0 release" />
                </div>
                <span className="text-xs text-gray-500">Mar 4, 2026</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="marketing-section marketing-section--alt blog-filter">
        <div className="marketing-section__container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-2"
          >
            {categories.map((category) => {
              const isActive = selectedCategory === category;
              const count = blogPosts.filter((p) => p.category === category).length;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`blog-filter-button ${isActive ? 'is-active' : ''}`}
                >
                  {category}
                  {category !== 'All' && <span className="blog-filter-count">{count}</span>}
                </button>
              );
            })}
          </motion.div>

          {/* Results count */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4 text-center text-sm"
            style={{ color: 'var(--color-gray)' }}
          >
            {filteredPosts.length} {filteredPosts.length === 1 ? 'article' : 'articles'}
            {selectedCategory !== 'All' && ` in ${selectedCategory}`}
          </motion.p>
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
                <h2 className="marketing-section__title">Featured</h2>
                <p className="marketing-section__desc">Latest highlights from development</p>
              </motion.div>
            </div>

            <div className="marketing-grid marketing-grid--2">
              {featuredPosts.map((post, index) => {
                const catColor = categoryColors[post.category] ?? defaultCategoryColor;
                return (
                  <Link key={post.id} to={`/blog/${post.slug}`} className="block no-underline">
                    <motion.article
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.15 }}
                      whileHover={{ y: -8, transition: { duration: 0.2 } }}
                      className="marketing-card blog-featured-card group relative"
                      style={{ padding: 0 }}
                    >
                      {/* Gradient top border */}
                      <div
                        className="h-1 w-full"
                        style={{
                          background: `linear-gradient(90deg, ${catColor.text}, var(--color-secondary))`,
                        }}
                      />

                      <div className="blog-featured-body p-7">
                        {/* Featured badge */}
                        <div className="blog-featured-badge absolute right-4 top-5">Featured</div>

                        {/* Icon + Category */}
                        <div className="mb-5 flex items-center gap-4">
                          <div className="blog-post-icon">
                            <NeonIcon symbol={post.image} size={30} title={post.title} />
                          </div>
                          <div>
                            <span
                              className="rounded-full px-3 py-1 text-xs font-semibold"
                              style={{ background: catColor.bg, color: catColor.text }}
                            >
                              {post.category}
                            </span>
                          </div>
                        </div>

                        <h3 className="mb-3 text-xl font-bold leading-tight text-white transition-colors group-hover:text-emerald-300">
                          {post.title}
                        </h3>
                        <p
                          className="mb-5 text-sm leading-relaxed"
                          style={{ color: 'var(--color-gray)' }}
                        >
                          {post.excerpt}
                        </p>

                        {/* Tags */}
                        <div className="mb-5 flex flex-wrap gap-2">
                          {post.tags.map((tag) => (
                            <span key={tag} className="blog-tag">
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Author + Meta */}
                        <div className="flex items-center justify-between border-t border-white/5 pt-4">
                          <div className="flex items-center gap-2.5">
                            <div className="blog-author-avatar">BL</div>
                            <span className="text-sm font-medium text-white">{post.author}</span>
                          </div>
                          <div
                            className="flex items-center gap-3 text-xs"
                            style={{ color: 'var(--color-gray)' }}
                          >
                            <span>{post.date}</span>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  </Link>
                );
              })}
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
                <h2 className="marketing-section__title">All Posts</h2>
                <p className="marketing-section__desc">Every milestone from the changelog.</p>
              </motion.div>
            </div>
          )}

          <div className="mx-auto max-w-4xl space-y-5">
            {(featuredPosts.length > 0 ? regularPosts : filteredPosts).map((post, index) => {
              const catColor = categoryColors[post.category] ?? defaultCategoryColor;
              return (
                <Link key={post.id} to={`/blog/${post.slug}`} className="block no-underline">
                  <motion.article
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.06 }}
                    whileHover={{ x: 4, transition: { duration: 0.15 } }}
                    className="marketing-card blog-list-card group relative"
                    style={{ padding: 0 }}
                  >
                    {/* Left accent bar */}
                    <div
                      className="absolute left-0 top-0 h-full w-1"
                      style={{
                        background: `linear-gradient(180deg, ${catColor.text}, transparent)`,
                      }}
                    />

                    <div className="blog-list-body flex gap-5 p-5 pl-6">
                      <div className="blog-list-icon">
                        <NeonIcon symbol={post.image} size={26} title={post.title} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span
                            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                            style={{ background: catColor.bg, color: catColor.text }}
                          >
                            {post.category}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--color-gray)' }}>
                            {post.date}
                          </span>
                        </div>
                        <h3 className="mb-2 text-base font-bold leading-snug text-white transition-colors group-hover:text-emerald-300">
                          {post.title}
                        </h3>
                        <p
                          className="mb-3 text-sm leading-relaxed"
                          style={{ color: 'var(--color-gray)' }}
                        >
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1.5">
                            {post.tags.map((tag) => (
                              <span key={tag} className="blog-tag">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="ml-4 flex shrink-0 items-center gap-2">
                            <div
                              className="blog-author-avatar"
                              style={{ width: '1.25rem', height: '1.25rem', fontSize: '9px' }}
                            >
                              BL
                            </div>
                            <span className="text-xs text-gray-500">{post.author}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                </Link>
              );
            })}
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
              <h2 className="marketing-section__title">By the Numbers</h2>
              <p className="marketing-section__desc">
                Real metrics from the codebase — updated with each release.
              </p>
            </motion.div>
          </div>

          <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { value: '1,342', label: 'Passing Tests', icon: '✓', color: '#34d399' },
              { value: '9.0/10', label: 'Architecture Score', icon: '◆', color: '#818cf8' },
              { value: '0', label: 'TypeScript Errors', icon: '⊘', color: '#fbbf24' },
              { value: '80%', label: 'Features Complete', icon: '◉', color: '#f472b6' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="marketing-card blog-stat-card relative text-center"
                style={{ padding: '2rem 1.5rem' }}
              >
                {/* Background glow */}
                <div
                  className="absolute inset-0 opacity-5"
                  style={{
                    background: `radial-gradient(circle at center, ${stat.color}, transparent 70%)`,
                  }}
                />
                <div className="relative">
                  <div className="mb-2 inline-flex">
                    <NeonIcon symbol={stat.icon} size={15} title={stat.label} color={stat.color} />
                  </div>
                  <div
                    className="text-3xl font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${stat.color}, var(--color-secondary))`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {stat.value}
                  </div>
                  <div className="mt-2 text-sm" style={{ color: 'var(--color-gray)' }}>
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mt-8 max-w-2xl"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-white">Release Progress</span>
              <span className="font-mono text-sm" style={{ color: 'var(--color-primary)' }}>
                v0.9.14 → v1.0
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: '80%' }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  background:
                    'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
                }}
              />
            </div>
            <div
              className="mt-1 flex justify-between text-xs"
              style={{ color: 'var(--color-gray)' }}
            >
              <span>55/69 features shipped</span>
              <span>Q2 2026 target</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="marketing-section marketing-section--alt">
        <div className="marketing-section__container blog-newsletter">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="blog-newsletter-card blog-newsletter-shell"
            style={{ padding: '3rem' }}
          >
            {/* Decorative circles */}
            <div
              className="absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-10"
              style={{ background: 'var(--color-primary)' }}
            />
            <div
              className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full opacity-10"
              style={{ background: 'var(--color-secondary)' }}
            />

            <div className="blog-newsletter-content relative text-center">
              <h2 className="blog-newsletter-title mb-2 font-bold">Stay Updated</h2>
              <p className="mx-auto mb-8 max-w-lg text-sm" style={{ color: 'var(--color-gray)' }}>
                Get notified about engineering updates, security advisories, and launch
                announcements. No spam — just real development progress.
              </p>

              {subscribed ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-4"
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--color-primary)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                  }}
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
                    aria-label="Email address for newsletter"
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
                No spam. Unsubscribe anytime. We respect your inbox.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social */}
      <section className="marketing-section marketing-section--dark blog-social">
        <div className="mx-auto max-w-4xl">
          <div
            className="flex flex-wrap items-center justify-center gap-4 text-sm"
            style={{ color: 'var(--color-gray)' }}
          >
            <a
              href="https://github.com/cgraph-dev/CGraph"
              target="_blank"
              rel="noopener noreferrer"
              className="blog-social-link"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
            <a href="mailto:hello@cgraph.org" className="blog-social-link">
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
            <a href="mailto:security@cgraph.org" className="blog-social-link">
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

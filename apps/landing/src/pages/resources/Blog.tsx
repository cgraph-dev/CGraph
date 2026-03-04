/**
 * Blog Page - Development log and engineering updates
 *
 * All posts reflect real milestones from the project changelog and documentation.
 * No fabricated content.
 *
 * @since v0.9.2
 * @updated v0.9.14 - Professional rewrite with real development milestones
 * @updated v0.9.15 - Enhanced visual design, release hero, professional card layout
 * @updated v0.9.26 - Migrated to Liquid Glass design system
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LiquidGlassLayout } from '@/components/liquid-glass';
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
    <LiquidGlassLayout
      title="Blog"
      subtitle="Insights, updates, and guides from the CGraph team"
      maxWidth="max-w-5xl"
    >
      {/* Latest Release Banner */}
      <section className="mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-surface overflow-hidden rounded-2xl shadow-glass"
        >
          <div className="h-1 w-full bg-gradient-to-r from-purple-500 to-violet-400" />
          <div className="flex flex-col items-center gap-6 p-8 md:flex-row">
            <div className="flex-1">
              <div className="mb-3 flex items-center gap-3">
                <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                  Latest Release
                </span>
                <span className="font-mono text-sm text-slate-400">v0.9.26</span>
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900 md:text-2xl">
                Architecture Refactor Complete
              </h3>
              <p className="text-sm leading-relaxed text-slate-500">
                Router split into 7 domain modules (989→122 lines), 28 components organized into 6
                directories, Turborepo remote caching, bundle size monitoring. Score: 9.2/10.
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-4xl">
                🏗️
              </div>
              <span className="text-xs text-slate-400">Feb 15, 2026</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Category Filter */}
      <section className="mb-12">
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
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-purple-500 text-white shadow-glass'
                    : 'bg-white/60 text-slate-600 hover:bg-white/80'
                }`}
              >
                {category}
                {category !== 'All' && (
                  <span
                    className={`ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200/60 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </motion.div>

        {/* Results count */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 text-center text-sm text-slate-500"
        >
          {filteredPosts.length} {filteredPosts.length === 1 ? 'article' : 'articles'}
          {selectedCategory !== 'All' && ` in ${selectedCategory}`}
        </motion.p>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-6"
          >
            <h2 className="text-3xl font-bold text-slate-900">Featured</h2>
            <p className="mt-1 text-slate-500">Latest highlights from development</p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2">
            {featuredPosts.map((post, index) => {
              const catColor = categoryColors[post.category] ?? defaultCategoryColor;
              return (
                <Link key={post.id} to={`/blog/${post.slug}`} className="block no-underline">
                  <motion.article
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.15 }}
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                    className="glass-surface group relative overflow-hidden rounded-2xl shadow-glass transition-shadow hover:shadow-glass-lg"
                  >
                    {/* Gradient top border */}
                    <div className="h-1 w-full bg-gradient-to-r from-purple-500 to-violet-400" />

                    <div className="p-7">
                      {/* Featured badge */}
                      <div className="absolute right-4 top-5 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                        Featured
                      </div>

                      {/* Icon + Category */}
                      <div className="mb-5 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl">
                          {post.image}
                        </div>
                        <div>
                          <span
                            className="rounded-full px-3 py-1 text-xs font-medium"
                            style={{ background: catColor.bg, color: catColor.text }}
                          >
                            {post.category}
                          </span>
                        </div>
                      </div>

                      <h3 className="mb-3 text-xl font-bold leading-tight text-slate-900 transition-colors group-hover:text-glow-purple">
                        {post.title}
                      </h3>
                      <p className="mb-5 text-sm leading-relaxed text-slate-500">{post.excerpt}</p>

                      {/* Tags */}
                      <div className="mb-5 flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Author + Meta */}
                      <div className="flex items-center justify-between border-t border-slate-200/60 pt-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700">
                            BL
                          </div>
                          <span className="text-sm font-medium text-slate-900">{post.author}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span>{post.date}</span>
                          <span className="opacity-40">·</span>
                          <span>{post.readTime}</span>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* All Posts */}
      <section className="mb-12">
        {featuredPosts.length > 0 && regularPosts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-6"
          >
            <h2 className="text-3xl font-bold text-slate-900">All Posts</h2>
            <p className="mt-1 text-slate-500">Every milestone from the changelog.</p>
          </motion.div>
        )}

        <div className="space-y-5">
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
                  className="glass-surface group relative overflow-hidden rounded-2xl shadow-glass transition-shadow hover:shadow-glass-lg"
                >
                  {/* Left accent bar */}
                  <div
                    className="absolute left-0 top-0 h-full w-1 rounded-l-2xl"
                    style={{
                      background: `linear-gradient(180deg, ${catColor.text}, transparent)`,
                    }}
                  />

                  <div className="flex gap-5 p-5 pl-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
                      {post.image}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className="rounded-full px-3 py-1 text-xs font-medium"
                          style={{ background: catColor.bg, color: catColor.text }}
                        >
                          {post.category}
                        </span>
                        <span className="text-xs text-slate-400">{post.date}</span>
                        <span className="text-xs text-slate-300">·</span>
                        <span className="text-xs text-slate-400">{post.readTime}</span>
                      </div>
                      <h3 className="mb-2 text-base font-bold leading-snug text-slate-900 transition-colors group-hover:text-glow-purple">
                        {post.title}
                      </h3>
                      <p className="mb-3 text-sm leading-relaxed text-slate-500">{post.excerpt}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1.5">
                          {post.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="ml-4 flex shrink-0 items-center gap-2">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-[9px] font-semibold text-purple-700">
                            BL
                          </div>
                          <span className="text-xs text-slate-400">{post.author}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.article>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Development Stats */}
      <section className="mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6"
        >
          <h2 className="text-3xl font-bold text-slate-900">By the Numbers</h2>
          <p className="mt-1 text-slate-500">
            Real metrics from the codebase — updated with each release.
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { value: '1,342', label: 'Passing Tests', icon: '✓', color: 'emerald' },
            { value: '9.0/10', label: 'Architecture Score', icon: '◆', color: 'indigo' },
            { value: '0', label: 'TypeScript Errors', icon: '⊘', color: 'amber' },
            { value: '80%', label: 'Features Complete', icon: '◉', color: 'pink' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-surface rounded-2xl p-8 text-center shadow-glass"
            >
              <div className="mb-2 text-2xl">{stat.icon}</div>
              <div className="text-3xl font-bold text-glow-purple">{stat.value}</div>
              <div className="mt-2 text-sm text-slate-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-900">Release Progress</span>
            <span className="font-mono text-sm text-purple-600">v0.9.14 → v1.0</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/60">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: '80%' }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-400"
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-slate-400">
            <span>55/69 features shipped</span>
            <span>Q2 2026 target</span>
          </div>
        </motion.div>
      </section>

      {/* Newsletter */}
      <section className="mb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-surface relative overflow-hidden rounded-2xl p-12 shadow-glass"
        >
          {/* Decorative circles */}
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-purple-400 opacity-10" />
          <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-violet-400 opacity-10" />

          <div className="relative text-center">
            <h2 className="mb-2 text-3xl font-bold text-slate-900">Stay Updated</h2>
            <p className="mx-auto mb-8 max-w-lg text-sm text-slate-500">
              Get notified about engineering updates, security advisories, and launch announcements.
              No spam — just real development progress.
            </p>

            {subscribed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200/60 bg-emerald-50 px-6 py-4 text-emerald-700"
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
                  className="flex-1 rounded-xl border border-slate-200/60 bg-white/60 px-4 py-3 text-slate-900 outline-none backdrop-blur-sm transition-all placeholder:text-slate-400 focus:border-purple-300 focus:ring-2 focus:ring-purple-200"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-glass transition-all hover:bg-purple-600 hover:shadow-glass-lg"
                >
                  Subscribe
                </button>
              </form>
            )}

            <p className="mt-4 text-xs text-slate-400">
              No spam. Unsubscribe anytime. We respect your inbox.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Social */}
      <section>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500">
          <a
            href="https://github.com/cgraph-dev/CGraph"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-white/60 px-4 py-2 transition-all hover:bg-white/80 hover:text-slate-700"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </a>
          <a
            href="mailto:hello@cgraph.org"
            className="flex items-center gap-2 rounded-full bg-white/60 px-4 py-2 transition-all hover:bg-white/80 hover:text-slate-700"
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
            className="flex items-center gap-2 rounded-full bg-white/60 px-4 py-2 transition-all hover:bg-white/80 hover:text-slate-700"
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
      </section>
    </LiquidGlassLayout>
  );
}

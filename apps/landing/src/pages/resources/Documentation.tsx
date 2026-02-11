/**
 * Documentation Page - Developer documentation hub
 *
 * @since v0.9.2
 * @updated v0.9.6 - Migrated to MarketingLayout for consistent styling
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
    description: 'Quick start guides and tutorials to get you up and running.',
    articles: [
      { title: 'Quick Start Guide', time: '5 min read', href: '#' },
      { title: 'Creating Your First Chat', time: '3 min read', href: '#' },
      { title: 'Understanding End-to-End Encryption', time: '8 min read', href: '#' },
      { title: 'Account Security Best Practices', time: '6 min read', href: '#' },
    ],
  },
  {
    id: 'api-reference',
    icon: '📚',
    title: 'API Reference',
    description: 'Complete API documentation for developers.',
    articles: [
      { title: 'Authentication API', time: '10 min read', href: '#' },
      { title: 'Messages API', time: '12 min read', href: '#' },
      { title: 'Channels API', time: '8 min read', href: '#' },
      { title: 'WebSocket Events', time: '15 min read', href: '#' },
    ],
  },
  {
    id: 'integration',
    icon: '🔌',
    title: 'Integration Guides',
    description: 'Learn how to integrate CGraph with your applications.',
    articles: [
      { title: 'Bot Development Guide', time: '20 min read', href: '#' },
      { title: 'Webhook Integration', time: '10 min read', href: '#' },
      { title: 'OAuth2 Implementation', time: '12 min read', href: '#' },
      { title: 'Custom Themes & Plugins', time: '15 min read', href: '#' },
    ],
  },
  {
    id: 'security',
    icon: '🔐',
    title: 'Security',
    description: 'Deep dives into our security architecture.',
    articles: [
      { title: 'E2E Encryption Technical Overview', time: '25 min read', href: '#' },
      { title: 'Key Management', time: '15 min read', href: '#' },
      { title: 'Security Audit Reports', time: '10 min read', href: '#' },
      { title: 'Reporting Vulnerabilities', time: '5 min read', href: '#' },
    ],
  },
];

const popularArticles = [
  { title: 'Quick Start Guide', category: 'Getting Started', views: '12.5K' },
  { title: 'E2E Encryption Technical Overview', category: 'Security', views: '8.2K' },
  { title: 'Bot Development Guide', category: 'Integration', views: '6.8K' },
  { title: 'WebSocket Events', category: 'API Reference', views: '5.4K' },
];

const sdks = [
  { name: 'JavaScript/TypeScript', icon: '🟨', version: '2.0.1', href: '#' },
  { name: 'Python', icon: '🐍', version: '1.8.0', href: '#' },
  { name: 'Go', icon: '🔵', version: '1.5.2', href: '#' },
  { name: 'Rust', icon: '🦀', version: '0.9.0', href: '#' },
];

export default function Documentation() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredCategories = docCategories.filter(
    (cat) =>
      cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.articles.some((a) => a.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <MarketingLayout
      title="Learn How to Build with CGraph"
      subtitle="Comprehensive guides, API references, and examples to help you build secure, private communication into your applications."
      eyebrow="📖 Documentation"
      showCTA
    >
      {/* Search Bar */}
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
            <div className="absolute inset-y-0 right-4 flex items-center">
              <kbd
                className="rounded bg-white/10 px-2 py-1 text-xs"
                style={{ color: 'var(--color-gray)' }}
              >
                ⌘K
              </kbd>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Links */}
      <section
        className="marketing-section marketing-section--dark"
        style={{ paddingTop: '2rem', paddingBottom: '2rem' }}
      >
        <div className="marketing-section__container">
          <div className="flex flex-wrap items-center justify-center gap-4">
            {['Quick Start', 'API Reference', 'SDKs', 'Examples', 'Community'].map(
              (link, index) => (
                <motion.a
                  key={link}
                  href="#"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.05 }}
                  className="marketing-btn marketing-btn--secondary"
                  style={{ fontSize: '0.875rem' }}
                >
                  {link}
                </motion.a>
              )
            )}
          </div>
        </div>
      </section>

      {/* Documentation Categories */}
      <section className="marketing-section marketing-section--alt">
        <div className="marketing-section__container">
          <div className="marketing-grid marketing-grid--2">
            {filteredCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="marketing-card"
                style={{ padding: '2rem' }}
              >
                <div className="mb-4 flex items-center gap-4">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl"
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
                <p className="mb-6" style={{ color: 'var(--color-gray)' }}>
                  {category.description}
                </p>
                <div className="space-y-3">
                  {category.articles.slice(0, 3).map((article) => (
                    <a
                      key={article.title}
                      href={article.href}
                      className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3 transition-all hover:border-emerald-500/20 hover:bg-white/10"
                    >
                      <span className="text-sm text-white">{article.title}</span>
                      <span className="text-xs" style={{ color: 'var(--color-gray)' }}>
                        {article.time}
                      </span>
                    </a>
                  ))}
                </div>
                <button
                  onClick={() =>
                    setSelectedCategory(selectedCategory === category.id ? null : category.id)
                  }
                  className="mt-4 text-sm font-medium transition-colors hover:text-emerald-300"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {selectedCategory === category.id ? 'Show less' : 'View all articles →'}
                </button>

                <AnimatePresence>
                  {selectedCategory === category.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-3">
                        {category.articles.slice(3).map((article) => (
                          <a
                            key={article.title}
                            href={article.href}
                            className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3 transition-all hover:border-emerald-500/20 hover:bg-white/10"
                          >
                            <span className="text-sm text-white">{article.title}</span>
                            <span className="text-xs" style={{ color: 'var(--color-gray)' }}>
                              {article.time}
                            </span>
                          </a>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SDKs & Libraries */}
      <section className="marketing-section marketing-section--dark">
        <div className="marketing-section__container">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title font-zentry">Official SDKs</h2>
              <p className="marketing-section__desc">
                Client libraries for popular programming languages to get you started quickly.
              </p>
            </motion.div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {sdks.map((sdk, index) => (
              <motion.a
                key={sdk.name}
                href={sdk.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
                className="marketing-card group"
                style={{ textDecoration: 'none' }}
              >
                <div className="mb-4 text-4xl">{sdk.icon}</div>
                <h3 className="mb-1 font-semibold text-white">{sdk.name}</h3>
                <p className="text-sm" style={{ color: 'var(--color-gray)' }}>
                  v{sdk.version}
                </p>
                <div
                  className="mt-4 flex items-center text-sm opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ color: 'var(--color-primary)' }}
                >
                  View docs →
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="marketing-section marketing-section--alt">
        <div className="mx-auto max-w-4xl px-4">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title font-zentry">Popular Articles</h2>
              <p className="marketing-section__desc">Most read articles from our documentation.</p>
            </motion.div>
          </div>

          <div className="space-y-4">
            {popularArticles.map((article, index) => (
              <motion.a
                key={article.title}
                href="#"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ x: 8 }}
                className="marketing-card flex items-center justify-between"
                style={{ textDecoration: 'none' }}
              >
                <div className="flex items-center gap-4">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(139, 92, 246, 0.3))',
                    }}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-medium text-white">{article.title}</h3>
                    <p className="text-sm" style={{ color: 'var(--color-gray)' }}>
                      {article.category}
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-center gap-2 text-sm"
                  style={{ color: 'var(--color-gray)' }}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  {article.views}
                </div>
              </motion.a>
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
            <h2 className="mb-4 font-zentry text-3xl font-bold text-white">Need Help?</h2>
            <p className="mx-auto mb-8 max-w-xl" style={{ color: 'var(--color-gray)' }}>
              Can't find what you're looking for? Our community and support team are here to help.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="#" className="marketing-btn marketing-btn--primary">
                Join Discord
              </a>
              <Link to="/contact" className="marketing-btn marketing-btn--secondary">
                Contact Support
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
}

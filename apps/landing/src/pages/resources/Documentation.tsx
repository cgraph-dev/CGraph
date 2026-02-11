/**
 * Documentation Page - Developer documentation hub
 *
 * @since v0.9.2
 * @updated v0.9.6 - Migrated to MarketingLayout for consistent styling
 * @updated v0.9.14 - Removed fake SDKs, fake view counts; reflects actual project state
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
    description: 'Learn the basics of CGraph and get up and running quickly.',
    articles: [
      { title: 'What is CGraph?', time: '3 min read', href: '#' },
      { title: 'Creating Your Account', time: '2 min read', href: '#' },
      { title: 'Your First Server & Channel', time: '5 min read', href: '#' },
      { title: 'Understanding End-to-End Encryption', time: '8 min read', href: '#' },
    ],
  },
  {
    id: 'features',
    icon: '⚡',
    title: 'Features Guide',
    description: 'Explore everything CGraph has to offer.',
    articles: [
      { title: 'Real-Time Messaging', time: '5 min read', href: '#' },
      { title: 'Community Forums', time: '7 min read', href: '#' },
      { title: 'Voice & Video Calls', time: '6 min read', href: '#' },
      { title: 'Gamification & Rewards', time: '8 min read', href: '#' },
    ],
  },
  {
    id: 'security',
    icon: '🔐',
    title: 'Security & Privacy',
    description: 'How CGraph protects your data and conversations.',
    articles: [
      { title: 'E2EE Technical Overview (X3DH + Double Ratchet)', time: '15 min read', href: '#' },
      { title: 'Key Management & Device Verification', time: '10 min read', href: '#' },
      { title: 'Data Privacy & GDPR', time: '8 min read', href: '#' },
      { title: 'Reporting Vulnerabilities', time: '3 min read', href: '#' },
    ],
  },
  {
    id: 'api-reference',
    icon: '📚',
    title: 'API Reference',
    description: 'API documentation for developers building on CGraph.',
    articles: [
      { title: 'Authentication (OAuth)', time: '10 min read', href: '#' },
      { title: 'Messages API', time: '12 min read', href: '#' },
      { title: 'Channels & Servers API', time: '8 min read', href: '#' },
      { title: 'WebSocket Events', time: '15 min read', href: '#' },
    ],
  },
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
      title="Documentation"
      subtitle="Guides, references, and examples to help you get the most out of CGraph."
      eyebrow="📖 Docs"
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
          </motion.div>
        </div>
      </section>

      {/* Notice */}
      <section
        className="marketing-section marketing-section--dark"
        style={{ paddingTop: '1rem', paddingBottom: '1rem' }}
      >
        <div className="mx-auto max-w-3xl px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-center text-sm"
            style={{ color: '#eab308' }}
          >
            📝 Documentation is actively being written alongside the platform. Full docs will be
            available with the v1.0 public beta launch.
          </motion.div>
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
                    <div
                      key={article.title}
                      className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3"
                    >
                      <span className="text-sm text-white">{article.title}</span>
                      <span className="text-xs" style={{ color: 'var(--color-gray)' }}>
                        {article.time}
                      </span>
                    </div>
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
                          <div
                            key={article.title}
                            className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3"
                          >
                            <span className="text-sm text-white">{article.title}</span>
                            <span className="text-xs" style={{ color: 'var(--color-gray)' }}>
                              {article.time}
                            </span>
                          </div>
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

      {/* Tech Stack */}
      <section className="marketing-section marketing-section--dark">
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

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'Elixir / Phoenix', icon: '💜', desc: 'Backend API & WebSockets' },
              { name: 'PostgreSQL', icon: '🐘', desc: 'Database (91 tables)' },
              { name: 'React 19 / Vite', icon: '⚛️', desc: 'Web frontend' },
              { name: 'React Native / Expo', icon: '📱', desc: 'Mobile app (iOS & Android)' },
              { name: 'Signal Protocol', icon: '🔐', desc: 'E2EE (X3DH + Double Ratchet)' },
              { name: 'Fly.io / Vercel', icon: '☁️', desc: 'Hosting & deployment' },
            ].map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="marketing-card"
              >
                <div className="mb-4 text-4xl">{tech.icon}</div>
                <h3 className="mb-1 font-semibold text-white">{tech.name}</h3>
                <p className="text-sm" style={{ color: 'var(--color-gray)' }}>
                  {tech.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Need Help CTA */}
      <section className="marketing-section marketing-section--alt">
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
              Can't find what you're looking for? We're here to help.
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
                Contact Support
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
}

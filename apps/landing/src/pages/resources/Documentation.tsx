/**
 * Documentation Page - Developer documentation hub
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Navigation } from '../../components/Navigation';
import { LogoIcon } from '../../components/Logo';

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
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navigation transparent />

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pb-16 pt-32 sm:px-6 lg:px-8">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity, delay: 4 }}
            className="absolute right-1/4 top-1/3 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl"
          />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-400"
          >
            📖 Documentation
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 text-4xl font-bold text-white md:text-6xl"
          >
            Learn How to Build with
            <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              CGraph
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto mb-8 max-w-2xl text-xl text-gray-400"
          >
            Comprehensive guides, API references, and examples to help you build secure, private
            communication into your applications.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative mx-auto max-w-xl"
          >
            <div className="absolute inset-y-0 left-4 flex items-center">
              <svg
                className="h-5 w-5 text-gray-400"
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
              className="w-full rounded-xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-white placeholder-gray-500 backdrop-blur-sm transition-all focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            <div className="absolute inset-y-0 right-4 flex items-center">
              <kbd className="rounded bg-white/10 px-2 py-1 text-xs text-gray-400">⌘K</kbd>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="border-y border-white/5 bg-white/[0.02] py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 transition-all hover:border-purple-500/30 hover:bg-white/10 hover:text-white"
                >
                  {link}
                </motion.a>
              )
            )}
          </div>
        </div>
      </section>

      {/* Documentation Categories */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-2">
            {filteredCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group rounded-2xl border border-white/10 bg-white/5 p-8 transition-all hover:border-purple-500/30 hover:bg-white/10"
              >
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-2xl transition-transform group-hover:scale-110">
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{category.title}</h3>
                    <p className="text-sm text-gray-400">{category.articles.length} articles</p>
                  </div>
                </div>
                <p className="mb-6 text-gray-400">{category.description}</p>
                <div className="space-y-3">
                  {category.articles.slice(0, 3).map((article) => (
                    <a
                      key={article.title}
                      href={article.href}
                      className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3 transition-all hover:border-purple-500/20 hover:bg-white/10"
                    >
                      <span className="text-sm text-white">{article.title}</span>
                      <span className="text-xs text-gray-500">{article.time}</span>
                    </a>
                  ))}
                </div>
                <button
                  onClick={() =>
                    setSelectedCategory(selectedCategory === category.id ? null : category.id)
                  }
                  className="mt-4 text-sm font-medium text-purple-400 transition-colors hover:text-purple-300"
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
                            className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3 transition-all hover:border-purple-500/20 hover:bg-white/10"
                          >
                            <span className="text-sm text-white">{article.title}</span>
                            <span className="text-xs text-gray-500">{article.time}</span>
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
      <section className="bg-white/[0.02] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">Official SDKs</h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-400">
              Client libraries for popular programming languages to get you started quickly.
            </p>
          </motion.div>

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
                className="group rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:border-purple-500/30"
              >
                <div className="mb-4 text-4xl">{sdk.icon}</div>
                <h3 className="mb-1 font-semibold text-white">{sdk.name}</h3>
                <p className="text-sm text-gray-400">v{sdk.version}</p>
                <div className="mt-4 flex items-center text-sm text-purple-400 opacity-0 transition-opacity group-hover:opacity-100">
                  View docs →
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-white">Popular Articles</h2>
            <p className="text-lg text-gray-400">Most read articles from our documentation.</p>
          </motion.div>

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
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:border-purple-500/30 hover:bg-white/10"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-lg font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-medium text-white">{article.title}</h3>
                    <p className="text-sm text-gray-400">{article.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
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

      {/* CTA */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-12 text-center"
          >
            <div className="relative">
              <h2 className="mb-4 text-3xl font-bold text-white">Need Help?</h2>
              <p className="mx-auto mb-8 max-w-xl text-gray-300">
                Can't find what you're looking for? Our community and support team are here to help.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href="#"
                  className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 font-semibold text-white transition-all hover:shadow-lg hover:shadow-purple-500/25"
                >
                  Join Discord
                </a>
                <Link
                  to="/contact"
                  className="rounded-xl border border-white/20 bg-white/5 px-8 py-4 font-semibold text-white transition-all hover:bg-white/10"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <LogoIcon size={24} color="white" />
              <span className="font-semibold text-white">CGraph</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <Link to="/about" className="transition-colors hover:text-white">
                About
              </Link>
              <Link to="/privacy" className="transition-colors hover:text-white">
                Privacy
              </Link>
              <Link to="/terms" className="transition-colors hover:text-white">
                Terms
              </Link>
              <Link to="/contact" className="transition-colors hover:text-white">
                Contact
              </Link>
            </div>
            <div className="text-sm text-gray-500">© 2026 CGraph. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

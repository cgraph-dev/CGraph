/**
 * Blog Page - Company blog and updates
 *
 * @since v0.9.2
 * @updated v0.9.6 - Migrated to MarketingLayout for consistent styling
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MarketingLayout } from '@/components/marketing';

const categories = ['All', 'Product', 'Engineering', 'Security', 'Company'];

const blogPosts = [
  {
    id: 1,
    title: 'Introducing CGraph Enterprise: Secure Communication for Teams',
    excerpt:
      "Today we're launching CGraph Enterprise, bringing end-to-end encrypted messaging to businesses with advanced admin controls and compliance features.",
    category: 'Product',
    author: 'CGraph Team',
    date: 'January 28, 2026',
    readTime: '5 min read',
    featured: true,
    image: '🏢',
  },
  {
    id: 2,
    title: 'How We Built Our Real-Time Messaging Infrastructure',
    excerpt:
      "A deep dive into the architecture behind CGraph's real-time messaging system, handling thousands of concurrent connections with sub-100ms latency.",
    category: 'Engineering',
    author: 'Engineering Team',
    date: 'January 20, 2026',
    readTime: '12 min read',
    featured: true,
    image: '⚡',
  },
  {
    id: 3,
    title: 'Security Audit Results: Q4 2025',
    excerpt:
      "We recently completed our quarterly security audit with an independent firm. Here's what they found and how we're continuously improving our security posture.",
    category: 'Security',
    author: 'Security Team',
    date: 'January 15, 2026',
    readTime: '8 min read',
    featured: false,
    image: '🔒',
  },
  {
    id: 4,
    title: 'The Journey to 50,000 Users',
    excerpt:
      "Reflecting on our growth from a small beta to 50,000 active users. The challenges, learnings, and what's next for CGraph.",
    category: 'Company',
    author: 'CGraph Team',
    date: 'January 10, 2026',
    readTime: '6 min read',
    featured: false,
    image: '🎉',
  },
  {
    id: 5,
    title: 'Introducing Message Reactions and Threads',
    excerpt:
      "Based on community feedback, we're rolling out message reactions and threaded conversations to help you organize your chats better.",
    category: 'Product',
    author: 'Product Team',
    date: 'January 5, 2026',
    readTime: '4 min read',
    featured: false,
    image: '💬',
  },
  {
    id: 6,
    title: 'Understanding Our End-to-End Encryption',
    excerpt:
      'A technical overview of how CGraph implements end-to-end encryption, from key exchange to message delivery.',
    category: 'Security',
    author: 'Security Team',
    date: 'December 28, 2025',
    readTime: '15 min read',
    featured: false,
    image: '🔐',
  },
  {
    id: 7,
    title: 'Mobile App Performance Improvements',
    excerpt:
      'How we reduced app startup time by 60% and improved battery life with our latest mobile updates.',
    category: 'Engineering',
    author: 'Mobile Team',
    date: 'December 20, 2025',
    readTime: '10 min read',
    featured: false,
    image: '📱',
  },
  {
    id: 8,
    title: 'Building an Inclusive Remote Culture',
    excerpt:
      "As a fully remote company, here's how we build connection and maintain a strong culture across time zones.",
    category: 'Company',
    author: 'People Team',
    date: 'December 15, 2025',
    readTime: '7 min read',
    featured: false,
    image: '🌍',
  },
];

const newsletter = {
  subscribers: '5,000+',
  frequency: 'Weekly',
};

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const filteredPosts =
    selectedCategory === 'All'
      ? blogPosts
      : blogPosts.filter((post) => post.category === selectedCategory);

  const featuredPosts = blogPosts.filter((post) => post.featured);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
    setTimeout(() => setSubscribed(false), 3000);
    setEmail('');
  };

  return (
    <MarketingLayout
      title="Stories, Updates & Behind the Scenes"
      subtitle="Product updates, engineering insights, security deep dives, and the story of building CGraph."
      eyebrow="📝 CGraph Blog"
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
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Posts */}
      {selectedCategory === 'All' && (
        <section className="marketing-section marketing-section--dark">
          <div className="marketing-section__container">
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-8 text-sm font-semibold uppercase tracking-wider"
              style={{ color: 'var(--color-gray)' }}
            >
              Featured
            </motion.h2>
            <div className="marketing-grid marketing-grid--2">
              {featuredPosts.map((post, index) => (
                <motion.a
                  key={post.id}
                  href="#"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="marketing-card group"
                  style={{ textDecoration: 'none', padding: '2rem' }}
                >
                  <div className="mb-6 text-6xl">{post.image}</div>
                  <div className="mb-3 flex items-center gap-3">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-medium"
                      style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      {post.category}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--color-gray)' }}>
                      {post.date}
                    </span>
                  </div>
                  <h3 className="mb-3 text-2xl font-bold text-white transition-colors group-hover:text-emerald-300">
                    {post.title}
                  </h3>
                  <p style={{ color: 'var(--color-gray)' }}>{post.excerpt}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'var(--color-gray)' }}>
                      {post.author}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--color-gray)' }}>
                      {post.readTime}
                    </span>
                  </div>
                </motion.a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Posts */}
      <section className="marketing-section marketing-section--alt">
        <div className="marketing-section__container">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-8 text-sm font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-gray)' }}
          >
            {selectedCategory === 'All' ? 'All Posts' : selectedCategory}
          </motion.h2>
          <div className="marketing-grid marketing-grid--3">
            {filteredPosts
              .filter((p) => !p.featured || selectedCategory !== 'All')
              .map((post, index) => (
                <motion.a
                  key={post.id}
                  href="#"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -4 }}
                  className="marketing-card group"
                  style={{ textDecoration: 'none' }}
                >
                  <div className="mb-4 text-4xl">{post.image}</div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-300">
                      {post.category}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-gray)' }}>
                      {post.date}
                    </span>
                  </div>
                  <h3 className="mb-2 font-semibold text-white transition-colors group-hover:text-emerald-300">
                    {post.title}
                  </h3>
                  <p className="mb-4 line-clamp-2 text-sm" style={{ color: 'var(--color-gray)' }}>
                    {post.excerpt}
                  </p>
                  <div
                    className="flex items-center justify-between text-xs"
                    style={{ color: 'var(--color-gray)' }}
                  >
                    <span>{post.author}</span>
                    <span>{post.readTime}</span>
                  </div>
                </motion.a>
              ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <button className="marketing-btn marketing-btn--secondary">Load More Posts</button>
          </motion.div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="marketing-section marketing-section--dark">
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
            <h2 className="mb-4 font-zentry text-3xl font-bold text-white">Stay in the Loop</h2>
            <p className="mx-auto mb-8 max-w-xl" style={{ color: 'var(--color-gray)' }}>
              Get the latest updates, product news, and engineering insights delivered to your
              inbox. Join {newsletter.subscribers} subscribers.
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
              {newsletter.frequency} digest. Unsubscribe anytime.
            </p>
          </motion.div>
        </div>
      </section>

      {/* RSS & Social */}
      <section
        className="marketing-section marketing-section--alt"
        style={{ padding: '3rem 2rem' }}
      >
        <div className="mx-auto max-w-4xl">
          <div
            className="flex flex-wrap items-center justify-center gap-6 text-sm"
            style={{ color: 'var(--color-gray)' }}
          >
            <a href="#" className="flex items-center gap-2 transition-colors hover:text-white">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.18 15.64a2.18 2.18 0 01-2.18 2.18 2.18 2.18 0 01-2.18-2.18 2.18 2.18 0 012.18-2.18 2.18 2.18 0 012.18 2.18zM4 10.41v2.28c2.51 0 4.55 2.04 4.55 4.55h2.28c0-3.77-3.06-6.83-6.83-6.83zm0-4.55v2.28c5.03 0 9.12 4.09 9.12 9.12h2.28c0-6.29-5.11-11.4-11.4-11.4z" />
              </svg>
              RSS Feed
            </a>
            <a
              href="https://twitter.com/cgraph"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 transition-colors hover:text-white"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Follow on X
            </a>
            <a
              href="https://github.com/cgraph"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 transition-colors hover:text-white"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

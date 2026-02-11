/**
 * Blog Page - Company blog and updates
 *
 * @since v0.9.2
 * @updated v0.9.6 - Migrated to MarketingLayout for consistent styling
 * @updated v0.9.14 - Removed fake blog posts; reflects actual project state
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MarketingLayout } from '@/components/marketing';

const blogPosts = [
  {
    id: 1,
    title: 'Introducing CGraph: Privacy-First Communication for Communities',
    excerpt:
      "We're building CGraph — a platform that combines real-time messaging, community forums, gamification, and end-to-end encryption. Here's our vision and what we're building.",
    category: 'Product',
    author: 'Burca Lucas',
    date: 'January 2026',
    readTime: '5 min read',
    featured: true,
    image: '🚀',
  },
  {
    id: 2,
    title: 'Building with Elixir, Phoenix, and the Signal Protocol',
    excerpt:
      'A look at our tech stack choices: why we chose Elixir/Phoenix for the backend, React 19 for the web, and how we implemented E2EE using the X3DH + Double Ratchet protocol.',
    category: 'Engineering',
    author: 'Burca Lucas',
    date: 'February 2026',
    readTime: '10 min read',
    featured: true,
    image: '⚙️',
  },
];

const categories = ['All', 'Product', 'Engineering'];

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const filteredPosts =
    selectedCategory === 'All'
      ? blogPosts
      : blogPosts.filter((post) => post.category === selectedCategory);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
    setTimeout(() => setSubscribed(false), 3000);
    setEmail('');
  };

  return (
    <MarketingLayout
      title="Stories, Updates & Behind the Scenes"
      subtitle="Product updates, engineering insights, and the story of building CGraph."
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

      {/* Posts */}
      <section className="marketing-section marketing-section--dark">
        <div className="marketing-section__container">
          <div className="marketing-grid marketing-grid--2">
            {filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="marketing-card group"
                style={{ padding: '2rem' }}
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
                <h3 className="mb-3 text-2xl font-bold text-white">{post.title}</h3>
                <p style={{ color: 'var(--color-gray)' }}>{post.excerpt}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--color-gray)' }}>
                    {post.author}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--color-gray)' }}>
                    {post.readTime}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-12 text-center text-sm"
            style={{ color: 'var(--color-gray)' }}
          >
            More posts coming as we build toward our v1.0 public beta launch.
          </motion.p>
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
            <h2 className="mb-4 font-zentry text-3xl font-bold text-white">Stay in the Loop</h2>
            <p className="mx-auto mb-8 max-w-xl" style={{ color: 'var(--color-gray)' }}>
              Get notified about product updates, engineering insights, and launch announcements.
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
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

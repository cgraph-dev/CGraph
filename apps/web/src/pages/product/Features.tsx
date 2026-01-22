/**
 * Features Page
 *
 * Detailed overview of CGraph features and capabilities.
 *
 * @since v0.9.3
 */

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MarketingLayout } from '@/components/marketing';

const featureCategories = [
  {
    title: 'Real-Time Messaging',
    icon: '💬',
    features: [
      {
        name: 'Instant Delivery',
        description: 'Sub-200ms message delivery with WebSocket technology',
        icon: '⚡',
      },
      {
        name: 'Rich Media',
        description: 'Share images, videos, files, and embeds seamlessly',
        icon: '🖼️',
      },
      {
        name: 'Reactions & Replies',
        description: 'React with emojis and reply to specific messages',
        icon: '👍',
      },
      {
        name: 'Typing Indicators',
        description: 'See when others are composing a message',
        icon: '✍️',
      },
    ],
  },
  {
    title: 'Community Forums',
    icon: '🏛️',
    features: [
      {
        name: 'Threaded Discussions',
        description: 'Organized conversations with nested replies',
        icon: '🧵',
      },
      {
        name: 'Categories & Tags',
        description: 'Organize content with flexible categorization',
        icon: '🏷️',
      },
      {
        name: 'Rich Text Editor',
        description: 'Markdown support with live preview',
        icon: '📝',
      },
      {
        name: 'Moderation Tools',
        description: 'Comprehensive tools to keep your community safe',
        icon: '🛡️',
      },
    ],
  },
  {
    title: 'Customization',
    icon: '🎨',
    features: [
      {
        name: 'Custom Themes',
        description: 'Create and apply unlimited custom themes',
        icon: '🎭',
      },
      {
        name: 'Avatar Builder',
        description: 'Personalize your identity with animated avatars',
        icon: '👤',
      },
      {
        name: 'Profile Badges',
        description: 'Showcase achievements with collectible badges',
        icon: '🏅',
      },
      {
        name: 'Custom CSS',
        description: 'Full CSS customization for power users',
        icon: '💻',
      },
    ],
  },
  {
    title: 'Gamification',
    icon: '🎮',
    features: [
      {
        name: 'XP & Levels',
        description: 'Earn experience points and level up',
        icon: '📈',
      },
      {
        name: 'Achievements',
        description: 'Unlock achievements for various activities',
        icon: '🏆',
      },
      {
        name: 'Leaderboards',
        description: 'Compete on weekly and all-time leaderboards',
        icon: '📊',
      },
      {
        name: 'Daily Rewards',
        description: 'Login streaks and daily bonus rewards',
        icon: '🎁',
      },
    ],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Features() {
  return (
    <MarketingLayout
      title="Features"
      subtitle="Everything you need to build and grow your community"
      eyebrow="Product"
      showCTA
    >
      {/* Feature Categories */}
      {featureCategories.map((category, categoryIndex) => (
        <section
          key={category.title}
          className={`marketing-section ${categoryIndex % 2 === 1 ? 'marketing-section--alt' : ''}`}
        >
          <div className="marketing-section__container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12 text-center"
            >
              <span className="text-5xl">{category.icon}</span>
              <h2 className="marketing-section__title font-zentry mt-4">{category.title}</h2>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
            >
              {category.features.map((feature) => (
                <motion.div
                  key={feature.name}
                  variants={itemVariants}
                  className="rounded-xl border p-6 text-center transition-all hover:border-primary-500/50 hover:shadow-lg"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <span className="text-3xl">{feature.icon}</span>
                  <h3 className="mt-3 text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                    {feature.name}
                  </h3>
                  <p className="mt-2 text-sm" style={{ color: 'var(--color-gray)' }}>
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      ))}

      {/* CTA Section */}
      <section className="marketing-section">
        <div className="marketing-section__container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="marketing-section__title font-zentry">Ready to get started?</h2>
            <p className="mt-4 text-lg" style={{ color: 'var(--color-gray)' }}>
              Join thousands of communities already using CGraph.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="rounded-lg bg-primary-500 px-8 py-3 font-semibold text-white transition-all hover:bg-primary-600 hover:shadow-lg"
              >
                Create Account
              </Link>
              <Link
                to="/pricing"
                className="rounded-lg border px-8 py-3 font-semibold transition-all hover:bg-white/5"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                View Pricing
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
}

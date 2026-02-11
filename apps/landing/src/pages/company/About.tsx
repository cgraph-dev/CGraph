/**
 * About Page
 *
 * Company information, mission, values, and team.
 *
 * @since v0.9.2
 */

import { motion } from 'framer-motion';
const springs = { bouncy: { type: 'spring' as const, stiffness: 300, damping: 10 } };
import { MarketingLayout } from '@/components/marketing';

const values = [
  {
    icon: '🎨',
    title: 'Full Customization',
    description:
      'Every aspect of your community is customizable. Themes, layouts, features—make it truly yours.',
  },
  {
    icon: '🌐',
    title: 'Open Community',
    description:
      'Build thriving communities with forums, real-time messaging, and engaging gamification features.',
  },
  {
    icon: '🤝',
    title: 'User Freedom',
    description:
      'Your data belongs to you. Export it, customize it, or take it elsewhere. We empower users.',
  },
  {
    icon: '⚡',
    title: 'Performance',
    description:
      'Lightning-fast experience. We optimize relentlessly to deliver real-time messaging with sub-200ms latency.',
  },
  {
    icon: '🎮',
    title: 'Gamification',
    description:
      'Earn rewards, unlock achievements, and climb leaderboards. Every interaction is meaningful.',
  },
  {
    icon: '🌍',
    title: 'Accessibility',
    description:
      'Everyone deserves great communication tools. We follow WCAG guidelines and support all users.',
  },
];

const team = [
  {
    name: 'Burca Lucas',
    role: 'Founder & Developer',
    bio: 'Full-stack developer passionate about privacy and secure communication. Building CGraph from Georgia.',
    avatar: 'BL',
  },
];

const milestones = [
  {
    year: 'Q1 2026',
    event: 'CGraph founded with mission to build privacy-first messaging',
    completed: true,
  },
  {
    year: 'Q2 2026',
    event: 'Core encryption, real-time messaging, and OAuth integration development',
    completed: false,
  },
  {
    year: 'Q3 2026',
    event: 'Forums, gamification, and community features launch',
    completed: false,
  },
];

export default function About() {
  return (
    <MarketingLayout
      title="About CGraph"
      subtitle="Real-time messaging meets community forums — with powerful customization"
      eyebrow="Our Story"
      showCTA
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
            <h2 className="marketing-section__title font-zentry">Our Mission</h2>
            <p className="text-xl" style={{ color: 'var(--color-gray)' }}>
              CGraph was founded on a simple belief:{' '}
              <span className="marketing-hero__highlight">
                communities deserve freedom to customize
              </span>
              . We're building the all-in-one platform that combines real-time messaging,
              Reddit-style community forums, end-to-end encryption, and gamification rewards—making
              every interaction count.
            </p>
          </motion.div>
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
              <h2 className="marketing-section__title font-zentry">Our Values</h2>
              <p className="marketing-section__desc">
                The principles that guide everything we build
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
                transition={{ delay: index * 0.1 }}
                className="marketing-card"
              >
                <span className="marketing-card__icon">{value.icon}</span>
                <h3 className="marketing-card__title">{value.title}</h3>
                <p className="marketing-card__desc">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="marketing-section marketing-section--alt">
        <div className="marketing-section__container">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title font-zentry">Meet the Founder</h2>
              <p className="marketing-section__desc">
                Building CGraph from Georgia with a passion for privacy and secure communication
              </p>
            </motion.div>
          </div>

          <div className="mx-auto max-w-md">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="marketing-card team-card"
              >
                <div className="team-card__avatar">{member.avatar}</div>
                <h3 className="team-card__name">{member.name}</h3>
                <p className="team-card__role">{member.role}</p>
                <p className="team-card__bio">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="marketing-section marketing-section--dark">
        <div className="mx-auto max-w-4xl px-4">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title font-zentry">Our Journey</h2>
              <p className="marketing-section__desc">Key milestones in our mission</p>
            </motion.div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {milestones.map((milestone, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                whileHover={{ scale: 1.03, y: -5 }}
                className="marketing-card relative overflow-hidden"
                style={{
                  borderColor: milestone.completed
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'rgba(239, 68, 68, 0.3)',
                }}
              >
                {/* Status glow effect */}
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    background: milestone.completed
                      ? 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.4), transparent 70%)'
                      : 'radial-gradient(circle at top right, rgba(239, 68, 68, 0.4), transparent 70%)',
                  }}
                />

                {/* Header with year and status */}
                <div className="relative mb-4 flex items-center justify-between">
                  <motion.span
                    className="font-mono text-lg font-bold"
                    style={{ color: milestone.completed ? 'var(--color-primary)' : '#ef4444' }}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15 + 0.2 }}
                  >
                    {milestone.year}
                  </motion.span>

                  {/* Status circle */}
                  <div className="relative flex items-center justify-center">
                    <motion.div
                      className="relative flex h-8 w-8 items-center justify-center rounded-full"
                      style={{
                        background: milestone.completed ? 'var(--color-primary)' : '#ef4444',
                        boxShadow: milestone.completed
                          ? '0 0 12px rgba(16, 185, 129, 0.5)'
                          : '0 0 12px rgba(239, 68, 68, 0.5)',
                      }}
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.15 + 0.3, ...springs.bouncy }}
                    >
                      {milestone.completed ? (
                        <motion.svg
                          className="h-4 w-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <motion.path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                            initial={{ pathLength: 0 }}
                            whileInView={{ pathLength: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.15 + 0.4, duration: 0.4 }}
                          />
                        </motion.svg>
                      ) : (
                        <motion.div
                          className="h-2.5 w-2.5 rounded-full bg-white"
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      )}
                    </motion.div>
                    {/* Pulse animation for pending items */}
                    {!milestone.completed && (
                      <motion.div
                        className="absolute h-8 w-8 rounded-full"
                        style={{ background: 'rgba(239, 68, 68, 0.4)' }}
                        animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                      />
                    )}
                  </div>
                </div>

                {/* Status label */}
                <div className="relative mb-3">
                  <span
                    className="inline-block rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                      background: milestone.completed
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)',
                      color: milestone.completed ? 'var(--color-primary)' : '#ef4444',
                    }}
                  >
                    {milestone.completed ? '✓ Completed' : '○ In Progress'}
                  </span>
                </div>

                {/* Event description */}
                <p
                  className="relative"
                  style={{ color: 'var(--color-gray)', margin: 0, lineHeight: 1.6 }}
                >
                  {milestone.event}
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
            <h2 className="marketing-section__title font-zentry">Our Vision</h2>
            <p className="marketing-section__desc mx-auto max-w-2xl">
              We're building CGraph to prove that privacy and great user experience can coexist.
              Join us on this journey to create a communication platform that respects your privacy
              while delivering the features you need.
            </p>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
}

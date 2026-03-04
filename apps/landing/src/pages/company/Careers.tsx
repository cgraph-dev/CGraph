/**
 * Careers Page
 *
 * Open positions and company culture.
 *
 * @since v0.9.2
 */

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MarketingLayout } from '@/components/marketing';
import { NeonIcon } from '@/components/marketing/ui';

const benefits: Array<{
  icon: string;
  title: string;
  description: string;
}> = [
  // Benefits will be listed when we start hiring
];

const positions: Array<{
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
}> = [
  // No open positions at this time
];

const values = [
  {
    title: 'Community First',
    description: 'We build tools that empower communities to thrive and connect.',
  },
  {
    title: 'User First',
    description: "Every decision is made with our users' best interests in mind.",
  },
  {
    title: 'Customization Freedom',
    description: 'Users shape their experience. We build flexible tools that adapt.',
  },
  {
    title: 'Continuous Learning',
    description: 'Technology evolves fast. We invest in growth and improvement.',
  },
];

export default function Careers() {
  return (
    <MarketingLayout
      title="Join Our Team"
      subtitle="Help us build the future of customizable, community-driven communication"
      eyebrow="Careers"
    >
      {/* Values Section */}
      <section className="marketing-section marketing-section--alt">
        <div className="marketing-section__container">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title">What We Believe</h2>
              <p className="marketing-section__desc">Our values guide everything we do</p>
            </motion.div>
          </div>

          <div
            className="marketing-grid marketing-grid--2"
            style={{ maxWidth: '48rem', margin: '0 auto' }}
          >
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="marketing-card"
              >
                <h3 className="marketing-card__title">{value.title}</h3>
                <p className="marketing-card__desc">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      {benefits.length > 0 && (
        <section className="marketing-section marketing-section--dark">
          <div className="marketing-section__container">
            <div className="marketing-section__header">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="marketing-section__title">Benefits & Perks</h2>
                <p className="marketing-section__desc">
                  We take care of our team so they can focus on great work
                </p>
              </motion.div>
            </div>

            <div
              className="marketing-grid marketing-grid--2"
              style={{ maxWidth: '64rem', margin: '0 auto' }}
            >
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="marketing-card"
                >
                  <span className="marketing-card__icon">
                    <NeonIcon symbol={benefit.icon} size={34} title={benefit.title} />
                  </span>
                  <h3 className="marketing-card__title">{benefit.title}</h3>
                  <p className="marketing-card__desc">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Open Positions */}
      <section className="marketing-section marketing-section--alt">
        <div className="mx-auto max-w-4xl px-4">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title">Open Positions</h2>
              <p className="marketing-section__desc">Find your next opportunity</p>
            </motion.div>
          </div>

          {positions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="marketing-card text-center"
            >
              <span className="marketing-card__icon">
                <NeonIcon symbol="🚀" size={34} title="Launch" />
              </span>
              <h3 className="marketing-card__title">We're Just Getting Started</h3>
              <p className="marketing-card__desc">
                CGraph is currently a solo project in active development. While we don't have open
                positions right now, we'd love to hear from passionate people who share our vision
                for privacy-first communication.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {positions.map((position, index) => (
                <motion.div
                  key={position.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="group rounded-xl border border-gray-800 bg-gray-900/50 p-6 transition-all hover:border-purple-500/50 hover:bg-gray-900"
                >
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{position.title}</h3>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs text-purple-400">
                          {position.department}
                        </span>
                        <span className="rounded-full bg-gray-700 px-3 py-1 text-xs text-gray-300">
                          {position.location}
                        </span>
                        <span className="rounded-full bg-gray-700 px-3 py-1 text-xs text-gray-300">
                          {position.type}
                        </span>
                      </div>
                    </div>
                    <a
                      href={`mailto:careers@cgraph.org?subject=Application: ${position.title}`}
                      className="rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-purple-500/25 transition-all hover:from-purple-600 hover:to-indigo-700 hover:shadow-purple-500/40"
                    >
                      Apply Now
                    </a>
                  </div>

                  <p className="mb-4 text-gray-400">{position.description}</p>

                  <div>
                    <h4 className="mb-2 text-sm font-medium text-gray-300">Requirements:</h4>
                    <ul className="list-inside list-disc space-y-1 text-sm text-gray-500">
                      {position.requirements.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Don't See Your Role */}
      <section className="marketing-section marketing-section--dark">
        <div className="mx-auto max-w-3xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="marketing-card text-center"
          >
            <h2 className="marketing-card__title" style={{ fontSize: '1.5rem' }}>
              Contribute to CGraph
            </h2>
            <p className="marketing-card__desc" style={{ marginBottom: '1.5rem' }}>
              CGraph is built with community in mind. While we're currently a solo project, we
              welcome contributions! Check out our GitHub, report bugs, suggest features, or help
              with documentation. Every contribution matters.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="https://github.com/cgraph-dev/CGraph"
                target="_blank"
                rel="noopener noreferrer"
                className="marketing-btn marketing-btn--primary"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                View on GitHub
              </a>
              <a
                href="mailto:careers@cgraph.org?subject=General Application"
                className="marketing-btn marketing-btn--secondary"
              >
                Send Application
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Company Links */}
      <section
        className="marketing-section marketing-section--alt"
        style={{ padding: '3rem 2rem' }}
      >
        <div className="mx-auto max-w-7xl px-4 text-center">
          <Link
            to="/about"
            className="hover:text-emerald-400"
            style={{ color: 'var(--color-gray)' }}
          >
            Learn more about CGraph →
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}

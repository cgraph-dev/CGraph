/**
 * Status Page - System status and uptime monitoring
 *
 * @since v0.9.2
 * @updated v0.9.6 - Migrated to MarketingLayout for consistent styling
 * @updated v0.9.14 - Removed fake uptime data and incidents; reflects actual project state
 */

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MarketingLayout } from '@/components/marketing';

const plannedServices = [
  { name: 'API (api.cgraph.org)', description: 'Backend API powered by Elixir/Phoenix on Fly.io' },
  { name: 'Web App (web.cgraph.org)', description: 'React 19 frontend on Vercel' },
  { name: 'Real-Time Messaging', description: 'Phoenix Channels (WebSocket)' },
  { name: 'Authentication', description: 'OAuth (Google, Apple, Facebook, TikTok)' },
  { name: 'Voice & Video', description: 'WebRTC-based calls' },
  { name: 'Media Upload', description: 'File sharing and attachments' },
];

export default function Status() {
  return (
    <MarketingLayout
      title="System Status"
      subtitle="Monitor the health and performance of CGraph services."
      eyebrow="📊 Status"
    >
      {/* Current Status */}
      <section className="marketing-section marketing-section--alt">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="marketing-card text-center"
            style={{
              padding: '3rem',
              borderColor: 'rgba(234, 179, 8, 0.3)',
              background: 'rgba(234, 179, 8, 0.05)',
            }}
          >
            <motion.div className="mx-auto mb-6 inline-flex items-center gap-3 rounded-full bg-yellow-500/10 px-6 py-3">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <span className="text-lg font-semibold text-yellow-400">Pre-Launch Development</span>
            </motion.div>

            <h2 className="mb-4 font-zentry text-2xl font-bold text-white">
              CGraph is Currently in Development
            </h2>
            <p className="mx-auto max-w-2xl" style={{ color: 'var(--color-gray)' }}>
              We're building toward our <strong className="text-white">v1.0 public beta</strong>{' '}
              targeted for <strong className="text-white">Q2 2026</strong>. A live status monitoring
              page with real-time uptime tracking will launch alongside the platform.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Planned Services */}
      <section className="marketing-section marketing-section--dark">
        <div className="mx-auto max-w-4xl px-4">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title font-zentry">Services We'll Monitor</h2>
              <p className="marketing-section__desc">
                These services will be tracked on the live status page at launch.
              </p>
            </motion.div>
          </div>

          <div className="space-y-3">
            {plannedServices.map((service, index) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
                className="marketing-card flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="h-3 w-3 rounded-full bg-gray-500" />
                  <div>
                    <span className="font-medium text-white">{service.name}</span>
                    <p className="text-sm" style={{ color: 'var(--color-gray)' }}>
                      {service.description}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-gray-500/10 px-3 py-1 text-xs font-medium text-gray-400">
                  Not yet live
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What to Expect */}
      <section className="marketing-section marketing-section--alt">
        <div className="mx-auto max-w-4xl px-4">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title font-zentry">What to Expect at Launch</h2>
              <p className="marketing-section__desc">
                Our status page will include real-time monitoring and transparency.
              </p>
            </motion.div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: '📈',
                title: 'Real-Time Uptime',
                desc: 'Live monitoring of all CGraph services with historical uptime data.',
              },
              {
                icon: '⏱️',
                title: 'Latency Metrics',
                desc: 'Response time tracking for API, WebSocket, and media services.',
              },
              {
                icon: '🔔',
                title: 'Incident Reporting',
                desc: 'Transparent incident timelines with status updates and resolution notes.',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="marketing-card"
              >
                <span className="marketing-card__icon">{feature.icon}</span>
                <h3 className="marketing-card__title">{feature.title}</h3>
                <p className="marketing-card__desc">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Infrastructure */}
      <section className="marketing-section marketing-section--dark">
        <div className="mx-auto max-w-4xl px-4">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title font-zentry">Our Infrastructure</h2>
              <p className="marketing-section__desc">Built for reliability and performance.</p>
            </motion.div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                label: 'Backend Hosting',
                value: 'Fly.io',
                desc: 'Elixir/Phoenix with auto-scaling',
              },
              { label: 'Web Hosting', value: 'Vercel', desc: 'Edge-deployed React app with CDN' },
              {
                label: 'Database',
                value: 'PostgreSQL 16',
                desc: '91 tables supporting all features',
              },
              { label: 'CDN', value: 'Cloudflare', desc: 'Global content delivery network' },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="marketing-card"
              >
                <div className="mb-2 text-xl font-bold text-white">{item.value}</div>
                <div className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
                  {item.label}
                </div>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-gray)' }}>
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe CTA */}
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
            <h2 className="mb-4 font-zentry text-2xl font-bold text-white">
              Get Notified at Launch
            </h2>
            <p className="mx-auto mb-6 max-w-xl" style={{ color: 'var(--color-gray)' }}>
              Status monitoring with email/SMS notifications will be available when CGraph launches.
              In the meantime, follow our progress on GitHub.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://github.com/cgraph-dev/CGraph"
                target="_blank"
                rel="noopener noreferrer"
                className="marketing-btn marketing-btn--primary"
              >
                Follow on GitHub
              </a>
              <Link to="/contact" className="marketing-btn marketing-btn--secondary">
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
}

/**
 * Download Page - App download options with animations
 *
 * @since v0.9.2
 * @updated v0.9.6 - Migrated to MarketingLayout for consistent styling
 * @updated v0.9.14 - Removed fake desktop apps and stats; reflects actual project state
 */

import { motion } from 'framer-motion';
import { MarketingLayout } from '@/components/marketing';
import { NeonIcon } from '@/components/marketing/ui';

const features = [
  {
    icon: '🔒',
    title: 'End-to-End Encryption',
    description:
      'Your messages are encrypted on your device using the Triple Ratchet protocol (PQXDH + ML-KEM-768).',
  },
  {
    icon: '⚡',
    title: 'Lightning Fast',
    description:
      'Built with Elixir/Phoenix for real-time messaging with sub-200ms latency via WebSockets.',
  },
  {
    icon: '🔄',
    title: 'Cross-Platform Sync',
    description:
      'Start a conversation on your phone and continue on the web — your messages sync seamlessly.',
  },
  {
    icon: '🌙',
    title: 'Dark Mode',
    description:
      "Beautiful dark theme that's easy on your eyes, with full theme customization support.",
  },
];

export default function Download() {
  return (
    <MarketingLayout
      title="Get CGraph"
      subtitle="Access CGraph on the web today, and on mobile soon. Desktop apps are on our roadmap."
      eyebrow="Get Started"
    >
      {/* Web App — Available Now */}
      <section className="marketing-section marketing-section--alt">
        <div className="marketing-section__container">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title">Web App</h2>
              <p className="marketing-section__desc">
                Use CGraph directly in your browser. No download required.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            className="marketing-card mx-auto max-w-2xl text-center"
            style={{ padding: '3rem' }}
          >
            <div className="mb-4 inline-flex">
              <NeonIcon symbol="🌐" size={56} title="Web app" />
            </div>
            <h3 className="mb-2 text-2xl font-bold text-white">CGraph for Web</h3>
            <p className="mb-2 text-sm" style={{ color: 'var(--color-gray)' }}>
              Works in Chrome, Firefox, Safari, and Edge
            </p>
            <span
              className="mb-6 inline-block rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-primary)' }}
            >
              Available Now
            </span>

            <div className="mb-6 space-y-2">
              {[
                'Full messaging & forums',
                'Voice & video calls via WebRTC',
                'End-to-end encryption',
                'Theme customization',
              ].map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center gap-2 text-sm text-gray-300"
                >
                  <svg
                    className="h-4 w-4"
                    style={{ color: 'var(--color-primary)' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {feature}
                </div>
              ))}
            </div>

            <motion.a
              href="https://web.cgraph.org"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block rounded-lg px-8 py-3 text-lg font-medium text-white"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              }}
            >
              Open Web App
            </motion.a>
          </motion.div>
        </div>
      </section>

      {/* Mobile App — Beta */}
      <section className="marketing-section marketing-section--dark">
        <div className="marketing-section__container">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title">Mobile App</h2>
              <p className="marketing-section__desc">
                CGraph for iOS and Android is currently in beta, built with React Native and Expo.
              </p>
            </motion.div>
          </div>

          <div className="mx-auto grid max-w-2xl gap-8 md:grid-cols-2">
            {[
              { name: 'iOS', icon: '📱', badge: 'Beta', note: 'Coming to App Store soon' },
              {
                name: 'Android',
                icon: '🤖',
                badge: 'Beta',
                note: 'Coming to Google Play soon',
              },
            ].map((app, index) => (
              <motion.div
                key={app.name}
                initial={{ opacity: 0, x: index === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
                className="marketing-card flex items-center gap-6"
                style={{ padding: '2rem' }}
              >
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-2xl"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(139, 92, 246, 0.2))',
                  }}
                >
                  <NeonIcon symbol={app.icon} size={40} title={app.name} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">{app.name}</h3>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#eab308' }}
                    >
                      {app.badge}
                    </span>
                  </div>
                  <p className="mt-1 text-sm" style={{ color: 'var(--color-gray)' }}>
                    {app.note}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 text-center text-sm"
            style={{ color: 'var(--color-gray)' }}
          >
            Mobile apps are in beta, built with React Native + Expo SDK 54. Public TestFlight and
            Google Play availability coming soon.
          </motion.p>
        </div>
      </section>

      {/* Desktop Apps — Roadmap */}
      <section className="marketing-section marketing-section--alt">
        <div className="marketing-section__container">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title">Desktop Apps</h2>
              <p className="marketing-section__desc">
                Native desktop apps are on our roadmap for 2027.
              </p>
            </motion.div>
          </div>

          <div className="marketing-grid marketing-grid--3">
            {[
              { name: 'macOS', icon: '🍎' },
              { name: 'Windows', icon: '🪟' },
              { name: 'Linux', icon: '🐧' },
            ].map((platform, index) => (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="marketing-card text-center"
                style={{ padding: '2rem', opacity: 0.7 }}
              >
                <div className="mb-4 inline-flex">
                  <NeonIcon symbol={platform.icon} size={44} title={platform.name} />
                </div>
                <h3 className="mb-2 text-xl font-bold text-white">{platform.name}</h3>
                <span
                  className="inline-block rounded-full px-3 py-1 text-xs font-medium"
                  style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}
                >
                  Planned · 2027
                </span>
                <p className="mt-3 text-sm" style={{ color: 'var(--color-gray)' }}>
                  In the meantime, use the web app for the full CGraph experience.
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="marketing-section marketing-section--dark">
        <div className="marketing-section__container">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title">Why Choose CGraph?</h2>
              <p className="marketing-section__desc">
                Privacy and security aren't add-ons. They're how it works.
              </p>
            </motion.div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="marketing-card"
              >
                <span className="marketing-card__icon">
                  <NeonIcon symbol={feature.icon} size={34} title={feature.title} />
                </span>
                <h3 className="marketing-card__title">{feature.title}</h3>
                <p className="marketing-card__desc">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

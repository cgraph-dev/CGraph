/**
 * Download Page - App download options with animations
 *
 * @since v0.9.2
 * @updated v0.9.6 - Migrated to shared layout for consistent styling
 * @updated v0.9.14 - Removed fake desktop apps and stats; reflects actual project state
 * @updated v0.9.16 - Migrated to Liquid Glass design system
 */

import { motion } from 'framer-motion';
import { LiquidGlassLayout } from '@/components/liquid-glass';

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
    <LiquidGlassLayout
      title="Download CGraph"
      subtitle="Available on all major platforms"
      maxWidth="max-w-5xl"
      glass={false}
    >
      {/* Web App — Available Now */}
      <section className="mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-center"
        >
          <h2 className="text-3xl font-bold text-slate-900">Web App</h2>
          <p className="mt-2 text-slate-500">
            Use CGraph directly in your browser. No download required.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ y: -8, transition: { duration: 0.2 } }}
          className="glass-surface mx-auto max-w-2xl rounded-2xl p-6 text-center shadow-glass"
          style={{ padding: '3rem' }}
        >
          <div className="mb-4 inline-flex">
            <span className="text-5xl" role="img" aria-label="Web app">
              🌐
            </span>
          </div>
          <h3 className="mb-2 text-2xl font-bold text-slate-900">CGraph for Web</h3>
          <p className="mb-2 text-sm text-slate-500">Works in Chrome, Firefox, Safari, and Edge</p>
          <span className="mb-6 inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-glow-purple">
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
                className="flex items-center justify-center gap-2 text-sm text-slate-500"
              >
                <svg
                  className="h-4 w-4 text-glow-purple"
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
            className="inline-flex items-center gap-2 rounded-xl bg-purple-500 px-6 py-3 font-medium text-white shadow-glass transition-colors hover:bg-purple-600"
          >
            Open Web App
          </motion.a>
        </motion.div>
      </section>

      {/* Mobile App — Beta */}
      <section className="mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-center"
        >
          <h2 className="text-3xl font-bold text-slate-900">Mobile App</h2>
          <p className="mt-2 text-slate-500">
            CGraph for iOS and Android is currently in beta, built with React Native and Expo.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-2xl gap-8 md:grid-cols-2">
          {[
            { name: 'iOS', icon: '📱', badge: 'Beta', note: 'Coming to App Store with v1.0' },
            {
              name: 'Android',
              icon: '🤖',
              badge: 'Beta',
              note: 'Coming to Google Play with v1.0',
            },
          ].map((app, index) => (
            <motion.div
              key={app.name}
              initial={{ opacity: 0, x: index === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="glass-surface flex items-center gap-6 rounded-2xl p-6 shadow-glass"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-purple-50">
                <span className="text-4xl" role="img" aria-label={app.name}>
                  {app.icon}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900">{app.name}</h3>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-600">
                    {app.badge}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{app.note}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 text-center text-sm text-slate-500"
        >
          Mobile beta targets public TestFlight & Play Store availability with the v1.0 launch in Q2
          2026.
        </motion.p>
      </section>

      {/* Desktop Apps — Roadmap */}
      <section className="mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-center"
        >
          <h2 className="text-3xl font-bold text-slate-900">Desktop Apps</h2>
          <p className="mt-2 text-slate-500">Native desktop apps are on our roadmap for 2027.</p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-3">
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
              className="glass-surface rounded-2xl p-6 text-center opacity-70 shadow-glass"
            >
              <div className="mb-4 inline-flex">
                <span className="text-4xl" role="img" aria-label={platform.name}>
                  {platform.icon}
                </span>
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">{platform.name}</h3>
              <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-500">
                Planned · 2027
              </span>
              <p className="mt-3 text-sm text-slate-500">
                In the meantime, use the web app for the full CGraph experience.
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-center"
        >
          <h2 className="text-3xl font-bold text-slate-900">Why Choose CGraph?</h2>
          <p className="mt-2 text-slate-500">
            Privacy and security aren't add-ons. They're how it works.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="glass-surface rounded-2xl p-6 shadow-glass"
            >
              <span className="mb-3 inline-block text-3xl" role="img" aria-label={feature.title}>
                {feature.icon}
              </span>
              <h3 className="mb-1 text-lg font-semibold text-slate-900">{feature.title}</h3>
              <p className="text-sm text-slate-500">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </LiquidGlassLayout>
  );
}

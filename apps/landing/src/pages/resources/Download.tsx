/**
 * Download Page - App download options with animations
 *
 * @since v0.9.2
 * @updated v0.9.6 - Migrated to MarketingLayout for consistent styling
 */

import { motion } from 'framer-motion';
import { MarketingLayout } from '@/components/marketing';

const platforms = [
  {
    name: 'macOS',
    icon: '🍎',
    version: '1.2.0',
    size: '98 MB',
    requirements: 'macOS 12.0 or later',
    downloadUrl: '#',
    badge: 'Universal Binary',
    features: ['Apple Silicon & Intel', 'Native performance', 'Touch Bar support'],
  },
  {
    name: 'Windows',
    icon: '🪟',
    version: '1.2.0',
    size: '85 MB',
    requirements: 'Windows 10 or later',
    downloadUrl: '#',
    badge: 'x64 & ARM64',
    features: ['Native Windows UI', 'System tray integration', 'Auto-start option'],
  },
  {
    name: 'Linux',
    icon: '🐧',
    version: '1.2.0',
    size: '78 MB',
    requirements: 'Ubuntu 20.04+, Fedora 35+, or equivalent',
    downloadUrl: '#',
    badge: 'AppImage & .deb',
    features: ['System theme integration', 'Wayland & X11 support', 'Tray notifications'],
  },
];

const mobileApps = [
  {
    name: 'iOS',
    icon: '📱',
    store: 'App Store',
    downloadUrl: '#',
    badge: 'iOS 15+',
    rating: '4.8',
  },
  {
    name: 'Android',
    icon: '🤖',
    store: 'Google Play',
    downloadUrl: '#',
    badge: 'Android 10+',
    rating: '4.7',
  },
];

const features = [
  {
    icon: '🔒',
    title: 'End-to-End Encryption',
    description:
      'Your messages are encrypted on your device and can only be read by you and your recipients.',
  },
  {
    icon: '⚡',
    title: 'Lightning Fast',
    description:
      'Native apps built for performance. Messages sync instantly across all your devices.',
  },
  {
    icon: '🔄',
    title: 'Seamless Sync',
    description:
      'Start a conversation on your phone and continue on your desktop without missing a beat.',
  },
  {
    icon: '🌙',
    title: 'Dark Mode',
    description: "Beautiful dark theme that's easy on your eyes and saves battery on OLED screens.",
  },
];

const stats = [
  { value: '50K+', label: 'Downloads' },
  { value: '4.8', label: 'App Rating' },
  { value: '99.9%', label: 'Uptime' },
  { value: '40+', label: 'Countries' },
];

export default function Download() {
  return (
    <MarketingLayout
      title="Get CGraph for Every Platform"
      subtitle="Download CGraph for your device and start messaging securely. Available on all major platforms with seamless sync."
      eyebrow="⬇️ Download CGraph"
      showCTA
    >
      {/* Stats */}
      <section
        className="marketing-section marketing-section--alt"
        style={{ paddingTop: '2rem', paddingBottom: '2rem' }}
      >
        <div className="marketing-section__container">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="marketing-hero__highlight text-3xl font-bold">{stat.value}</div>
                <div className="mt-1 text-sm" style={{ color: 'var(--color-gray)' }}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section
        className="marketing-section marketing-section--dark"
        style={{ paddingTop: '2rem', paddingBottom: '2rem' }}
      >
        <div className="marketing-section__container">
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#desktop" className="marketing-btn marketing-btn--primary">
              Desktop Apps
            </a>
            <a href="#mobile" className="marketing-btn marketing-btn--secondary">
              Mobile Apps
            </a>
          </div>
        </div>
      </section>

      {/* Desktop Apps */}
      <section id="desktop" className="marketing-section marketing-section--alt">
        <div className="marketing-section__container">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title font-zentry">Desktop Apps</h2>
              <p className="marketing-section__desc">
                Native desktop apps for the best experience. All our apps are open source and
                regularly audited for security.
              </p>
            </motion.div>
          </div>

          <div className="marketing-grid marketing-grid--3">
            {platforms.map((platform, index) => (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="marketing-card group"
                style={{ padding: '2rem' }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-5xl">{platform.icon}</span>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-primary)' }}
                  >
                    {platform.badge}
                  </span>
                </div>

                <h3 className="mb-2 text-2xl font-bold text-white">{platform.name}</h3>
                <p className="mb-4 text-sm" style={{ color: 'var(--color-gray)' }}>
                  {platform.requirements}
                </p>

                <div className="mb-6 space-y-2">
                  {platform.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
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

                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <div className="text-sm" style={{ color: 'var(--color-gray)' }}>
                    <span className="font-medium text-white">v{platform.version}</span> ·{' '}
                    {platform.size}
                  </div>
                  <motion.a
                    href={platform.downloadUrl}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                    style={{
                      background:
                        'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                    }}
                  >
                    Download
                  </motion.a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile Apps */}
      <section id="mobile" className="marketing-section marketing-section--dark">
        <div className="marketing-section__container">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title font-zentry">Mobile Apps</h2>
              <p className="marketing-section__desc">
                Take CGraph with you. Our mobile apps are designed for privacy and performance.
              </p>
            </motion.div>
          </div>

          <div className="mx-auto grid max-w-2xl gap-8 md:grid-cols-2">
            {mobileApps.map((app, index) => (
              <motion.a
                key={app.name}
                href={app.downloadUrl}
                initial={{ opacity: 0, x: index === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
                className="marketing-card group flex items-center gap-6"
                style={{ textDecoration: 'none', padding: '2rem' }}
              >
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-2xl text-4xl"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(139, 92, 246, 0.2))',
                  }}
                >
                  {app.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">{app.name}</h3>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-300">
                      {app.badge}
                    </span>
                  </div>
                  <p className="mt-1" style={{ color: 'var(--color-gray)' }}>
                    {app.store}
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-yellow-400">★</span>
                    <span className="font-medium text-white">{app.rating}</span>
                    <span style={{ color: 'var(--color-gray)' }}>/ 5.0</span>
                  </div>
                </div>
                <div
                  style={{ color: 'var(--color-gray)' }}
                  className="transition-transform group-hover:translate-x-1"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </motion.a>
            ))}
          </div>

          {/* Web App Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="marketing-card mx-auto mt-12 max-w-2xl text-center"
            style={{
              borderColor: 'rgba(139, 92, 246, 0.3)',
              background: 'rgba(139, 92, 246, 0.05)',
            }}
          >
            <div className="mb-2 text-2xl">🌐</div>
            <h3 className="mb-2 text-lg font-semibold text-white">Prefer the Web?</h3>
            <p className="mb-4" style={{ color: 'var(--color-gray)' }}>
              Use CGraph directly in your browser. No download required.
            </p>
            <a
              href="https://web.cgraph.org"
              className="inline-flex items-center gap-2 font-medium transition-colors hover:text-emerald-300"
              style={{ color: 'var(--color-primary)' }}
            >
              Open Web App →
            </a>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="marketing-section marketing-section--alt">
        <div className="marketing-section__container">
          <div className="marketing-section__header">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="marketing-section__title font-zentry">Why Choose CGraph?</h2>
              <p className="marketing-section__desc">
                Built from the ground up with privacy and security in mind.
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
                <span className="marketing-card__icon">{feature.icon}</span>
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

/**
 * Download Page - App download options with complex animations
 */

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Navigation } from '../../components/Navigation';
import { LogoIcon } from '../../components/Logo';

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
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navigation transparent />

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        {/* Background gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute right-1/4 top-1/3 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-2xl shadow-emerald-500/25"
          >
            <LogoIcon size={48} color="white" />
          </motion.div>

          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400"
          >
            ⬇️ Download CGraph
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 text-4xl font-bold text-white md:text-6xl"
          >
            Get CGraph for
            <span className="block bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Every Platform
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mx-auto mb-8 max-w-2xl text-xl text-gray-400"
          >
            Download CGraph for your device and start messaging securely. Available on all major
            platforms with seamless sync.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <a
              href="#desktop"
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-4 font-semibold text-white transition-all hover:shadow-lg hover:shadow-emerald-500/25"
            >
              Desktop Apps
            </a>
            <a
              href="#mobile"
              className="rounded-xl border border-white/10 bg-white/5 px-8 py-4 font-semibold text-white transition-all hover:bg-white/10"
            >
              Mobile Apps
            </a>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/5 bg-white/[0.02] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
                <div className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-3xl font-bold text-transparent">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Desktop Apps */}
      <section id="desktop" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">Desktop Apps</h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-400">
              Native desktop apps for the best experience. All our apps are open source and
              regularly audited for security.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {platforms.map((platform, index) => (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 transition-all hover:border-emerald-500/30 hover:bg-white/10"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10" />
                </div>

                <div className="relative">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-5xl">{platform.icon}</span>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                      {platform.badge}
                    </span>
                  </div>

                  <h3 className="mb-2 text-2xl font-bold text-white">{platform.name}</h3>
                  <p className="mb-4 text-sm text-gray-400">{platform.requirements}</p>

                  <div className="mb-6 space-y-2">
                    {platform.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                        <svg
                          className="h-4 w-4 text-emerald-400"
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
                    <div className="text-sm text-gray-400">
                      <span className="font-medium text-white">v{platform.version}</span> ·{' '}
                      {platform.size}
                    </div>
                    <motion.a
                      href={platform.downloadUrl}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white"
                    >
                      Download
                    </motion.a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile Apps */}
      <section id="mobile" className="bg-white/[0.02] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">Mobile Apps</h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-400">
              Take CGraph with you. Our mobile apps are designed for privacy and performance.
            </p>
          </motion.div>

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
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 transition-all hover:border-emerald-500/30"
              >
                <div className="flex items-center gap-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-4xl">
                    {app.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-white">{app.name}</h3>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-300">
                        {app.badge}
                      </span>
                    </div>
                    <p className="mt-1 text-gray-400">{app.store}</p>
                    <div className="mt-2 flex items-center gap-1">
                      <span className="text-yellow-400">★</span>
                      <span className="font-medium text-white">{app.rating}</span>
                      <span className="text-gray-500">/ 5.0</span>
                    </div>
                  </div>
                  <div className="text-gray-400 transition-transform group-hover:translate-x-1">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>

          {/* Web App Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mt-12 max-w-2xl rounded-2xl border border-blue-500/20 bg-blue-500/10 p-6 text-center"
          >
            <div className="mb-2 text-2xl">🌐</div>
            <h3 className="mb-2 text-lg font-semibold text-white">Prefer the Web?</h3>
            <p className="mb-4 text-gray-400">
              Use CGraph directly in your browser. No download required.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 font-medium text-blue-400 transition-colors hover:text-blue-300"
            >
              Open Web App →
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">Why Choose CGraph?</h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-400">
              Built from the ground up with privacy and security in mind.
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
                className="rounded-xl border border-white/10 bg-white/5 p-6"
              >
                <div className="mb-4 text-3xl">{feature.icon}</div>
                <h3 className="mb-2 font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </motion.div>
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
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 p-12 text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
            <div className="relative">
              <h2 className="mb-4 text-3xl font-bold text-white">Ready to Get Started?</h2>
              <p className="mx-auto mb-8 max-w-xl text-gray-300">
                Download CGraph now and join our growing community of privacy-conscious users.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href="#desktop"
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-4 font-semibold text-white transition-all hover:shadow-lg hover:shadow-emerald-500/25"
                >
                  Download Now
                </a>
                <Link
                  to="/about"
                  className="rounded-xl border border-white/20 bg-white/5 px-8 py-4 font-semibold text-white transition-all hover:bg-white/10"
                >
                  Learn More
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

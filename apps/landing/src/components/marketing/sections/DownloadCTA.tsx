/**
 * Download CTA Section
 *
 * Call-to-action with App Store, Google Play, and web app links.
 * Store URLs point to placeholder pages until stores approve submissions.
 *
 * @since v1.0.0
 */

import { memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SectionHeader } from '../ui/SectionHeader';
import { LandingButton } from '../ui/LandingButton';

const platforms = [
  {
    name: 'App Store',
    icon: '🍎',
    description: 'iOS 15+ (Coming Soon)',
    href: '/download',
    badge: 'Download on the',
  },
  {
    name: 'Google Play',
    icon: '🤖',
    description: 'Android 10+ (Coming Soon)',
    href: '/download',
    badge: 'Get it on',
  },
  {
    name: 'Web App',
    icon: '🌐',
    description: 'Any modern browser',
    href: 'https://web.cgraph.org',
    badge: 'Open',
  },
] as const;

export const DownloadCTA = memo(function DownloadCTA() {
  const prefersReduced = useReducedMotion();

  return (
    <section id="download" className="download-cta-section zoom-section py-24">
      <SectionHeader
        badge="Get Started"
        badgeVariant="violet"
        title="Available"
        titleAccent="Everywhere"
        titleAccentClass="title-fx--air"
        description="Download CGraph for your platform or use it right in your browser."
      />

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 px-6 sm:grid-cols-3">
        {platforms.map((platform, i) => (
          <motion.a
            key={platform.name}
            href={platform.href}
            target="_blank"
            rel="noopener noreferrer"
            initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
            whileInView={prefersReduced ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            whileHover={prefersReduced ? {} : { scale: 1.03, y: -4 }}
            className="group flex flex-col items-center gap-3 rounded-2xl border border-dark-700/50 bg-dark-900/60 p-8 text-center transition-colors hover:border-emerald-500/30 hover:bg-dark-800/80"
          >
            <span className="text-4xl">{platform.icon}</span>
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">{platform.badge}</p>
              <h4 className="text-lg font-bold text-white">{platform.name}</h4>
            </div>
            <p className="text-sm text-gray-400">{platform.description}</p>
          </motion.a>
        ))}
      </div>

      {/* Direct CTA below */}
      <div className="mt-12 text-center">
        <LandingButton href="https://web.cgraph.org/register" variant="primary" size="lg">
          Get Started Free — No Download Required
        </LandingButton>
      </div>
    </section>
  );
});

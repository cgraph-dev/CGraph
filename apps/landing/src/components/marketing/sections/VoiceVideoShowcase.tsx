/**
 * Voice & Video Showcase Section
 *
 * Showcases group calling capabilities with animated mockup.
 *
 * @since v1.0.0
 */

import { memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SectionHeader } from '../ui/SectionHeader';

const features = [
  { icon: '👥', label: 'Group Calls', desc: 'Up to 50 participants with LiveKit SFU' },
  { icon: '🖥️', label: 'Screen Sharing', desc: 'Share your screen with one click' },
  { icon: '🔒', label: 'E2EE Calls', desc: 'End-to-end encrypted indicator for every call' },
  { icon: '🎙️', label: 'Voice Channels', desc: 'Always-on voice rooms for your community' },
  { icon: '📱', label: 'Cross-Platform', desc: 'Works on web, iOS, and Android' },
] as const;

const mockParticipants = [
  { name: 'Alice', color: '#10b981', initials: 'AL' },
  { name: 'Bob', color: '#3b82f6', initials: 'BO' },
  { name: 'Carol', color: '#8b5cf6', initials: 'CA' },
  { name: 'Dave', color: '#f59e0b', initials: 'DA' },
] as const;

export const VoiceVideoShowcase = memo(function VoiceVideoShowcase() {
  const prefersReduced = useReducedMotion();

  return (
    <section className="voice-video-section zoom-section py-24">
      <SectionHeader
        badge="Voice & Video"
        badgeVariant="blue"
        title="Crystal Clear"
        titleAccent="Calls"
        titleAccentClass="title-fx--air"
        description="Group calls with screen sharing and E2EE — built right into the platform."
      />

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2">
        {/* Call Mockup */}
        <motion.div
          initial={prefersReduced ? {} : { opacity: 0, scale: 0.95 }}
          whileInView={prefersReduced ? {} : { opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative"
        >
          <div className="overflow-hidden rounded-2xl border border-dark-700/50 bg-dark-900/80 p-6 shadow-2xl">
            {/* Call Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                <span className="text-sm font-medium text-emerald-400">Live Call</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-900/30 px-3 py-1">
                <svg className="h-3 w-3 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xs text-emerald-400">E2EE</span>
              </div>
            </div>

            {/* Participant Grid */}
            <div className="grid grid-cols-2 gap-3">
              {mockParticipants.map((p, i) => (
                <motion.div
                  key={p.name}
                  initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
                  whileInView={prefersReduced ? {} : { opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex aspect-video items-center justify-center rounded-xl border border-dark-600/50 bg-dark-800/80"
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.initials}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Call Controls */}
            <div className="mt-4 flex items-center justify-center gap-4">
              {['🎤', '📹', '🖥️', '😀'].map((icon) => (
                <div
                  key={icon}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-dark-700/80 text-lg transition-colors hover:bg-dark-600"
                >
                  {icon}
                </div>
              ))}
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-lg">
                📞
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature List */}
        <div className="space-y-6">
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={prefersReduced ? {} : { opacity: 0, x: 20 }}
              whileInView={prefersReduced ? {} : { opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className="flex items-start gap-4"
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-dark-800/80 text-xl">
                {f.icon}
              </span>
              <div>
                <h4 className="font-semibold text-white">{f.label}</h4>
                <p className="text-sm text-gray-400">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});

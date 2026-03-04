/**
 * HeroSection — Liquid Glass hero with 3D glass orb and CTA.
 *
 * Pearl-white background, floating badge, animated headline,
 * two CTA buttons (glass primary + outline), and the 3D GlassOrb.
 */
import { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { cn, springPreset, springGentle, staggerContainer, staggerItem } from './shared';
import { WEB_APP_URL } from '@/constants';

const GlassOrb = lazy(() => import('./GlassOrb').then((m) => ({ default: m.GlassOrb })));

/* ── Fallback while Three.js loads ───────────────────────────────────────── */
function OrbFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-64 w-64 animate-pulse rounded-full bg-gradient-to-br from-glow-blue/20 via-glow-purple/20 to-glow-pink/20" />
    </div>
  );
}

/* ── Background glow blobs ───────────────────────────────────────────────── */
function GlowBlobs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-32 -top-32 h-[500px] w-[500px] animate-glow-pulse rounded-full bg-glow-blue/20 blur-[100px]" />
      <div className="absolute -right-32 top-1/4 h-[400px] w-[400px] animate-glow-pulse rounded-full bg-glow-purple/20 blur-[100px] [animation-delay:1s]" />
      <div className="absolute -bottom-20 left-1/3 h-[350px] w-[350px] animate-glow-pulse rounded-full bg-glow-pink/15 blur-[100px] [animation-delay:2s]" />
    </div>
  );
}

/* ── Hero section ────────────────────────────────────────────────────────── */
export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[100dvh] items-center overflow-hidden px-6 py-24 lg:px-12"
    >
      <GlowBlobs />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
        {/* ── Left: copy ── */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-6"
        >
          {/* Badge */}
          <motion.div variants={staggerItem}>
            <span
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium',
                'glass-surface text-slate-700 shadow-glass'
              )}
            >
              <Sparkles className="h-4 w-4 text-glow-purple" />
              Post-Quantum Encrypted Messaging
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={staggerItem}
            className="text-balance text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl xl:text-7xl"
          >
            Chat that's{' '}
            <span className="bg-gradient-to-r from-glow-blue via-glow-purple to-glow-pink bg-clip-text text-transparent">
              actually private.
            </span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            variants={staggerItem}
            className="max-w-lg text-lg leading-relaxed text-slate-500 sm:text-xl"
          >
            End-to-end encryption, real-time forums, gamified communities, and voice/video — all in
            one beautiful, open platform.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-4 pt-2">
            <motion.a
              href={`${WEB_APP_URL}/register`}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={springPreset}
              className={cn(
                'inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-base font-semibold',
                'bg-gradient-to-r from-glow-blue via-glow-purple to-glow-pink text-white shadow-glass-lg',
                'transition-shadow hover:shadow-glass-xl'
              )}
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </motion.a>

            <motion.a
              href="#features"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={springPreset}
              className={cn(
                'inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-base font-semibold',
                'glass-surface text-slate-700 shadow-glass',
                'transition-shadow hover:shadow-glass-lg'
              )}
            >
              See Features
            </motion.a>
          </motion.div>

          {/* Trust line */}
          <motion.p variants={staggerItem} className="pt-4 text-sm text-slate-400">
            Trusted by 10,000+ users · Open source · GDPR compliant
          </motion.p>
        </motion.div>

        {/* ── Right: 3D glass orb ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...springGentle, delay: 0.3 }}
          className="relative aspect-square w-full max-w-lg justify-self-center lg:justify-self-end"
        >
          <Suspense fallback={<OrbFallback />}>
            <GlassOrb />
          </Suspense>
        </motion.div>
      </div>
    </section>
  );
}

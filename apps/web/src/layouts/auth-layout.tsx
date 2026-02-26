/**
 * Authentication pages layout wrapper.
 * @module
 */
import { ReactNode, memo } from 'react';
import { motion } from 'framer-motion';
import { LogoIcon } from '@/components/logo';
import {
  CyberGrid,
  MorphingBlob,
  FloatingIcons,
  CursorGlow,
  TiltCard,
  TextScramble,
  ScanLines,
  ParticleField,
  AuroraGlow,
  prefersReducedMotion,
} from '@/modules/auth/components/auth-effects';
import { tweens } from '@/lib/animation-presets';

interface AuthLayoutProps {
  children: ReactNode;
}

// Feature card component with 3D tilt effect and decrypting text
const FeatureCard = memo(function FeatureCard({
  title,
  subtitle,
  delay,
}: {
  title: string;
  subtitle: string;
  delay: number;
}) {
  const reduced = prefersReducedMotion();

  return (
    <TiltCard className="group rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/10 to-emerald-500/5 p-4 text-center backdrop-blur-md transition-all duration-300 hover:border-violet-400/40 hover:bg-gradient-to-br hover:from-violet-500/20 hover:to-emerald-500/10 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]">
      <motion.div
        initial={reduced ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...tweens.emphatic, delay }}
      >
        <div className="text-2xl font-bold text-white transition-colors group-hover:text-violet-300">
          <TextScramble text={title} delay={delay * 1000 + 500} />
        </div>
        <div className="mt-1 text-sm text-white/70">{subtitle}</div>
      </motion.div>
    </TiltCard>
  );
});

// Cyberpunk animated background layers
const BackgroundLayers = memo(function BackgroundLayers() {
  return (
    <>
      {/* Base dark gradient background */}
      <div className="fixed inset-0 z-[1] bg-gradient-to-br from-[#030712] via-[#0a0f1a] to-[#111827]" />

      {/* Aurora glow effect — animated gradients */}
      <div className="fixed inset-0 z-[2]">
        <AuroraGlow colors={['#8b5cf6', '#7c3aed', '#10b981', '#059669']} speed={10} />
      </div>

      {/* Particle field — interconnected nodes */}
      <div className="fixed inset-0 z-[3]">
        <ParticleField
          particleCount={60}
          colors={['#8b5cf6', '#a78bfa', '#10b981', '#34d399']}
          connectionDistance={120}
          speed={0.4}
        />
      </div>

      {/* Cyber grid overlay — purple accent */}
      <div className="fixed inset-0 z-[4]">
        <CyberGrid color="#8b5cf6" cellSize={60} pulseSpeed={5000} />
      </div>

      {/* Morphing blobs — purple and emerald */}
      <MorphingBlob color="#8b5cf6" size={600} className="-left-48 -top-48 z-[5] opacity-40" />
      <MorphingBlob color="#10b981" size={500} className="-bottom-48 -right-48 z-[5] opacity-30" />
      <MorphingBlob color="#7c3aed" size={350} className="left-1/3 top-1/4 z-[5] opacity-20" />

      {/* Floating security icons — purple */}
      <div className="fixed inset-0 z-[6]">
        <FloatingIcons color="#a78bfa" />
      </div>

      {/* Cursor glow effect — purple */}
      <CursorGlow color="#8b5cf6" size={400} />

      {/* CRT scan lines */}
      <ScanLines opacity={0.02} />
    </>
  );
});

/**
 * Auth Layout — page layout wrapper.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  const reduced = prefersReducedMotion();

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-black">
      <BackgroundLayers />

      {/* Left side — Branding with enhanced animations */}
      <div className="relative z-10 hidden flex-col justify-between p-12 lg:flex lg:w-1/2">
        {/* Logo section */}
        <motion.div
          className="relative z-10"
          initial={reduced ? {} : { opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={tweens.dramatic}
        >
          <a href="https://www.cgraph.org" className="group inline-block">
            <motion.div
              whileHover={reduced ? {} : { scale: 1.05 }}
              whileTap={reduced ? {} : { scale: 0.97 }}
              className="transition-all duration-300"
            >
              <LogoIcon
                size={160}
                className="drop-shadow-[0_0_40px_rgba(139,92,246,0.4)] transition-all duration-300 group-hover:drop-shadow-[0_0_60px_rgba(139,92,246,0.6)]"
              />
            </motion.div>
          </a>
        </motion.div>

        {/* Main content section */}
        <div className="relative z-10 space-y-8">
          <motion.div
            initial={reduced ? {} : { y: 20 }}
            animate={{ y: 0 }}
            transition={{ ...tweens.emphatic, delay: 0.1 }}
          >
            <h1 className="text-5xl font-bold leading-tight text-white">
              <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent">
                <TextScramble text="Connect, Share," delay={800} scrambleSpeed={100} />
              </span>
              <br />
              <span className="text-white">
                <TextScramble text="Build Community" delay={2400} scrambleSpeed={100} />
              </span>
            </h1>
          </motion.div>

          <motion.p
            className="max-w-md text-xl leading-relaxed text-white/80"
            initial={reduced ? {} : { y: 15 }}
            animate={{ y: 0 }}
            transition={{ ...tweens.smooth, delay: 0.3 }}
          >
            The all-in-one platform for{' '}
            <span className="font-medium text-violet-400">secure messaging</span>,{' '}
            <span className="font-medium text-purple-300">group discussions</span>, and{' '}
            <span className="font-medium text-emerald-400">community forums</span>.
          </motion.p>

          {/* Feature cards with 3D tilt + staggered animation */}
          <motion.div
            className="grid grid-cols-3 gap-4 pt-6"
            initial={reduced ? {} : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...tweens.dramatic, delay: 0.6 }}
          >
            <FeatureCard title="E2E" subtitle="Encrypted" delay={0.7} />
            <FeatureCard title="Real-time" subtitle="Messaging" delay={0.8} />
            <FeatureCard title="Web3" subtitle="Ready" delay={0.9} />
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          className="relative z-10 text-sm text-white/50"
          initial={reduced ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...tweens.slow, delay: 1.2 }}
        >
          © 2026 CGraph. All rights reserved.
        </motion.div>
      </div>

      {/* Right side — Auth form with 3D tilt glass card */}
      <div className="relative z-10 flex flex-1 items-center justify-center p-8">
        <motion.div
          className="w-full max-w-md"
          initial={reduced ? {} : { opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ ...tweens.dramatic, delay: 0.3 }}
        >
          <TiltCard
            className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-[#111827]/90 via-[#0a0f1a]/80 to-[#030712]/90 p-8 shadow-[0_0_60px_rgba(139,92,246,0.15),0_0_100px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl transition-all duration-500 hover:border-violet-400/40 hover:shadow-[0_0_80px_rgba(139,92,246,0.25),inset_0_1px_0_rgba(255,255,255,0.15)]"
            maxTilt={5}
          >
            {children}
          </TiltCard>
        </motion.div>
      </div>
    </div>
  );
}

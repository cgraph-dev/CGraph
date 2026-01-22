import { ReactNode, memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MatrixAuthBackground, MatrixLogo } from '@/lib/animations/matrix';
import {
  CyberGrid,
  MorphingBlob,
  FloatingIcons,
  CursorGlow,
  TiltCard,
  TextScramble,
  ScanLines,
  prefersReducedMotion,
} from '@/components/auth/AuthEffects';

interface AuthLayoutProps {
  children: ReactNode;
}

// Feature card component with 3D tilt effect
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
    <TiltCard className="group rounded-xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-md transition-all duration-300 hover:border-primary-400/30 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]">
      <motion.div
        initial={reduced ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay }}
      >
        <div className="text-2xl font-bold text-white transition-colors group-hover:text-primary-300">
          <TextScramble text={title} delay={delay * 1000 + 500} />
        </div>
        <div className="mt-1 text-sm text-white/70">{subtitle}</div>
      </motion.div>
    </TiltCard>
  );
});

// Animated background layers
const BackgroundLayers = memo(function BackgroundLayers() {
  return (
    <>
      {/* Base matrix effect */}
      <MatrixAuthBackground theme="matrix-green" opacity={0.95} zIndex={1} />

      {/* Cyber grid overlay */}
      <div className="fixed inset-0 z-[2]">
        <CyberGrid color="#10b981" cellSize={50} pulseSpeed={4000} />
      </div>

      {/* Dark gradient overlay for readability */}
      <div className="fixed inset-0 z-[3] bg-gradient-to-br from-black/60 via-dark-950/70 to-matrix-dim/40" />

      {/* Morphing blobs for organic feel */}
      <MorphingBlob color="#10b981" size={600} className="-left-48 -top-48 z-[4] opacity-40" />
      <MorphingBlob color="#06b6d4" size={400} className="-bottom-32 -right-32 z-[4] opacity-30" />

      {/* Floating security icons */}
      <div className="fixed inset-0 z-[5]">
        <FloatingIcons color="#10b981" />
      </div>

      {/* Cursor glow effect */}
      <CursorGlow color="#10b981" size={400} />

      {/* CRT scan lines */}
      <ScanLines opacity={0.02} />
    </>
  );
});

export default function AuthLayout({ children }: AuthLayoutProps) {
  const reduced = prefersReducedMotion();

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-black">
      <BackgroundLayers />

      {/* Left side - Branding with enhanced animations */}
      <div className="relative z-10 hidden flex-col justify-between p-12 lg:flex lg:w-1/2">
        {/* Logo section */}
        <motion.div
          className="relative z-10"
          initial={reduced ? {} : { opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <Link to="/" className="group flex items-center gap-3">
            <motion.div
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-white/10 backdrop-blur-md transition-all duration-300 group-hover:border-primary-400/50 group-hover:bg-white/20 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
              whileHover={reduced ? {} : { scale: 1.1, rotate: 5 }}
              whileTap={reduced ? {} : { scale: 0.95 }}
            >
              <svg
                className="h-7 w-7 text-primary-400 transition-transform duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </motion.div>
            <MatrixLogo
              text="CGraph"
              className="text-3xl font-bold text-white"
              glowColor="#10b981"
              animationDuration={2000}
              loopDelay={8000}
            />
          </Link>
        </motion.div>

        {/* Main content section */}
        <div className="relative z-10 space-y-8">
          <motion.div
            initial={reduced ? {} : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-5xl font-bold leading-tight text-white">
              <span className="bg-gradient-to-r from-primary-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                <TextScramble text="Connect, Share," delay={300} />
              </span>
              <br />
              <span className="text-white">
                <TextScramble text="Build Community" delay={800} />
              </span>
            </h1>
          </motion.div>

          <motion.p
            className="max-w-md text-xl leading-relaxed text-white/80"
            initial={reduced ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            The all-in-one platform for{' '}
            <span className="font-medium text-primary-400">secure messaging</span>,{' '}
            <span className="font-medium text-cyan-400">group discussions</span>, and{' '}
            <span className="font-medium text-emerald-400">community forums</span>.
          </motion.p>

          {/* Feature cards with staggered animation */}
          <motion.div
            className="grid grid-cols-3 gap-4 pt-6"
            initial={reduced ? {} : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
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
          transition={{ duration: 1, delay: 1.2 }}
        >
          © 2026 CGraph. All rights reserved.
        </motion.div>
      </div>

      {/* Right side - Auth form with enhanced glass card */}
      <div className="relative z-10 flex flex-1 items-center justify-center p-8">
        <motion.div
          className="w-full max-w-md"
          initial={reduced ? {} : { opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
        >
          <TiltCard
            className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-[0_0_50px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl transition-all duration-500 hover:border-primary-400/30 hover:shadow-[0_0_60px_rgba(16,185,129,0.2),inset_0_1px_0_rgba(255,255,255,0.15)]"
            maxTilt={5}
          >
            {children}
          </TiltCard>
        </motion.div>
      </div>
    </div>
  );
}

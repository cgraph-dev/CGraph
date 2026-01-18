/**
 * CGraph Ultimate Landing Page
 *
 * The most extraordinary landing page that will amaze the best UI developers.
 * Combines all advanced effects: WebGL shaders, 3D parallax, morphing animations,
 * cursor trails, text scramble, scroll-driven animations, and more.
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { LogoIcon } from '@/components/Logo';

// Import all effects
import {
  // Basic effects
  GridBackground,
  Scanlines,
  GlowText,
  AnimatedBorder,
  TiltCard,
  Magnetic,
  Spotlight,

  // Advanced effects
  NoiseOverlay,
  ChromaticText,
  MorphingBlob,
  LiquidGradient,
  CursorTrail,
  TextScramble,
  GlitchText,
  AuroraBackground,
  Float3D,
  HolographicCard,
  InfiniteMarquee,
  ParallaxScene,

  // WebGL effects
  ShaderBackground,
  Constellation,
  Metaballs,
  GeometricPattern,

  // Showcase components
  ScrollProgress,
  RevealContainer,
  ScrollCounter,
  SplitText,
  BentoGrid,
  PerspectiveTilt,

  // Animations
  fadeInUp,
  fadeInLeft,
  fadeInRight,
  scaleInBounce,
  staggerContainer,
  springs,
} from '@/components/landing';

import { CustomizationDemo } from '@/components/landing/CustomizationDemo';

// =============================================================================
// DATA
// =============================================================================

const features = [
  {
    icon: '🔐',
    title: 'End-to-End Encryption',
    description: 'Signal Protocol with X3DH key agreement and Double Ratchet. Your messages stay private.',
    color: '#8b5cf6',
  },
  {
    icon: '💬',
    title: 'Real-Time Messaging',
    description: 'Sub-200ms delivery with WebSocket channels. Text, images, files, and reactions.',
    color: '#06b6d4',
  },
  {
    icon: '🏛️',
    title: 'Forums & Communities',
    description: 'Reddit-style communities with boards, threads, voting, and moderation.',
    color: '#10b981',
  },
  {
    icon: '👥',
    title: 'Groups & Channels',
    description: 'Discord-style servers with roles, permissions, and organized channels.',
    color: '#f97316',
  },
  {
    icon: '📞',
    title: 'Voice & Video Calls',
    description: 'WebRTC-powered calling with screen sharing and group calls up to 25.',
    color: '#ec4899',
  },
  {
    icon: '🎮',
    title: 'Gamification',
    description: 'XP, levels, achievements, and quests. Turn engagement into rewards.',
    color: '#a78bfa',
  },
];

const bentoItems = [
  {
    title: 'Zero-Knowledge Architecture',
    description: 'We cannot read your messages. Ever.',
    icon: '🛡️',
    color: '#10b981',
    span: 'wide' as const,
  },
  {
    title: 'X3DH Protocol',
    description: 'Industry-standard key exchange',
    icon: '🔑',
    color: '#06b6d4',
  },
  {
    title: 'Double Ratchet',
    description: 'Forward secrecy per message',
    icon: '🔄',
    color: '#8b5cf6',
  },
  {
    title: 'Multi-Device Sync',
    description: 'Seamless across all devices',
    icon: '📱',
    color: '#ec4899',
    span: 'tall' as const,
  },
  {
    title: 'HTTP-Only Cookies',
    description: 'XSS-resistant sessions',
    icon: '🔒',
    color: '#f97316',
  },
  {
    title: 'Open Source',
    description: 'Transparent & auditable',
    icon: '✅',
    color: '#10b981',
  },
];

const stats = [
  { value: 99.9, suffix: '%', label: 'Uptime SLA' },
  { value: 200, suffix: 'ms', label: 'Avg Latency' },
  { value: 256, suffix: '-bit', label: 'Encryption' },
  { value: 50, suffix: '+', label: 'Customizations' },
];

const techStack = [
  'React', 'TypeScript', 'Phoenix', 'WebSocket', 'WebRTC', 'PostgreSQL',
  'Redis', 'Docker', 'Kubernetes', 'AWS', 'Cloudflare', 'Stripe',
];

const pricingTiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Everything to get started',
    features: [
      'Unlimited encrypted messaging',
      'Join up to 10 forums',
      'Create 3 groups',
      'Voice calls (1-on-1)',
      '100MB file storage',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Premium',
    price: '$9',
    period: '/month',
    description: 'For power users',
    features: [
      'Everything in Free, plus:',
      'Unlimited forums & groups',
      'Group video calls (up to 25)',
      '10GB file storage',
      'Custom titles & badges',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For organizations',
    features: [
      'Everything in Premium, plus:',
      'Custom branding',
      'SSO/SAML integration',
      'Advanced admin controls',
      'Audit logging & SLA',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

// =============================================================================
// NAVIGATION
// =============================================================================

function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <ScrollProgress color="#10b981" />
      <motion.nav
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'border-b border-emerald-500/10 bg-gray-900/80 shadow-lg shadow-emerald-500/5 backdrop-blur-xl'
            : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <Magnetic strength={20}>
                <LogoIcon size={36} animated />
              </Magnetic>
              <span className="text-xl font-bold">
                <GlitchText intensity="low">CGraph</GlitchText>
              </span>
            </Link>

            <div className="hidden items-center gap-8 md:flex">
              {['Features', 'Security', 'Pricing', 'Demo'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="group relative text-gray-400 transition-colors hover:text-white"
                >
                  {item}
                  <motion.span
                    className="absolute -bottom-1 left-0 h-[2px] w-0 bg-gradient-to-r from-emerald-500 to-cyan-500"
                    whileHover={{ width: '100%' }}
                    transition={{ duration: 0.3 }}
                  />
                </a>
              ))}
            </div>

            <div className="hidden items-center gap-4 md:flex">
              <Link to="/login" className="px-4 py-2 text-gray-400 transition-colors hover:text-white">
                Sign In
              </Link>
              <Magnetic strength={15}>
                <Link
                  to="/register"
                  className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-2 font-medium text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40"
                >
                  <span className="relative z-10">Get Started</span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600"
                    initial={{ x: '100%' }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </Link>
              </Magnetic>
            </div>

            <button
              className="text-gray-300 hover:text-white md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-b-xl border-t border-emerald-500/10 bg-gray-900/95 backdrop-blur-xl md:hidden"
              >
                <div className="space-y-4 px-4 py-4">
                  {['Features', 'Security', 'Pricing', 'Demo'].map((item) => (
                    <a
                      key={item}
                      href={`#${item.toLowerCase()}`}
                      className="block text-gray-300 transition-colors hover:text-emerald-400"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item}
                    </a>
                  ))}
                  <div className="space-y-2 border-t border-gray-800 pt-4">
                    <Link to="/login" className="block px-4 py-2 text-center text-gray-300">
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="block rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-2 text-center font-medium text-white"
                    >
                      Get Started
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>
    </>
  );
}

// =============================================================================
// HERO SECTION - EXTRAORDINARY
// =============================================================================

function HeroSection() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.9]);

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-950">
      {/* Multi-layer background effects */}
      <div className="absolute inset-0">
        {/* WebGL shader background */}
        <ShaderBackground preset="nebula" speed={0.5} intensity={0.8} />

        {/* Aurora overlay */}
        <AuroraBackground speed={25} />

        {/* Constellation network */}
        <Constellation nodeCount={60} color="#10b981" interactive />

        {/* Morphing blobs */}
        <div className="absolute left-1/4 top-1/4 opacity-30">
          <Float3D range={30} speed={4}>
            <MorphingBlob color="#10b981" size={300} speed={10} />
          </Float3D>
        </div>
        <div className="absolute bottom-1/4 right-1/4 opacity-20">
          <Float3D range={25} speed={5} delay={1}>
            <MorphingBlob color="#8b5cf6" size={250} speed={12} />
          </Float3D>
        </div>

        {/* Grid overlay */}
        <GridBackground opacity={0.1} fade />

        {/* Scanlines */}
        <Scanlines opacity={0.02} speed={8} />

        {/* Film grain */}
        <NoiseOverlay opacity={0.03} grain="fine" speed={0.5} />
      </div>

      {/* Cursor trail effect */}
      <CursorTrail color="#10b981" size={25} trailLength={15} />

      {/* Hero content with 3D parallax */}
      <ParallaxScene intensity={15}>
        <motion.div
          style={{ y, opacity, scale }}
          className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-24 text-center sm:px-6 lg:px-8"
        >
          {/* Floating badge */}
          <Float3D range={10} speed={3} rotate={false}>
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 backdrop-blur-sm"
            >
              <motion.span
                className="h-2 w-2 rounded-full bg-emerald-500"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-sm font-medium text-emerald-300">
                <TextScramble text="v0.9.3 — Next-Gen UI Available" speed={30} />
              </span>
            </motion.div>
          </Float3D>

          {/* Main headline with chromatic aberration */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="mb-6 text-5xl font-bold text-white sm:text-6xl lg:text-7xl"
          >
            <SplitText stagger={0.02}>Communication</SplitText>{' '}
            <span className="inline-block">
              <ChromaticText intensity={2} animated>
                Reimagined
              </ChromaticText>
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mx-auto mb-10 max-w-3xl text-xl text-gray-400 sm:text-2xl"
          >
            The privacy-first platform combining{' '}
            <span className="text-emerald-400">encrypted messaging</span>,{' '}
            <span className="text-cyan-400">community forums</span>, and{' '}
            <span className="text-purple-400">voice calls</span>.
          </motion.p>

          {/* CTA buttons with holographic effect */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <HolographicCard>
              <Magnetic strength={10}>
                <Link
                  to="/register"
                  className="group relative block overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Start Free Today
                    <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                      →
                    </motion.span>
                  </span>
                </Link>
              </Magnetic>
            </HolographicCard>

            <a
              href="#features"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-700 bg-gray-800/50 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition-all hover:border-emerald-500/50 hover:bg-gray-800 sm:w-auto"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Learn More
            </a>
          </motion.div>

          {/* Animated stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-20 grid grid-cols-2 gap-8 md:grid-cols-4"
          >
            {stats.map((stat, index) => (
              <RevealContainer key={stat.label} delay={0.1 * index}>
                <motion.div className="text-center" whileHover={{ scale: 1.05 }} transition={springs.bouncy}>
                  <div className="mb-1 text-3xl font-bold text-white sm:text-4xl">
                    <ScrollCounter value={stat.value} suffix={stat.suffix} duration={2.5} />
                  </div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </motion.div>
              </RevealContainer>
            ))}
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-emerald-500/50 pt-2"
            >
              <motion.div
                className="h-2 w-1 rounded-full bg-emerald-400"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </ParallaxScene>
    </section>
  );
}

// =============================================================================
// TECH MARQUEE
// =============================================================================

function TechMarquee() {
  return (
    <section className="relative overflow-hidden border-y border-emerald-500/10 bg-gray-900/50 py-8 backdrop-blur-sm">
      <InfiniteMarquee speed={20}>
        {techStack.map((tech) => (
          <span
            key={tech}
            className="mx-8 text-2xl font-bold text-gray-600 transition-colors hover:text-emerald-400"
          >
            {tech}
          </span>
        ))}
      </InfiniteMarquee>
    </section>
  );
}

// =============================================================================
// FEATURES SECTION
// =============================================================================

function FeaturesSection() {
  return (
    <section id="features" className="relative overflow-hidden bg-gray-950 py-24">
      {/* Background effects */}
      <GeometricPattern pattern="hexagons" color="#10b981" size={80} animated />
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-transparent to-gray-950" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-16 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.span
            className="mb-4 inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-sm font-medium text-emerald-400"
            variants={scaleInBounce}
            transition={springs.bouncy}
          >
            Powerful Features
          </motion.span>
          <motion.h2
            className="mb-4 text-4xl font-bold text-white sm:text-5xl"
            variants={fadeInUp}
            transition={springs.gentle}
          >
            Everything You <GlowText>Need</GlowText>
          </motion.h2>
          <motion.p
            className="mx-auto max-w-2xl text-xl text-gray-400"
            variants={fadeInUp}
            transition={springs.gentle}
          >
            A complete platform built for privacy, performance, and community.
          </motion.p>
        </motion.div>

        {/* Feature cards with 3D effects */}
        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          {features.map((feature, index) => (
            <motion.div key={feature.title} variants={fadeInUp} transition={{ ...springs.gentle, delay: index * 0.1 }}>
              <PerspectiveTilt maxTilt={10}>
                <TiltCard maxTilt={8}>
                  <Spotlight color={`${feature.color}20`}>
                    <AnimatedBorder colors={[feature.color, '#06b6d4', '#8b5cf6']}>
                      <div className="group relative overflow-hidden p-8">
                        <motion.div
                          className="mb-4 text-5xl"
                          whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                          transition={{ duration: 0.5 }}
                        >
                          {feature.icon}
                        </motion.div>

                        <h3 className="mb-3 text-xl font-semibold text-white transition-colors group-hover:text-emerald-400">
                          <TextScramble text={feature.title} trigger={false} />
                        </h3>

                        <p className="leading-relaxed text-gray-400">{feature.description}</p>

                        <motion.div
                          className="absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                          style={{
                            background: `radial-gradient(circle at center, ${feature.color}30, transparent 70%)`,
                            filter: 'blur(20px)',
                          }}
                        />
                      </div>
                    </AnimatedBorder>
                  </Spotlight>
                </TiltCard>
              </PerspectiveTilt>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// =============================================================================
// SECURITY BENTO SECTION
// =============================================================================

function SecuritySection() {
  return (
    <section id="security" className="relative overflow-hidden bg-gray-900 py-24">
      <Metaballs count={4} colors={['#10b981', '#06b6d4', '#8b5cf6']} speed={0.5} />
      <Scanlines opacity={0.02} />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left content */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInLeft}
            transition={springs.gentle}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2">
              <span className="text-sm font-medium text-emerald-400">🔐 Security First</span>
            </div>

            <h2 className="mb-6 text-4xl font-bold text-white sm:text-5xl">
              Your Privacy is{' '}
              <span className="inline-block">
                <ChromaticText intensity={1.5}>Non-Negotiable</ChromaticText>
              </span>
            </h2>

            <p className="mb-8 text-xl leading-relaxed text-gray-400">
              We implement encryption inspired by the Signal Protocol. Your messages are encrypted end-to-end — only
              you and your recipients can read them.
            </p>

            <HolographicCard>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-4 font-semibold text-white"
              >
                Start Secure Messaging
                <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  →
                </motion.span>
              </Link>
            </HolographicCard>
          </motion.div>

          {/* Right: Bento grid */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInRight}
            transition={springs.gentle}
          >
            <BentoGrid items={bentoItems} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// PRICING SECTION
// =============================================================================

function PricingSection() {
  return (
    <section id="pricing" className="relative overflow-hidden bg-gray-950 py-24">
      <ShaderBackground preset="flow" speed={0.3} intensity={0.5} />
      <div className="absolute inset-0 bg-gray-950/80" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-16 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.span
            className="mb-4 inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-sm font-medium text-emerald-400"
            variants={scaleInBounce}
          >
            Simple Pricing
          </motion.span>
          <motion.h2 className="mb-4 text-4xl font-bold text-white sm:text-5xl" variants={fadeInUp}>
            Transparent <GlowText>Pricing</GlowText>
          </motion.h2>
          <motion.p className="mx-auto max-w-2xl text-xl text-gray-400" variants={fadeInUp}>
            Start free and upgrade when you're ready. No hidden fees.
          </motion.p>
        </motion.div>

        {/* Pricing cards */}
        <motion.div
          className="grid gap-8 md:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {pricingTiers.map((tier, index) => (
            <motion.div key={tier.name} variants={fadeInUp} transition={{ delay: index * 0.15 }}>
              <PerspectiveTilt maxTilt={tier.highlighted ? 5 : 8}>
                <HolographicCard>
                  <div
                    className={`relative rounded-2xl p-8 ${
                      tier.highlighted
                        ? 'scale-105 border-2 border-emerald-500 bg-gradient-to-b from-emerald-900/30 to-gray-900'
                        : 'border border-gray-800 bg-gray-900/50'
                    }`}
                  >
                    {tier.highlighted && (
                      <motion.div
                        className="absolute -top-4 left-1/2 -translate-x-1/2"
                        initial={{ y: -10, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                      >
                        <span className="rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-1 text-sm font-medium text-white shadow-lg shadow-emerald-500/30">
                          Most Popular
                        </span>
                      </motion.div>
                    )}

                    <div className="mb-8 text-center">
                      <h3 className="mb-2 text-2xl font-bold text-white">{tier.name}</h3>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-5xl font-bold text-white">{tier.price}</span>
                        <span className="text-gray-400">{tier.period}</span>
                      </div>
                      <p className="mt-3 text-gray-400">{tier.description}</p>
                    </div>

                    <ul className="mb-8 space-y-4">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <svg
                            className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Magnetic strength={8}>
                      <Link
                        to="/register"
                        className={`block rounded-xl px-6 py-3 text-center font-semibold transition-all ${
                          tier.highlighted
                            ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40'
                            : 'border border-gray-700 bg-gray-800 text-white hover:border-emerald-500/50 hover:bg-gray-700'
                        }`}
                      >
                        {tier.cta}
                      </Link>
                    </Magnetic>
                  </div>
                </HolographicCard>
              </PerspectiveTilt>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// =============================================================================
// CTA SECTION
// =============================================================================

function CTASection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gray-950 to-gray-900 py-24">
      <LiquidGradient colors={['#10b981', '#06b6d4', '#8b5cf6', '#ec4899']} speed={20} />
      <div className="absolute inset-0 bg-gray-900/90" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={springs.gentle}
        >
          <Float3D range={15} speed={4}>
            <motion.div className="mb-6 inline-block text-6xl">🚀</motion.div>
          </Float3D>

          <h2 className="mb-6 text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
            Ready for{' '}
            <span className="inline-block">
              <GlitchText intensity="medium">True Privacy?</GlitchText>
            </span>
          </h2>

          <p className="mx-auto mb-10 max-w-2xl text-xl text-gray-400">
            Join us in building the future of secure, privacy-first communication.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <HolographicCard>
              <Magnetic strength={10}>
                <Link
                  to="/register"
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-10 py-4 text-lg font-semibold text-white shadow-xl shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 sm:w-auto"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Create Free Account
                    <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                      →
                    </motion.span>
                  </span>
                </Link>
              </Magnetic>
            </HolographicCard>

            <Link
              to="/login"
              className="w-full rounded-xl border border-gray-700 bg-gray-800/50 px-10 py-4 text-lg font-semibold text-white backdrop-blur-sm transition-all hover:border-emerald-500/50 hover:bg-gray-800 sm:w-auto"
            >
              Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// =============================================================================
// FOOTER
// =============================================================================

function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Product: ['Features', 'Security', 'Pricing', 'Download'],
    Resources: ['Documentation', 'API Reference', 'Status', 'Blog'],
    Company: ['About', 'Careers', 'Contact', 'Press'],
    Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'],
  };

  return (
    <footer className="relative border-t border-emerald-500/10 bg-gray-950 py-16">
      <GeometricPattern pattern="squares" color="#10b981" size={100} animated={false} />
      <div className="absolute inset-0 bg-gray-950/95" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-4 font-semibold text-white">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      to={`/${link.toLowerCase().replace(/\s+/g, '-')}`}
                      className="text-gray-400 transition-colors hover:text-emerald-400"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-800 pt-8 md:flex-row">
          <div className="flex items-center gap-3">
            <LogoIcon size={28} />
            <span className="text-gray-500">© {currentYear} CGraph. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4">
            <a href="https://twitter.com/cgraph" className="text-gray-400 transition-colors hover:text-emerald-400">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a href="https://github.com/cgraph" className="text-gray-400 transition-colors hover:text-emerald-400">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function LandingPageUltimate() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/messages', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Global animation styles */}
      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        /* Hide default cursor when custom cursor is active */
        .custom-cursor-active {
          cursor: none;
        }

        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }
      `}</style>

      <Navigation />
      <HeroSection />
      <TechMarquee />
      <FeaturesSection />
      <SecuritySection />

      {/* Customization Demo - Interactive section */}
      <div id="demo">
        <CustomizationDemo />
      </div>

      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
}

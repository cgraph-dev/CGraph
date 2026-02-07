/**
 * @deprecated ARCHIVED - January 22, 2026
 * This page has been replaced by /pages/LandingPage.tsx (GAMELAND-style)
 * Kept for reference only. Do not import or use.
 *
 * CGraph Landing Page - GSAP Enhanced (Legacy)
 *
 * Features:
 * - Video hero background with GSAP parallax
 * - 3D tilt effects on feature cards
 * - Scroll-triggered animations
 * - Interactive forum and profile previews
 * - Advanced GSAP ScrollTrigger animations
 * - 60fps performance optimizations
 */

import { useState, useEffect, useRef, lazy, Suspense, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { LogoIcon } from '@/components/logo';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Lazy load heavy components
const CustomizationDemo = lazy(() =>
  import('@/components/landing/CustomizationDemo').then((m) => ({ default: m.CustomizationDemo }))
);

const ForumShowcase = lazy(() =>
  import('@/components/landing/ForumShowcase').then((m) => ({ default: m.ForumShowcase }))
);

// =============================================================================
// DATA
// =============================================================================

const features = [
  {
    icon: '🔐',
    title: 'End-to-End Encryption',
    description: 'Signal Protocol with X3DH key agreement and Double Ratchet.',
    color: '#8b5cf6',
    gradient: 'from-purple-500/20 to-purple-600/20',
  },
  {
    icon: '💬',
    title: 'Real-Time Messaging',
    description: 'Sub-200ms delivery with WebSocket channels.',
    color: '#06b6d4',
    gradient: 'from-cyan-500/20 to-cyan-600/20',
  },
  {
    icon: '🏛️',
    title: 'Forums & Communities',
    description: 'Reddit-style communities with voting and moderation.',
    color: '#10b981',
    gradient: 'from-emerald-500/20 to-emerald-600/20',
  },
  {
    icon: '👥',
    title: 'Groups & Channels',
    description: 'Discord-style servers with roles and permissions.',
    color: '#f97316',
    gradient: 'from-orange-500/20 to-orange-600/20',
  },
  {
    icon: '📞',
    title: 'Voice & Video Calls',
    description: 'WebRTC-powered calling with screen sharing.',
    color: '#ec4899',
    gradient: 'from-pink-500/20 to-pink-600/20',
  },
  {
    icon: '🎮',
    title: 'Gamification',
    description: 'XP, levels, achievements, and quests.',
    color: '#a78bfa',
    gradient: 'from-violet-500/20 to-violet-600/20',
  },
];

const stats = [
  { value: '99.9%', label: 'Uptime', suffix: '' },
  { value: '200', label: 'Latency', suffix: 'ms' },
  { value: '256', label: 'Encryption', suffix: '-bit' },
  { value: '50', label: 'Features', suffix: '+' },
];

const pricingTiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Everything to get started',
    features: [
      'Unlimited messaging',
      'Join 10 forums',
      'Create 3 groups',
      '1-on-1 calls',
      '100MB storage',
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
      'Everything in Free',
      'Unlimited forums',
      'Group calls (25)',
      '10GB storage',
      'Priority support',
    ],
    cta: 'Start Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For organizations',
    features: ['Everything in Premium', 'Custom branding', 'SSO/SAML', 'Admin controls', 'SLA'],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

// =============================================================================
// 3D TILT CARD COMPONENT
// =============================================================================

interface TiltCard3DProps {
  children: React.ReactNode;
  className?: string;
}

function TiltCard3D({ children, className = '' }: TiltCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    const glow = glowRef.current;
    if (!card || !glow) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -10;
      const rotateY = ((x - centerX) / centerX) * 10;

      gsap.to(card, {
        rotateX,
        rotateY,
        transformPerspective: 1000,
        duration: 0.3,
        ease: 'power2.out',
      });

      gsap.to(glow, {
        x: x - rect.width / 2,
        y: y - rect.height / 2,
        opacity: 0.3,
        duration: 0.3,
      });
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.5,
        ease: 'power2.out',
      });

      gsap.to(glow, {
        opacity: 0,
        duration: 0.3,
      });
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className={`relative transform-gpu ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div
        ref={glowRef}
        className="pointer-events-none absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-0 blur-3xl"
      />
      {children}
    </div>
  );
}

// =============================================================================
// NAVIGATION
// =============================================================================

const Navigation = memo(function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (navRef.current) {
      // Use fromTo for explicit control over start and end states
      gsap.fromTo(
        navRef.current,
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }
      );
    }
  }, []);

  return (
    <nav
      ref={navRef}
      className={`fixed left-0 right-0 top-0 z-[100] transition-all duration-500 ${
        scrolled
          ? 'border-b border-white/10 bg-gray-950/60 shadow-lg shadow-black/20 backdrop-blur-xl'
          : 'bg-gray-950/20 backdrop-blur-sm'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/" className="flex items-center gap-3">
              <LogoIcon size={32} animated />
              <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-xl font-bold text-transparent">
                CGraph
              </span>
            </Link>
          </motion.div>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-8 md:flex">
            {['Features', 'Security', 'Pricing'].map((item, index) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="relative text-sm text-gray-400 transition-colors hover:text-white"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {item}
                <motion.span
                  className="absolute -bottom-1 left-0 h-0.5 w-0 bg-gradient-to-r from-emerald-400 to-cyan-400"
                  whileHover={{ width: '100%' }}
                  transition={{ duration: 0.2 }}
                />
              </motion.a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden items-center gap-4 md:flex">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <Link
                to="/login"
                className="text-sm text-gray-400 transition-all duration-300 hover:text-white"
              >
                Sign In
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/register"
                className="rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:shadow-emerald-500/40"
              >
                Get Started
              </Link>
            </motion.div>
          </div>

          {/* Mobile menu button */}
          <button
            className="text-gray-300 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-white/5 bg-gray-950/95 md:hidden"
            >
              <div className="space-y-2 px-4 py-4">
                {['Features', 'Security', 'Pricing'].map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="block py-2 text-gray-300"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item}
                  </a>
                ))}
                <div className="flex gap-2 pt-4">
                  <Link
                    to="/login"
                    className="flex-1 rounded-lg border border-gray-700 py-2 text-center text-white"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="flex-1 rounded-lg bg-emerald-500 py-2 text-center text-white"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
});

// =============================================================================
// HERO SECTION WITH VIDEO BACKGROUND
// =============================================================================

function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const sublineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero entrance animations
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from(headlineRef.current, {
        y: 100,
        opacity: 0,
        duration: 1,
        delay: 0.3,
      })
        .from(
          sublineRef.current,
          {
            y: 50,
            opacity: 0,
            duration: 0.8,
          },
          '-=0.5'
        )
        .from(
          ctaRef.current,
          {
            y: 30,
            opacity: 0,
            duration: 0.8,
          },
          '-=0.6'
        )
        .from(
          statsRef.current?.children || [],
          {
            y: 40,
            opacity: 0,
            duration: 0.6,
            stagger: 0.1,
          },
          '-=0.4'
        );

      // Parallax effect on scroll
      if (videoRef.current) {
        gsap.to(videoRef.current, {
          y: 300,
          opacity: 0.3,
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        });
      }
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-950 pt-16"
    >
      {/* Video Background */}
      <div ref={videoRef} className="absolute inset-0 opacity-20">
        {/* Placeholder for video - can be replaced with actual video */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-purple-500/10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
              radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 40% 20%, rgba(6, 182, 212, 0.1) 0%, transparent 50%)
            `,
            }}
          />
        </div>
        {/* Actual video element (commented for now, can be enabled with real video) */}
        {/* <video
          className="h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/videos/hero-bg.mp4" type="video/mp4" />
        </video> */}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950/50 via-gray-950/70 to-gray-950" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-20 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 backdrop-blur-sm"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          <span className="text-sm text-emerald-400">v0.9.2 — New GSAP-Powered UI</span>
        </motion.div>

        {/* Headline */}
        <h1
          ref={headlineRef}
          className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-7xl"
        >
          Communication{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Reimagined
          </span>
        </h1>

        {/* Subheadline */}
        <p ref={sublineRef} className="mx-auto mb-10 max-w-2xl text-lg text-gray-400 sm:text-xl">
          The privacy-first platform combining{' '}
          <span className="text-emerald-400">encrypted messaging</span>,{' '}
          <span className="text-cyan-400">community forums</span>, and{' '}
          <span className="text-purple-400">voice calls</span>.
        </p>

        {/* CTAs */}
        <div ref={ctaRef} className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/register"
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 hover:shadow-emerald-500/40 sm:w-auto"
          >
            Start Free Today
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <a
            href="#features"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-700 bg-gray-800/50 px-8 py-4 text-lg font-medium text-white backdrop-blur-sm transition-all hover:scale-105 hover:border-gray-600 sm:w-auto"
          >
            Learn More
          </a>
        </div>

        {/* Stats */}
        <div ref={statsRef} className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-white sm:text-3xl">
                {stat.suffix && stat.value.match(/^\d+$/) ? '<' : ''}
                {stat.value}
                {stat.suffix}
              </div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex h-8 w-5 items-start justify-center rounded-full border border-gray-600 pt-1.5"
        >
          <div className="h-1.5 w-0.5 rounded-full bg-gray-400" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// =============================================================================
// FEATURES SECTION WITH 3D TILT CARDS
// =============================================================================

function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate cards on scroll
      gsap.from(cardsRef.current?.children || [], {
        y: 100,
        opacity: 0,
        stagger: 0.15,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: cardsRef.current,
          start: 'top 80%',
          end: 'bottom 20%',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="features" className="relative bg-gray-950 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 text-center">
          <motion.span
            className="mb-4 inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-sm text-emerald-400"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            Features
          </motion.span>
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            Everything You{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Need
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-gray-400">
            A complete platform built for privacy, performance, and community.
          </p>
        </div>

        {/* Feature cards with 3D tilt */}
        <div ref={cardsRef} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <TiltCard3D key={feature.title} className="h-full">
              <div className="group relative h-full overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-gray-700">
                {/* Gradient glow */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                />

                {/* Content */}
                <div className="relative z-10">
                  <span className="mb-4 block text-4xl">{feature.icon}</span>
                  <h3 className="mb-2 text-lg font-semibold text-white transition-colors group-hover:text-emerald-400">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-400">{feature.description}</p>
                </div>
              </div>
            </TiltCard3D>
          ))}
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// SECURITY SECTION WITH ANIMATIONS
// =============================================================================

function SecuritySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate lock icon
      if (lockRef.current) {
        gsap.to(lockRef.current, {
          rotation: 360,
          duration: 20,
          repeat: -1,
          ease: 'none',
        });
      }

      // Animate security features
      gsap.from('.security-feature', {
        x: -50,
        opacity: 0,
        stagger: 0.15,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const securityFeatures = [
    { icon: '🛡️', title: 'Zero-Knowledge', desc: 'We cannot read your messages' },
    { icon: '🔑', title: 'X3DH Protocol', desc: 'Industry-standard key exchange' },
    { icon: '🔄', title: 'Double Ratchet', desc: 'Forward secrecy per message' },
    { icon: '📱', title: 'Multi-Device', desc: 'Seamless sync everywhere' },
    { icon: '🔒', title: 'HTTP-Only', desc: 'XSS-resistant sessions' },
    { icon: '✅', title: 'Open Source', desc: 'Transparent & auditable' },
  ];

  return (
    <section ref={sectionRef} id="security" className="relative bg-gray-900 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left - Content */}
          <div>
            <motion.span
              className="mb-4 inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-sm text-emerald-400"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              🔐 Security First
            </motion.span>
            <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl">
              Your Privacy is{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Non-Negotiable
              </span>
            </h2>
            <p className="mb-8 text-gray-400">
              We implement encryption inspired by the Signal Protocol. Your messages are encrypted
              end-to-end — only you and your recipients can read them.
            </p>

            {/* Animated lock icon */}
            <div ref={lockRef} className="mb-8 inline-block text-6xl">
              🔐
            </div>

            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-white transition-all hover:scale-105 hover:bg-emerald-600"
            >
              Start Secure Messaging →
            </Link>
          </div>

          {/* Right - Security Features Grid */}
          <div className="grid grid-cols-2 gap-4">
            {securityFeatures.map((item) => (
              <TiltCard3D key={item.title} className="security-feature h-full">
                <div className="h-full rounded-xl border border-gray-800 bg-gray-800/50 p-4 backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/30">
                  <span className="mb-2 block text-2xl">{item.icon}</span>
                  <div className="text-sm font-medium text-white">{item.title}</div>
                  <div className="text-xs text-gray-500">{item.desc}</div>
                </div>
              </TiltCard3D>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// PRICING SECTION
// =============================================================================

function PricingSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.pricing-card', {
        y: 80,
        opacity: 0,
        stagger: 0.2,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="pricing" className="relative bg-gray-950 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 text-center">
          <motion.span
            className="mb-4 inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-sm text-emerald-400"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            Pricing
          </motion.span>
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            Simple, Transparent{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Pricing
            </span>
          </h2>
        </div>

        {/* Cards */}
        <div className="grid gap-8 md:grid-cols-3">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`pricing-card relative rounded-2xl p-8 ${
                tier.highlighted
                  ? 'border-2 border-emerald-500 bg-gradient-to-b from-emerald-950/50 to-gray-900'
                  : 'border border-gray-800 bg-gray-900/50'
              }`}
            >
              {tier.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-xs font-medium text-white">
                  Most Popular
                </span>
              )}

              <div className="mb-6 text-center">
                <h3 className="mb-2 text-xl font-bold text-white">{tier.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-white">{tier.price}</span>
                  <span className="text-gray-400">{tier.period}</span>
                </div>
                <p className="mt-2 text-sm text-gray-400">{tier.description}</p>
              </div>

              <ul className="mb-8 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-gray-300">
                    <svg
                      className="h-4 w-4 text-emerald-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className={`block rounded-lg py-3 text-center font-medium transition-all hover:scale-105 ${
                  tier.highlighted
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'border border-gray-700 text-white hover:bg-gray-800'
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// CTA SECTION
// =============================================================================

function CTASection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.cta-content', {
        y: 60,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-gray-900 py-24">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-purple-500/10" />

      <div className="cta-content relative mx-auto max-w-4xl px-4 text-center">
        <span className="mb-6 inline-block text-5xl">🚀</span>
        <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
          Ready for{' '}
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            True Privacy?
          </span>
        </h2>
        <p className="mx-auto mb-10 max-w-xl text-gray-400">
          Join thousands building the future of secure communication.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/register"
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-4 font-semibold text-white shadow-lg transition-transform hover:scale-105 sm:w-auto"
          >
            Create Free Account →
          </Link>
          <Link
            to="/login"
            className="w-full rounded-xl border border-gray-700 bg-gray-800/50 px-8 py-4 font-semibold text-white transition-transform hover:scale-105 sm:w-auto"
          >
            Sign In
          </Link>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// FOOTER
// =============================================================================

function Footer() {
  const year = new Date().getFullYear();
  const links = {
    Product: ['Features', 'Security', 'Pricing'],
    Resources: ['Documentation', 'API', 'Status'],
    Company: ['About', 'Careers', 'Contact'],
    Legal: ['Privacy', 'Terms', 'GDPR'],
  };

  return (
    <footer className="border-t border-white/5 bg-gray-950 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 grid grid-cols-2 gap-8 md:grid-cols-4">
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="mb-3 text-sm font-semibold text-white">{category}</h4>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item}>
                    <Link
                      to={`/${item.toLowerCase()}`}
                      className="text-sm text-gray-500 hover:text-gray-300"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-white/5 pt-8">
          <div className="flex items-center gap-2">
            <LogoIcon size={24} />
            <span className="text-sm text-gray-500">© {year} CGraph</span>
          </div>
          <div className="flex gap-4">
            <a href="https://twitter.com" className="text-gray-500 hover:text-gray-300">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a href="https://github.com" className="text-gray-500 hover:text-gray-300">
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
// MAIN
// =============================================================================

export default function LandingPageGSAP() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/messages', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Cleanup ScrollTrigger on unmount
  useEffect(() => {
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-950">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <SecuritySection />

      {/* Forum Showcase - Lazy loaded */}
      <Suspense fallback={<div className="h-96 bg-gray-950" />}>
        <div id="forums">
          <ForumShowcase />
        </div>
      </Suspense>

      {/* Customization Demo - Lazy loaded */}
      <Suspense fallback={<div className="h-96 bg-gray-950" />}>
        <div id="demo">
          <CustomizationDemo />
        </div>
      </Suspense>

      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
}

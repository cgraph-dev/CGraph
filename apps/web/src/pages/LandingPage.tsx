import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import AnimatedLogo from '@/components/AnimatedLogo';

// =============================================================================
// CGRAPH LANDING PAGE
// =============================================================================
// Full marketing landing page with:
// - Animated hero section with particle effects
// - Feature showcase with parallax scrolling
// - Security & encryption highlights
// - Pricing tiers with premium features
// - Social proof & testimonials
// - Call-to-action sections
// =============================================================================

// Feature data
const features = [
  {
    icon: '🔐',
    title: 'End-to-End Encryption',
    description:
      'Signal Protocol-inspired encryption with X3DH key agreement and Double Ratchet for forward secrecy. Your messages stay private.',
    gradient: 'from-purple-500 to-indigo-600',
  },
  {
    icon: '💬',
    title: 'Real-Time Messaging',
    description:
      'Sub-200ms message delivery with WebSocket channels. Support for text, images, files, voice messages, and reactions.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: '🏛️',
    title: 'Forums & Communities',
    description:
      'Reddit-style communities with MyBB forum features. Boards, threads, voting, moderation, and plugins.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: '👥',
    title: 'Groups & Channels',
    description:
      'Discord-style servers with roles, permissions, and organized channels for text and voice communication.',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    icon: '📞',
    title: 'Voice & Video Calls',
    description:
      'WebRTC-powered calling with spatial audio, screen sharing, and support for group calls up to 25 participants.',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    icon: '🎮',
    title: 'Gamification',
    description:
      'XP, levels, achievements, quests, and custom titles. Turn engagement into rewards with our built-in economy.',
    gradient: 'from-violet-500 to-purple-600',
  },
];

// Security features
const securityFeatures = [
  {
    icon: '🛡️',
    title: 'Zero-Knowledge Architecture',
    description: 'We cannot read your encrypted messages',
  },
  {
    icon: '🔑',
    title: 'X3DH Key Agreement',
    description: 'Industry-standard initial key exchange',
  },
  {
    icon: '🔄',
    title: 'Double Ratchet Protocol',
    description: 'Forward secrecy for every message',
  },
  {
    icon: '📱',
    title: 'Multi-Device Support',
    description: 'Seamless sync across all your devices',
  },
  { icon: '🔒', title: 'HTTP-Only Cookies', description: 'XSS-resistant session management' },
  { icon: '✅', title: 'Open Source', description: 'Audit our code and verify our claims' },
];

// Pricing tiers
const pricingTiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Everything you need to get started',
    features: [
      'Unlimited encrypted messaging',
      'Join up to 10 forums',
      'Create 3 groups',
      'Voice calls (1-on-1)',
      '100MB file storage',
      'Basic customization',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Premium',
    price: '$9',
    period: '/month',
    description: 'For power users and community leaders',
    features: [
      'Everything in Free, plus:',
      'Unlimited forum creation',
      'Create unlimited groups',
      'Group video calls (up to 25)',
      '10GB file storage',
      'Custom titles & badges',
      'Priority support',
      'Ad-free experience',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For organizations and teams',
    features: [
      'Everything in Premium, plus:',
      'Custom branding',
      'SSO/SAML integration',
      'Advanced admin controls',
      'Audit logging',
      'Dedicated support',
      'SLA guarantees',
      'On-premise option',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

// Stats
const stats = [
  { value: '100K+', label: 'Active Users' },
  { value: '1M+', label: 'Messages Daily' },
  { value: '99.9%', label: 'Uptime' },
  { value: '<100ms', label: 'Message Latency' },
];

// Testimonials
const testimonials = [
  {
    quote:
      'Finally, a platform that takes privacy seriously without sacrificing features. The E2EE implementation is top-notch.',
    author: 'Sarah Chen',
    role: 'Security Researcher',
    avatar: 'SC',
  },
  {
    quote:
      'We migrated our entire community from Discord. The forum features combined with real-time chat is exactly what we needed.',
    author: 'Marcus Johnson',
    role: 'Community Manager',
    avatar: 'MJ',
  },
  {
    quote:
      'The gamification system keeps our members engaged. XP, quests, and titles have increased our retention by 40%.',
    author: 'Alex Rivera',
    role: 'Startup Founder',
    avatar: 'AR',
  },
];

// Animated background particles
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
    }> = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${particle.opacity})`;
        ctx.fill();
      });

      // Draw connections
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.1 * (1 - distance / 150)})`;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0"
      style={{ opacity: 0.6 }}
    />
  );
}

// Navigation component
function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-gray-900/95 shadow-lg backdrop-blur-md' : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <AnimatedLogo size="sm" />
            <span className="bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-xl font-semibold tracking-tight text-transparent">
              CGraph
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-gray-300 transition-colors hover:text-white">
              Features
            </a>
            <a href="#security" className="text-gray-300 transition-colors hover:text-white">
              Security
            </a>
            <a href="#pricing" className="text-gray-300 transition-colors hover:text-white">
              Pricing
            </a>
            <a
              href="https://docs.cgraph.org"
              className="text-gray-300 transition-colors hover:text-white"
            >
              Docs
            </a>
          </div>

          {/* Auth buttons */}
          <div className="hidden items-center gap-4 md:flex">
            <Link
              to="/login"
              className="px-4 py-2 text-gray-300 transition-colors hover:text-white"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-2 font-medium text-white shadow-lg shadow-purple-500/25 transition-all hover:from-purple-600 hover:to-indigo-700 hover:shadow-purple-500/40"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="text-gray-300 hover:text-white md:hidden"
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
              className="rounded-b-xl bg-gray-900/95 backdrop-blur-md md:hidden"
            >
              <div className="space-y-4 px-4 py-4">
                <a
                  href="#features"
                  className="block text-gray-300 transition-colors hover:text-white"
                >
                  Features
                </a>
                <a
                  href="#security"
                  className="block text-gray-300 transition-colors hover:text-white"
                >
                  Security
                </a>
                <a
                  href="#pricing"
                  className="block text-gray-300 transition-colors hover:text-white"
                >
                  Pricing
                </a>
                <a
                  href="https://docs.cgraph.org"
                  className="block text-gray-300 transition-colors hover:text-white"
                >
                  Docs
                </a>
                <div className="space-y-2 border-t border-gray-800 pt-4">
                  <Link
                    to="/login"
                    className="block px-4 py-2 text-center text-gray-300 transition-colors hover:text-white"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="block rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-2 text-center font-medium text-white"
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
  );
}

// Hero section
function HeroSection() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950">
      <ParticleField />

      {/* Gradient orbs */}
      <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />

      <motion.div
        style={{ y, opacity }}
        className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-24 text-center sm:px-6 lg:px-8"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          <span className="text-sm font-medium text-purple-300">
            v0.9.2 — E2EE Video Calls Now Available
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mb-6 text-5xl font-bold text-white sm:text-6xl lg:text-7xl"
        >
          Communication{' '}
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
            Reimagined
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mx-auto mb-10 max-w-3xl text-xl text-gray-400 sm:text-2xl"
        >
          The privacy-first platform that combines encrypted messaging, community forums, and voice
          calls — all in one beautiful experience.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            to="/register"
            className="group relative w-full rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-purple-500/25 transition-all hover:scale-105 hover:from-purple-600 hover:to-indigo-700 hover:shadow-purple-500/40 sm:w-auto"
          >
            <span className="relative z-10">Start Free Today</span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-700 opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
          <a
            href="https://github.com/cgraph-org/cgraph"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-8 py-4 text-lg font-semibold text-white transition-all hover:border-gray-600 hover:bg-gray-700 sm:w-auto"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            View on GitHub
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20 grid grid-cols-2 gap-8 md:grid-cols-4"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="mb-2 text-3xl font-bold text-white sm:text-4xl">{stat.value}</div>
              <div className="text-gray-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 transform"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-gray-600 pt-2"
          >
            <div className="h-2 w-1 rounded-full bg-gray-400" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

// Features section
function FeaturesSection() {
  return (
    <section id="features" className="relative overflow-hidden bg-gray-950 py-24">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.05),transparent_70%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-4xl font-bold text-white sm:text-5xl">Everything You Need</h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-400">
            A complete communication platform built for privacy, performance, and community.
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative rounded-2xl border border-gray-800 bg-gray-900/50 p-8 backdrop-blur-sm transition-all duration-300 hover:border-purple-500/50"
            >
              {/* Gradient glow on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-5`}
              />

              <div className="relative z-10">
                <div className="mb-4 text-4xl">{feature.icon}</div>
                <h3 className="mb-3 text-xl font-semibold text-white">{feature.title}</h3>
                <p className="leading-relaxed text-gray-400">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Security section
function SecuritySection() {
  return (
    <section id="security" className="relative overflow-hidden bg-gray-900 py-24">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(139, 92, 246, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2">
              <span className="text-sm font-medium text-green-400">Security First</span>
            </div>
            <h2 className="mb-6 text-4xl font-bold text-white sm:text-5xl">
              Your Privacy is{' '}
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Non-Negotiable
              </span>
            </h2>
            <p className="mb-8 text-xl leading-relaxed text-gray-400">
              We implement encryption inspired by the Signal Protocol. Your messages are encrypted
              end-to-end, meaning only you and your recipients can read them.
            </p>
            <div className="space-y-4">
              {securityFeatures.slice(0, 3).map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="text-2xl">{item.icon}</div>
                  <div>
                    <div className="font-medium text-white">{item.title}</div>
                    <div className="text-sm text-gray-400">{item.description}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Security features grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 gap-4"
          >
            {securityFeatures.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="rounded-xl border border-gray-700 bg-gray-800/50 p-6 transition-colors hover:border-green-500/30"
              >
                <div className="mb-3 text-3xl">{item.icon}</div>
                <div className="mb-1 text-sm font-medium text-white">{item.title}</div>
                <div className="text-xs text-gray-500">{item.description}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Pricing section
function PricingSection() {
  return (
    <section id="pricing" className="relative overflow-hidden bg-gray-950 py-24">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.1),transparent_50%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-4xl font-bold text-white sm:text-5xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-400">
            Start free and upgrade when you're ready. No hidden fees, no surprises.
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative rounded-2xl p-8 ${
                tier.highlighted
                  ? 'scale-105 border-2 border-purple-500 bg-gradient-to-b from-purple-900/50 to-gray-900'
                  : 'border border-gray-800 bg-gray-900/50'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
                  <span className="rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-1 text-sm font-medium text-white">
                    Most Popular
                  </span>
                </div>
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
                      className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500"
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
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className={`block rounded-xl px-6 py-3 text-center font-semibold transition-all ${
                  tier.highlighted
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25 hover:from-purple-600 hover:to-indigo-700'
                    : 'border border-gray-700 bg-gray-800 text-white hover:bg-gray-700'
                }`}
              >
                {tier.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Testimonials section
function TestimonialsSection() {
  return (
    <section className="relative overflow-hidden bg-gray-900 py-24">
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-4xl font-bold text-white sm:text-5xl">Loved by Communities</h2>
          <p className="text-xl text-gray-400">See what our users are saying about CGraph.</p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="rounded-2xl border border-gray-700 bg-gray-800/50 p-8"
            >
              <div className="mb-4 flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="h-5 w-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="mb-6 italic text-gray-300">"{testimonial.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 font-medium text-white">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-medium text-white">{testimonial.author}</div>
                  <div className="text-sm text-gray-400">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Final CTA section
function CTASection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gray-950 to-gray-900 py-24">
      {/* Gradient orbs */}
      <div className="absolute left-1/4 top-1/2 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-6 text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
            Ready to Experience{' '}
            <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              True Privacy?
            </span>
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-xl text-gray-400">
            Join thousands of users who have already made the switch to secure, privacy-first
            communication. It's free to get started.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/register"
              className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 px-10 py-4 text-lg font-semibold text-white shadow-xl shadow-purple-500/25 transition-all hover:scale-105 hover:from-purple-600 hover:to-indigo-700 hover:shadow-purple-500/40 sm:w-auto"
            >
              Create Free Account
            </Link>
            <Link
              to="/login"
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-10 py-4 text-lg font-semibold text-white transition-all hover:bg-gray-700 sm:w-auto"
            >
              Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-800 bg-gray-950 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Product */}
          <div>
            <h4 className="mb-4 font-semibold text-white">Product</h4>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="text-gray-400 transition-colors hover:text-white">
                  Features
                </a>
              </li>
              <li>
                <a href="#security" className="text-gray-400 transition-colors hover:text-white">
                  Security
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-gray-400 transition-colors hover:text-white">
                  Pricing
                </a>
              </li>
              <li>
                <Link to="/login" className="text-gray-400 transition-colors hover:text-white">
                  Download
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="mb-4 font-semibold text-white">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://docs.cgraph.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://docs.cgraph.org/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  API Reference
                </a>
              </li>
              <li>
                <Link to="/status" className="text-gray-400 transition-colors hover:text-white">
                  Status
                </Link>
              </li>
              <li>
                <a
                  href="https://blog.cgraph.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-4 font-semibold text-white">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-400 transition-colors hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-gray-400 transition-colors hover:text-white">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 transition-colors hover:text-white">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/press" className="text-gray-400 transition-colors hover:text-white">
                  Press
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 font-semibold text-white">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-gray-400 transition-colors hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 transition-colors hover:text-white">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-gray-400 transition-colors hover:text-white">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/gdpr" className="text-gray-400 transition-colors hover:text-white">
                  GDPR
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-800 pt-8 md:flex-row">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <AnimatedLogo size="sm" />
            <span className="text-gray-400">© {currentYear} CGraph. All rights reserved.</span>
          </div>

          {/* Social links */}
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/cgraph-org"
              className="text-gray-400 transition-colors hover:text-white"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
            <a
              href="https://twitter.com/cgraph_org"
              className="text-gray-400 transition-colors hover:text-white"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a
              href="https://discord.gg/cgraph"
              className="text-gray-400 transition-colors hover:text-white"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Main Landing Page component
export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // Redirect authenticated users to messages
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/messages', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <SecuritySection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}

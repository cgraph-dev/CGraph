import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import AnimatedLogo from '@/components/AnimatedLogo';

// =============================================================================
// CGRAPH LANDING PAGE - ENHANCED VERSION
// =============================================================================
// Full marketing landing page with:
// - Matrix-inspired particle effects with glow
// - Glassmorphism cards with animated borders
// - Cyberpunk-style scanlines and holographic effects
// - 3D floating elements with parallax
// - Animated gradient text with shimmer
// - Interactive hover states
// =============================================================================

// Feature data
const features = [
  {
    icon: '🔐',
    title: 'End-to-End Encryption',
    description:
      'Signal Protocol-inspired encryption with X3DH key agreement and Double Ratchet for forward secrecy. Your messages stay private.',
    gradient: 'from-purple-500 to-indigo-600',
    glowColor: 'rgba(139, 92, 246, 0.4)',
  },
  {
    icon: '💬',
    title: 'Real-Time Messaging',
    description:
      'Sub-200ms message delivery with WebSocket channels. Support for text, images, files, voice messages, and reactions.',
    gradient: 'from-blue-500 to-cyan-500',
    glowColor: 'rgba(6, 182, 212, 0.4)',
  },
  {
    icon: '🏛️',
    title: 'Forums & Communities',
    description:
      'Reddit-style communities with MyBB forum features. Boards, threads, voting, moderation, and plugins.',
    gradient: 'from-emerald-500 to-teal-500',
    glowColor: 'rgba(16, 185, 129, 0.4)',
  },
  {
    icon: '👥',
    title: 'Groups & Channels',
    description:
      'Discord-style servers with roles, permissions, and organized channels for text and voice communication.',
    gradient: 'from-orange-500 to-red-500',
    glowColor: 'rgba(249, 115, 22, 0.4)',
  },
  {
    icon: '📞',
    title: 'Voice & Video Calls',
    description:
      'WebRTC-powered calling with spatial audio, screen sharing, and support for group calls up to 25 participants.',
    gradient: 'from-pink-500 to-rose-500',
    glowColor: 'rgba(236, 72, 153, 0.4)',
  },
  {
    icon: '🎮',
    title: 'Gamification',
    description:
      'XP, levels, achievements, quests, and custom titles. Turn engagement into rewards with our built-in economy.',
    gradient: 'from-violet-500 to-purple-600',
    glowColor: 'rgba(139, 92, 246, 0.4)',
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
  {
    icon: '✅',
    title: 'Auditable Security',
    description: 'Transparent about our security practices',
  },
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

// Feature highlights
const highlights = [
  { value: 'E2EE', label: 'End-to-End Encrypted', icon: '🔐' },
  { value: 'Real-Time', label: 'Instant Messaging', icon: '⚡' },
  { value: 'Forums', label: 'Community Features', icon: '🏛️' },
  { value: 'WebRTC', label: 'Voice & Video', icon: '📞' },
];

// Empty testimonials for now
const testimonials: Array<{
  quote: string;
  author: string;
  role: string;
  avatar: string;
}> = [];

// =============================================================================
// ANIMATED COMPONENTS
// =============================================================================

// Matrix-style rain effect
function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const chars =
      'CGRAPH01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = [];

    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100;
    }

    let animationId: number;

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#10b981';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)] ?? '0';
        const x = i * fontSize;
        const dropValue = drops[i] ?? 0;
        const y = dropValue * fontSize;

        // Gradient effect - brighter at the bottom
        const gradient = ctx.createLinearGradient(x, y - fontSize * 10, x, y);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.8)');
        ctx.fillStyle = gradient;

        ctx.fillText(char, x, y);

        if (y > canvas.height && Math.random() > 0.98) {
          drops[i] = 0;
        }
        drops[i] = dropValue + 0.5;
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0"
      style={{ opacity: 0.15 }}
    />
  );
}

// Enhanced particle field with glow
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

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
      hue: number;
      pulse: number;
    }> = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);

    // Create particles
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.6 + 0.2,
        hue: Math.random() * 60 + 120, // Green to cyan range
        pulse: Math.random() * Math.PI * 2,
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        // Mouse attraction
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          particle.vx += dx * 0.00005;
          particle.vy += dy * 0.00005;
        }

        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.pulse += 0.02;

        // Damping
        particle.vx *= 0.99;
        particle.vy *= 0.99;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Pulsing size
        const pulseSize = particle.size + Math.sin(particle.pulse) * 0.5;

        // Draw glow
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          pulseSize * 4
        );
        gradient.addColorStop(0, `hsla(${particle.hue}, 80%, 60%, ${particle.opacity * 0.8})`);
        gradient.addColorStop(0.5, `hsla(${particle.hue}, 80%, 50%, ${particle.opacity * 0.3})`);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, pulseSize * 4, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw core
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particle.hue}, 90%, 70%, ${particle.opacity})`;
        ctx.fill();
      });

      // Draw connections
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            const opacity = 0.15 * (1 - distance / 150);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            const avgHue = (p1.hue + p2.hue) / 2;
            ctx.strokeStyle = `hsla(${avgHue}, 70%, 50%, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0"
      style={{ opacity: 0.8 }}
    />
  );
}

// Scanline overlay effect
function ScanlineOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.03) 2px, rgba(0, 0, 0, 0.03) 4px)',
        }}
      />
      <motion.div
        className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"
        animate={{ y: ['0vh', '100vh'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

// Animated gradient border
function AnimatedBorder({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`group relative ${className}`}>
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500 opacity-0 blur-sm transition-opacity duration-500 group-hover:opacity-100" />
      <div
        className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500 opacity-20"
        style={{
          backgroundSize: '200% 200%',
          animation: 'gradient-shift 3s ease infinite',
        }}
      />
      <div className="relative rounded-2xl bg-gray-900/90 backdrop-blur-xl">{children}</div>
    </div>
  );
}

// Glowing text component
function GlowingText({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`relative ${className}`}>
      <span className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent opacity-50 blur-xl">
        {children}
      </span>
      <span className="relative bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
        {children}
      </span>
    </span>
  );
}

// Floating card with 3D effect
function FloatingCard({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-100, 100], [10, -10]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(x, [-100, 100], [-10, 10]), {
    stiffness: 300,
    damping: 30,
  });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`${className}`}
    >
      {children}
    </motion.div>
  );
}

// =============================================================================
// MAIN SECTIONS
// =============================================================================

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
          {/* Logo */}
          <Link to="/" className="group flex items-center gap-3">
            <AnimatedLogo size="sm" />
            <span className="text-xl font-bold tracking-tight">
              <GlowingText>CGraph</GlowingText>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            {['Features', 'Security', 'Pricing'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="group relative text-gray-400 transition-colors hover:text-white"
              >
                {item}
                <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
            <a
              href="https://docs.cgraph.org"
              className="group relative text-gray-400 transition-colors hover:text-white"
            >
              Docs
              <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300 group-hover:w-full" />
            </a>
          </div>

          {/* Auth buttons */}
          <div className="hidden items-center gap-4 md:flex">
            <Link
              to="/login"
              className="px-4 py-2 text-gray-400 transition-colors hover:text-white"
            >
              Sign In
            </Link>
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
              className="rounded-b-xl border-t border-emerald-500/10 bg-gray-900/95 backdrop-blur-xl md:hidden"
            >
              <div className="space-y-4 px-4 py-4">
                <a
                  href="#features"
                  className="block text-gray-300 transition-colors hover:text-emerald-400"
                >
                  Features
                </a>
                <a
                  href="#security"
                  className="block text-gray-300 transition-colors hover:text-emerald-400"
                >
                  Security
                </a>
                <a
                  href="#pricing"
                  className="block text-gray-300 transition-colors hover:text-emerald-400"
                >
                  Pricing
                </a>
                <a
                  href="https://docs.cgraph.org"
                  className="block text-gray-300 transition-colors hover:text-emerald-400"
                >
                  Docs
                </a>
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
  );
}

// Hero section
function HeroSection() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-950">
      {/* Backgrounds */}
      <MatrixRain />
      <ParticleField />
      <ScanlineOverlay />

      {/* Gradient orbs */}
      <motion.div
        className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-emerald-600/20 blur-[100px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-cyan-600/20 blur-[100px]"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.2, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute right-1/3 top-1/3 h-[300px] w-[300px] rounded-full bg-purple-600/15 blur-[80px]"
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      <motion.div
        style={{ y, opacity }}
        className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-24 text-center sm:px-6 lg:px-8"
      >
        {/* Badge */}
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
            v0.9.3 — Next-Gen UI Now Available
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mb-6 text-5xl font-bold text-white sm:text-6xl lg:text-7xl"
        >
          Communication <GlowingText>Reimagined</GlowingText>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mx-auto mb-10 max-w-3xl text-xl text-gray-400 sm:text-2xl"
        >
          The privacy-first platform that combines{' '}
          <span className="text-emerald-400">encrypted messaging</span>,{' '}
          <span className="text-cyan-400">community forums</span>, and{' '}
          <span className="text-purple-400">voice calls</span> — all in one beautiful experience.
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
            className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 sm:w-auto"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Start Free Today
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.span>
            </span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600"
              initial={{ x: '-100%' }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.3 }}
            />
          </Link>
          <a
            href="#features"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-700 bg-gray-800/50 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition-all hover:border-emerald-500/50 hover:bg-gray-800 sm:w-auto"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
            Learn More
          </a>
        </motion.div>

        {/* Feature Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20 grid grid-cols-2 gap-8 md:grid-cols-4"
        >
          {highlights.map((item, index) => (
            <motion.div
              key={item.label}
              className="group text-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <motion.div
                className="mb-2 text-4xl"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, delay: index * 0.2, repeat: Infinity }}
              >
                {item.icon}
              </motion.div>
              <div className="mb-1 text-2xl font-bold text-white transition-colors group-hover:text-emerald-400 sm:text-3xl">
                {item.value}
              </div>
              <div className="text-sm text-gray-500">{item.label}</div>
            </motion.div>
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
    </section>
  );
}

// Features section
function FeaturesSection() {
  return (
    <section id="features" className="relative overflow-hidden bg-gray-950 py-24">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.05),transparent_70%)]" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(16, 185, 129, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(16, 185, 129, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <motion.span
            className="mb-4 inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-sm font-medium text-emerald-400"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            Powerful Features
          </motion.span>
          <h2 className="mb-4 text-4xl font-bold text-white sm:text-5xl">
            Everything You <GlowingText>Need</GlowingText>
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-400">
            A complete communication platform built for privacy, performance, and community.
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FloatingCard key={feature.title} delay={index * 0.1}>
              <AnimatedBorder>
                <div className="group relative overflow-hidden rounded-2xl p-8 transition-all duration-500">
                  {/* Glow effect */}
                  <div
                    className="absolute -inset-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(circle at center, ${feature.glowColor}, transparent 70%)`,
                      filter: 'blur(20px)',
                    }}
                  />

                  <div className="relative z-10">
                    <motion.div
                      className="mb-4 text-5xl"
                      whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      {feature.icon}
                    </motion.div>
                    <h3 className="mb-3 text-xl font-semibold text-white transition-colors group-hover:text-emerald-400">
                      {feature.title}
                    </h3>
                    <p className="leading-relaxed text-gray-400">{feature.description}</p>
                  </div>
                </div>
              </AnimatedBorder>
            </FloatingCard>
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
            linear-gradient(to right, rgba(16, 185, 129, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      <ScanlineOverlay />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2">
              <span className="text-sm font-medium text-emerald-400">🔐 Security First</span>
            </div>
            <h2 className="mb-6 text-4xl font-bold text-white sm:text-5xl">
              Your Privacy is <GlowingText>Non-Negotiable</GlowingText>
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
                  className="group flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-emerald-500/5"
                >
                  <motion.div className="text-2xl" whileHover={{ scale: 1.2 }}>
                    {item.icon}
                  </motion.div>
                  <div>
                    <div className="font-medium text-white transition-colors group-hover:text-emerald-400">
                      {item.title}
                    </div>
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
              <FloatingCard key={item.title} delay={index * 0.1}>
                <div className="group rounded-xl border border-gray-700 bg-gray-800/50 p-6 backdrop-blur-sm transition-all hover:border-emerald-500/50 hover:bg-gray-800/80">
                  <motion.div
                    className="mb-3 text-3xl"
                    whileHover={{ scale: 1.3, rotate: 10 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    {item.icon}
                  </motion.div>
                  <div className="mb-1 text-sm font-medium text-white transition-colors group-hover:text-emerald-400">
                    {item.title}
                  </div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </FloatingCard>
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.1),transparent_50%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <motion.span
            className="mb-4 inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-sm font-medium text-emerald-400"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            Simple Pricing
          </motion.span>
          <h2 className="mb-4 text-4xl font-bold text-white sm:text-5xl">
            Transparent <GlowingText>Pricing</GlowingText>
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-400">
            Start free and upgrade when you're ready. No hidden fees, no surprises.
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {pricingTiers.map((tier, index) => (
            <FloatingCard key={tier.name} delay={index * 0.1}>
              <div
                className={`relative rounded-2xl p-8 ${
                  tier.highlighted
                    ? 'scale-105 border-2 border-emerald-500 bg-gradient-to-b from-emerald-900/30 to-gray-900'
                    : 'border border-gray-800 bg-gray-900/50'
                }`}
              >
                {tier.highlighted && (
                  <motion.div
                    className="absolute -top-4 left-1/2 -translate-x-1/2 transform"
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
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40'
                      : 'border border-gray-700 bg-gray-800 text-white hover:border-emerald-500/50 hover:bg-gray-700'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            </FloatingCard>
          ))}
        </div>
      </div>
    </section>
  );
}

// Testimonials section (only renders if we have testimonials)
function TestimonialsSection() {
  if (testimonials.length === 0) return null;

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
            <FloatingCard key={testimonial.author} delay={index * 0.1}>
              <div className="rounded-2xl border border-gray-700 bg-gray-800/50 p-8 backdrop-blur-sm">
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 font-medium text-white">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-medium text-white">{testimonial.author}</div>
                    <div className="text-sm text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            </FloatingCard>
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
      {/* Animated background elements */}
      <motion.div
        className="absolute left-1/4 top-1/2 h-[400px] w-[400px] rounded-full bg-emerald-600/10 blur-[100px]"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-cyan-600/10 blur-[100px]"
        animate={{
          scale: [1.3, 1, 1.3],
          opacity: [0.2, 0.1, 0.2],
        }}
        transition={{ duration: 6, repeat: Infinity }}
      />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="mb-6 inline-block text-6xl"
          >
            🚀
          </motion.div>
          <h2 className="mb-6 text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
            Ready to Experience <GlowingText>True Privacy?</GlowingText>
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-xl text-gray-400">
            Join us in building the future of secure, privacy-first communication. Sign up to be
            among the first users.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/register"
              className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-10 py-4 text-lg font-semibold text-white shadow-xl shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 sm:w-auto"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Create Free Account
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600"
                initial={{ x: '-100%' }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </Link>
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

// Footer
function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-emerald-500/10 bg-gray-950 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Product */}
          <div>
            <h4 className="mb-4 font-semibold text-white">Product</h4>
            <ul className="space-y-2">
              {['Features', 'Security', 'Pricing', 'Download'].map((item) => (
                <li key={item}>
                  <a
                    href={item === 'Download' ? '/login' : `#${item.toLowerCase()}`}
                    className="text-gray-400 transition-colors hover:text-emerald-400"
                  >
                    {item}
                  </a>
                </li>
              ))}
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
                  className="text-gray-400 transition-colors hover:text-emerald-400"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://docs.cgraph.org/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 transition-colors hover:text-emerald-400"
                >
                  API Reference
                </a>
              </li>
              <li>
                <Link
                  to="/status"
                  className="text-gray-400 transition-colors hover:text-emerald-400"
                >
                  Status
                </Link>
              </li>
              <li>
                <a
                  href="https://blog.cgraph.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 transition-colors hover:text-emerald-400"
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
              {['About', 'Careers', 'Contact', 'Press'].map((item) => (
                <li key={item}>
                  <Link
                    to={`/${item.toLowerCase()}`}
                    className="text-gray-400 transition-colors hover:text-emerald-400"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 font-semibold text-white">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/privacy"
                  className="text-gray-400 transition-colors hover:text-emerald-400"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-gray-400 transition-colors hover:text-emerald-400"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/cookies"
                  className="text-gray-400 transition-colors hover:text-emerald-400"
                >
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/gdpr" className="text-gray-400 transition-colors hover:text-emerald-400">
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
            <span className="text-gray-500">© {currentYear} CGraph. All rights reserved.</span>
          </div>

          {/* Social links */}
          <div className="flex items-center gap-4">
            <a href="/forum" className="text-gray-400 transition-colors hover:text-emerald-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                />
              </svg>
            </a>
            <a
              href="https://twitter.com/cgraph_org"
              className="text-gray-400 transition-colors hover:text-emerald-400"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
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
    <div className="min-h-screen bg-gray-950">
      {/* Add global styles for gradient animation */}
      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
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

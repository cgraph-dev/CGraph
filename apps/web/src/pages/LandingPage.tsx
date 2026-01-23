/**
 * CGraph Landing Page - GAMELAND Style
 *
 * Official landing page featuring:
 * - Instant hero animations on mount (no preloader for speed)
 * - Skeleton loaders for lazy-loaded sections
 * - Video hero section with clip-path masks
 * - Purple/lime/black color scheme
 * - Button text-swap animation
 * - 3D tilt cards with glare effect
 * - Scroll-triggered GSAP animations
 */

import { useState, useEffect, useRef, useCallback, lazy, Suspense, memo } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AnimatedAvatar } from '@/components/customize/AnimatedAvatar';
import { themeColors } from '@/stores/customizationStoreV2';
import { motion } from 'framer-motion';
import {
  CustomizationDemoSkeleton,
  ForumShowcaseSkeleton,
} from '@/components/landing/LandingSkeletons';
import './landing-page.css';

// Lazy load showcase components
const CustomizationDemo = lazy(() =>
  import('@/components/landing/CustomizationDemo').then((m) => ({ default: m.CustomizationDemo }))
);

const ForumShowcase = lazy(() =>
  import('@/components/landing/ForumShowcase').then((m) => ({ default: m.ForumShowcase }))
);

gsap.registerPlugin(ScrollTrigger);
// Performance: Throttle function for scroll handlers
const throttle = <T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
};

// =============================================================================
// DATA
// =============================================================================

const features = [
  {
    icon: '🔐',
    title: 'End-to-End Encryption',
    description:
      'Signal Protocol with X3DH key agreement and Double Ratchet algorithm. Your messages stay private.',
  },
  {
    icon: '💬',
    title: 'Real-Time Messaging',
    description:
      'Sub-200ms delivery with WebSocket channels. Feel the speed of instant communication.',
  },
  {
    icon: '🏛️',
    title: 'Forums & Communities',
    description: 'Reddit-style communities with voting, threads, and powerful moderation tools.',
  },
  {
    icon: '👥',
    title: 'Groups & Channels',
    description: 'Powerful servers with roles, permissions, and organized channel structures.',
  },
  {
    icon: '📞',
    title: 'Voice & Video Calls',
    description: 'Crystal-clear WebRTC calling with screen sharing and recording capabilities.',
  },
  {
    icon: '🎮',
    title: 'Gamification',
    description: 'Earn XP, unlock achievements, complete quests, and climb the leaderboards.',
  },
];

// Feature showcase card types for the interactive demo section
interface ShowcaseCardData {
  id: string;
  label: string;
  icon: string;
}

const showcaseCards: ShowcaseCardData[] = [
  { id: 'avatar', label: 'Avatar Borders', icon: '👤' },
  { id: 'chat', label: 'Chat Styles', icon: '💬' },
  { id: 'profile', label: 'Profile Themes', icon: '✨' },
  { id: 'title', label: 'Animated Titles', icon: '🏆' },
];

// =============================================================================
// FEATURE SHOWCASE CARDS - Interactive hover reveal demos
// =============================================================================

const FeatureShowcaseCard = memo(function FeatureShowcaseCard({
  data,
}: {
  data: ShowcaseCardData;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const renderContent = () => {
    switch (data.id) {
      case 'avatar':
        return (
          <div className="showcase-card__content">
            <div
              className={`showcase-card__state ${isHovered ? 'showcase-card__state--hidden' : 'showcase-card__state--visible'}`}
            >
              {/* Basic Avatar */}
              <div className="showcase-avatar showcase-avatar--basic">
                <div className="showcase-avatar__image">
                  <span>CG</span>
                </div>
                <span className="showcase-avatar__label">Basic</span>
              </div>
            </div>
            <div
              className={`showcase-card__state ${isHovered ? 'showcase-card__state--visible' : 'showcase-card__state--hidden'}`}
            >
              {/* Premium Avatar with AnimatedAvatar */}
              <div className="showcase-avatar showcase-avatar--premium">
                <AnimatedAvatar
                  borderType="legendary"
                  borderColor="emerald"
                  size={72}
                  initials="CG"
                />
                <span className="showcase-avatar__label showcase-avatar__label--premium">
                  Legendary
                </span>
              </div>
            </div>
          </div>
        );

      case 'chat':
        return (
          <div className="showcase-card__content">
            <div
              className={`showcase-card__state ${isHovered ? 'showcase-card__state--hidden' : 'showcase-card__state--visible'}`}
            >
              {/* Basic Chat Bubble */}
              <div className="showcase-chat">
                <div className="showcase-chat__bubble showcase-chat__bubble--basic">
                  Hello there! 👋
                </div>
                <span className="showcase-chat__label">Default</span>
              </div>
            </div>
            <div
              className={`showcase-card__state ${isHovered ? 'showcase-card__state--visible' : 'showcase-card__state--hidden'}`}
            >
              {/* Premium Chat Bubble */}
              <div className="showcase-chat">
                <div className="showcase-chat__bubble showcase-chat__bubble--premium">
                  <span className="showcase-chat__bubble-glow" />
                  Hello there! 👋
                </div>
                <span className="showcase-chat__label showcase-chat__label--premium">
                  Glass Premium
                </span>
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="showcase-card__content">
            <div
              className={`showcase-card__state ${isHovered ? 'showcase-card__state--hidden' : 'showcase-card__state--visible'}`}
            >
              {/* Basic Profile Card */}
              <div className="showcase-profile showcase-profile--basic">
                <div className="showcase-profile__avatar">CG</div>
                <div className="showcase-profile__info">
                  <span className="showcase-profile__name">CGraph User</span>
                  <span className="showcase-profile__status">Online</span>
                </div>
              </div>
            </div>
            <div
              className={`showcase-card__state ${isHovered ? 'showcase-card__state--visible' : 'showcase-card__state--hidden'}`}
            >
              {/* Premium Profile Card */}
              <div className="showcase-profile showcase-profile--premium">
                <div className="showcase-profile__glow" />
                <div className="showcase-profile__avatar showcase-profile__avatar--premium">
                  <AnimatedAvatar
                    borderType="mythic"
                    borderColor="purple"
                    size={48}
                    initials="CG"
                  />
                </div>
                <div className="showcase-profile__info">
                  <span className="showcase-profile__name showcase-profile__name--premium">
                    CGraph Elite
                  </span>
                  <div className="showcase-profile__badges">
                    <span className="showcase-badge showcase-badge--founder">👑</span>
                    <span className="showcase-badge showcase-badge--verified">✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'title':
        return (
          <div className="showcase-card__content">
            <div
              className={`showcase-card__state ${isHovered ? 'showcase-card__state--hidden' : 'showcase-card__state--visible'}`}
            >
              {/* Basic Title */}
              <div className="showcase-title">
                <span className="showcase-title__text showcase-title__text--basic">Member</span>
                <span className="showcase-title__sublabel">Standard Title</span>
              </div>
            </div>
            <div
              className={`showcase-card__state ${isHovered ? 'showcase-card__state--visible' : 'showcase-card__state--hidden'}`}
            >
              {/* Animated Legendary Title */}
              <div className="showcase-title">
                <span className="showcase-title__text showcase-title__text--legendary">
                  <span className="showcase-title__glow" />⚡ LEGENDARY ⚡
                </span>
                <div className="showcase-title__badges">
                  <motion.span
                    className="showcase-badge showcase-badge--animated"
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🔥
                  </motion.span>
                  <motion.span
                    className="showcase-badge showcase-badge--animated"
                    animate={{
                      scale: [1, 1.15, 1],
                      y: [0, -3, 0],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                  >
                    💎
                  </motion.span>
                  <motion.span
                    className="showcase-badge showcase-badge--animated"
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, -5, 5, 0],
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                  >
                    ⭐
                  </motion.span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      className="showcase-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.02, y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="showcase-card__indicator">
        <span className={`showcase-card__dot ${isHovered ? 'showcase-card__dot--active' : ''}`} />
        <span className="showcase-card__hover-hint">{isHovered ? 'Premium' : 'Hover me'}</span>
      </div>
      {renderContent()}
      <div className="showcase-card__footer">
        <span className="showcase-card__label">{data.label}</span>
      </div>
    </motion.div>
  );
});

const pricingTiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Everything to get started',
    features: [
      'End-to-end encrypted messaging',
      'Join unlimited forums',
      'Create 1 forum',
      '1-on-1 voice & video calls',
      'Web3 wallet authentication',
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
      'Create up to 5 forums',
      'Group calls up to 25 people',
      'Priority customer support',
      'Advanced profile customization',
    ],
    cta: 'Start Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For organizations',
    features: [
      'Everything in Premium',
      'Custom domain & branding',
      'SSO/SAML integration',
      'Admin dashboard & controls',
      'Dedicated account manager',
      'Custom SLA & uptime guarantee',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

const footerLinks = {
  product: [
    { label: 'Features', href: '/features' },
    { label: 'Security', href: '/security' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Download', href: '/login' },
  ],
  resources: [
    { label: 'Documentation', href: 'https://docs.cgraph.org', external: true },
    { label: 'API Reference', href: 'https://docs.cgraph.org/api', external: true },
    { label: 'Status', href: '/status' },
    { label: 'Blog', href: 'https://blog.cgraph.org', external: true },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
    { label: 'Press', href: '/press' },
  ],
  legal: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'GDPR', href: '/gdpr' },
  ],
};

const securityFeatures = [
  { icon: '🔒', title: 'End-to-End Encrypted', description: 'Messages encrypted with AES-256-GCM' },
  { icon: '🛡️', title: 'Zero-Knowledge', description: 'We cannot read your messages' },
  { icon: '🔑', title: 'Argon2 Passwords', description: 'OWASP-recommended password hashing' },
  { icon: '📱', title: 'Multi-Device Sync', description: 'Secure sync across all devices' },
  { icon: '🔐', title: '2FA Protection', description: 'TOTP-based two-factor authentication' },
  { icon: '🌐', title: 'Web3 Authentication', description: 'Sign in with your crypto wallet' },
  { icon: '⚡', title: 'Real-Time Secure', description: 'Encrypted WebSocket connections' },
  { icon: '🔏', title: 'TLS Everywhere', description: 'All data encrypted in transit' },
  { icon: '✅', title: 'GDPR Compliant', description: 'Full data export & deletion rights' },
];

// =============================================================================
// SECURITY ICON WITH PREVIEW
// =============================================================================

function SecurityIconCard({ feature }: { feature: (typeof securityFeatures)[0] }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isReady, setIsReady] = useState(false); // Only show after scale is calculated
  const cardRef = useRef<HTMLDivElement>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [position, setPosition] = useState<'top' | 'bottom'>('top');

  // Get the current scale of the parent section
  const getParentScale = useCallback(() => {
    if (!cardRef.current) return 1;
    const section = cardRef.current.closest('.zoom-section');
    if (!section) return 1;
    const transform = window.getComputedStyle(section).transform;
    if (transform === 'none') return 1;
    // Parse matrix(a, b, c, d, tx, ty) - scale is in 'a' position
    const matrix = transform.match(/matrix\(([^)]+)\)/);
    if (matrix && matrix[1]) {
      const values = matrix[1].split(',').map((v) => parseFloat(v.trim()));
      return values[0] || 1; // 'a' value is the scaleX
    }
    return 1;
  }, []);

  // Update tooltip position on hover and during scroll
  const updatePosition = useCallback(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      const isTop = spaceAbove > spaceBelow;
      setPosition(isTop ? 'top' : 'bottom');

      // Get the current scale of the parent section
      const scale = getParentScale();

      // Calculate fixed position for the tooltip, scaled to match icons
      setTooltipStyle({
        position: 'fixed',
        left: rect.left + rect.width / 2,
        top: isTop ? rect.top - 12 * scale : rect.bottom + 12 * scale,
        transform: isTop
          ? `translate(-50%, -100%) scale(${scale})`
          : `translate(-50%, 0) scale(${scale})`,
        transformOrigin: isTop ? 'bottom center' : 'top center',
        zIndex: 9999,
        opacity: 1,
      });
      setIsReady(true);
    }
  }, [getParentScale]);

  useEffect(() => {
    if (isHovered) {
      // Calculate position immediately on hover
      updatePosition();
      // Update position on scroll to keep tooltip aligned and scaled
      window.addEventListener('scroll', updatePosition, { passive: true });
      return () => {
        window.removeEventListener('scroll', updatePosition);
        setIsReady(false);
      };
    }
    return undefined;
  }, [isHovered, updatePosition]);

  // Only render tooltip when hovered AND position/scale is ready
  const tooltip = isHovered && isReady && (
    <div
      className={`security-preview security-preview--portal ${position === 'top' ? 'security-preview--top' : 'security-preview--bottom'}`}
      style={tooltipStyle}
    >
      <div className="security-preview__glow" />
      <div className="security-preview__content">
        <div className="security-preview__icon">{feature.icon}</div>
        <div className="security-preview__info">
          <h4 className="security-preview__title">{feature.title}</h4>
          <p className="security-preview__desc">{feature.description}</p>
        </div>
      </div>
      <div className="security-preview__arrow" />
    </div>
  );

  return (
    <div
      ref={cardRef}
      className="about__icon-item"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {feature.icon}

      {/* Preview Tooltip - Rendered via portal to escape parent transforms */}
      {tooltip && createPortal(tooltip, document.body)}
    </div>
  );
}
// =============================================================================
// TILT CARD COMPONENT (GAMELAND-STYLE)
// =============================================================================

function TiltCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    let rect: DOMRect | null = null;
    let raf = 0;
    let hover = false;
    let tx = 0.5,
      ty = 0.5,
      targetX = 0.5,
      targetY = 0.5;
    const max = 12;
    const scaleHover = 0.985;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

    const measure = () => {
      rect = card.getBoundingClientRect();
    };

    const tick = () => {
      raf = 0;
      tx = lerp(tx, targetX, 0.18);
      ty = lerp(ty, targetY, 0.18);

      const ry = clamp((tx - 0.5) * (max * 2), -max, max);
      const rx = clamp(-(ty - 0.5) * (max * 2), -max, max);

      card.style.setProperty('--ry', ry + 'deg');
      card.style.setProperty('--rx', rx + 'deg');
      card.style.setProperty('--s', hover ? String(scaleHover) : '1');
      card.style.setProperty('--mouse-x', clamp(tx * 100, 2, 98) + '%');
      card.style.setProperty('--mouse-y', clamp(ty * 100, 2, 98) + '%');

      const settling = Math.abs(targetX - tx) > 1e-3 || Math.abs(targetY - ty) > 1e-3 || hover;
      if (settling) raf = requestAnimationFrame(tick);
    };

    const handleMouseEnter = () => {
      measure();
      hover = true;
      card.classList.add('is-tilting');
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!hover || !rect) return;
      const rawX = (e.clientX - rect.left) / rect.width;
      const rawY = (e.clientY - rect.top) / rect.height;
      targetX = clamp(rawX, 0, 1);
      targetY = clamp(rawY, 0, 1);
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const handleMouseLeave = () => {
      hover = false;
      targetX = 0.5;
      targetY = 0.5;
      card.classList.remove('is-tilting');
      if (!raf) raf = requestAnimationFrame(tick);
    };

    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mousemove', handleMouseMove, { passive: true });
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={cardRef} className="tilt-card">
      <div className="tilt-card__bg" />
      <div className="tilt-card__glare" />
      <div className="tilt-card__content">
        <span className="tilt-card__icon">{icon}</span>
        <h3 className="tilt-card__title font-robert">{title}</h3>
        <p className="tilt-card__desc">{description}</p>
      </div>
      <div className="tilt-card__accent" />
    </div>
  );
}

// Animated Sign In Button with glowing border and icon animation
function SignInButton() {
  return (
    <Link to="/login" className="btn-signin group">
      <span className="btn-signin__glow" />
      <span className="btn-signin__border" />
      <span className="btn-signin__content">
        <svg
          className="btn-signin__icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
        <span className="btn-signin__text">Sign In</span>
        <span className="btn-signin__text-hover">Welcome</span>
      </span>
    </Link>
  );
}

function SwapButton({
  primary = false,
  mainText,
  altText,
  href,
}: {
  primary?: boolean;
  mainText: string;
  altText: string;
  href?: string;
}) {
  const className = `btn-swap ${primary ? 'btn-swap--primary' : ''}`;

  const content = (
    <>
      <span className="btn-swap__main">{mainText}</span>
      <span className="btn-swap__alt">{altText}</span>
    </>
  );

  if (href) {
    return (
      <Link to={href} className={className}>
        {content}
      </Link>
    );
  }

  return <button className={className}>{content}</button>;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [navHidden, setNavHidden] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const aboutVisualRef = useRef<HTMLDivElement>(null);
  const aboutGlowRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  // Redirect authenticated users to messages
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/messages', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Handle hash navigation on page load (e.g., /#pricing, /#features)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      // Small delay to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, []);

  // Scroll handler for nav visibility - throttled for performance
  useEffect(() => {
    let lastScroll = 0;

    const handleScroll = throttle(() => {
      const currentScroll = window.scrollY;
      setNavHidden(currentScroll > lastScroll && currentScroll > 100);
      setNavScrolled(currentScroll > 50);
      lastScroll = currentScroll;
    }, 16); // ~60fps

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cursor-following glow effect for about section - throttled for performance
  useEffect(() => {
    const visual = aboutVisualRef.current;
    const glow = aboutGlowRef.current;
    if (!visual || !glow) return;

    const handleMouseMove = throttle((e: MouseEvent) => {
      const rect = visual.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Offset from center (like original TiltCard3D)
      gsap.to(glow, {
        x: x - centerX,
        y: y - centerY,
        opacity: 0.8,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto', // Prevent animation queue buildup
      });
    }, 16); // ~60fps

    const handleMouseLeave = () => {
      gsap.to(glow, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    visual.addEventListener('mousemove', handleMouseMove, { passive: true });
    visual.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      visual.removeEventListener('mousemove', handleMouseMove);
      visual.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // GSAP animations on mount (hero + scroll-triggered elements)
  useEffect(() => {
    let heroTl: gsap.core.Timeline | null = null;

    // Hero entrance animations - run immediately
    gsap.set('.hero__eyebrow', { y: 60, opacity: 0, scale: 0.98 });
    gsap.set('.hero__title', { y: 40, opacity: 0 });
    gsap.set('.hero__subtitle', { y: 22, opacity: 0, skewY: 5 });
    gsap.set('.hero__buttons', { y: 18, opacity: 0, scale: 0 });

    heroTl = gsap.timeline({ delay: 0.1, defaults: { ease: 'power2.out' } });
    heroTl
      .to('.hero__eyebrow', { y: 0, opacity: 1, scale: 1, duration: 0.65 })
      .to('.hero__title', { y: 0, opacity: 1, duration: 0.6 }, '>-0.3')
      .to('.hero__subtitle', { y: 0, opacity: 1, skewY: 0, duration: 0.55 }, '>-0.25')
      .to(
        '.hero__buttons',
        { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.7)' },
        '>-0.13'
      );

    // Mark site as ready for CSS transitions
    document.documentElement.classList.add('site-ready');

    // Defer scroll-triggered animations slightly to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      const ctx = gsap.context(() => {
        // Section zoom effect - smooth parallax-style scaling
        const sections = document.querySelectorAll('.zoom-section');

        sections.forEach((section) => {
          // Scale down as section leaves the viewport (starts when section top hits 30% from top)
          gsap.to(section, {
            scrollTrigger: {
              trigger: section,
              start: 'top 30%',
              end: 'top -50%',
              scrub: 1,
              fastScrollEnd: true, // Performance: end early on fast scroll
            },
            scale: 0.25,
            opacity: 0.05,
            ease: 'none',
          });

          // Scale up as section enters viewport - reach full scale when section is centered
          gsap.fromTo(
            section,
            {
              scale: 0.25,
              opacity: 0.05,
            },
            {
              scrollTrigger: {
                trigger: section,
                start: 'top 100%',
                end: 'top 50%',
                scrub: 1,
                fastScrollEnd: true, // Performance: end early on fast scroll
              },
              scale: 1,
              opacity: 1,
              ease: 'none',
            }
          );
        });

        // Feature cards scroll animation
        gsap.from('.tilt-card', {
          scrollTrigger: {
            trigger: featuresRef.current,
            start: 'top 80%',
          },
          y: 60,
          opacity: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
        });

        // About section scroll animation
        gsap.from('.about__content > *', {
          scrollTrigger: {
            trigger: aboutRef.current,
            start: 'top 70%',
          },
          y: 50,
          opacity: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
        });

        // CTA section scroll animation
        gsap.from('.cta__content > *', {
          scrollTrigger: {
            trigger: ctaRef.current,
            start: 'top 80%',
          },
          y: 40,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
        });

        // Scroll indicator - follows user scroll
        if (scrollIndicatorRef.current) {
          const scrollDot = scrollIndicatorRef.current.querySelector('.hero__scroll-dot');
          const scrollArrows = scrollIndicatorRef.current.querySelectorAll(
            '.hero__scroll-arrows span'
          );

          // Animate the dot based on scroll progress
          if (scrollDot) {
            gsap.to(scrollDot, {
              scrollTrigger: {
                trigger: heroRef.current,
                start: 'top top',
                end: 'bottom top',
                scrub: 0.5,
              },
              y: 20,
              opacity: 0.2,
              ease: 'none',
            });
          }

          // Animate arrows cascading based on scroll
          scrollArrows.forEach((arrow, index) => {
            gsap.to(arrow, {
              scrollTrigger: {
                trigger: heroRef.current,
                start: 'top top',
                end: 'bottom top',
                scrub: 0.5,
              },
              y: 8 + index * 4,
              opacity: 0,
              ease: 'none',
            });
          });

          // Fade out entire scroll indicator as user scrolls
          gsap.to(scrollIndicatorRef.current, {
            scrollTrigger: {
              trigger: heroRef.current,
              start: 'top top',
              end: '30% top',
              scrub: 0.3,
            },
            opacity: 0,
            y: 20,
            ease: 'none',
          });
        }
      });

      return () => ctx.revert();
    }, 100); // Small delay to improve initial paint

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="demo-landing">
      {/* Navigation */}
      <nav className={`gl-nav ${navHidden ? 'hidden' : ''} ${navScrolled ? 'scrolled' : ''}`}>
        <Link to="/" className="gl-nav__logo">
          <span>⬡</span>
          CGraph
        </Link>

        <div className="gl-nav__links">
          <a
            href="#features"
            className="gl-nav__link"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Features
          </a>
          <a
            href="#security"
            className="gl-nav__link"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('security')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Security
          </a>
          <a
            href="#pricing"
            className="gl-nav__link"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Pricing
          </a>
        </div>

        <SignInButton />
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="hero">
        <div className="hero__bg">
          <div className="hero__gradient-bg" />
          <div className="hero__bg-aurora" />
          <div className="hero__bg-grid" />
          <div className="hero__bg-particles" />
          <div className="hero__bg-streaks" />
          <div className="hero__bg-spotlight" />
          <div className="hero__bg-interactive" />
          <div className="hero__bg-noise" />
          <div className="hero__bg-vignette" />
          <div className="hero__bg-fade" />
        </div>

        <div className="hero__content">
          <span className="hero__eyebrow font-robert">The All-in-One Platform</span>

          <h1 className="hero__title">
            <span className="hero__title-beyond">Beyond</span>
            <span className="hero__title-gradient">Messaging</span>
          </h1>

          <p className="hero__subtitle font-robert">
            Real-time messaging meets community forums — with bank-grade encryption, Web3
            authentication, and rewards that make every interaction count.
          </p>

          <div className="hero__buttons">
            <SwapButton primary mainText="Start Free" altText="No Credit Card" href="/register" />
            <SwapButton mainText="Learn More" altText="Explore" href="#features" />
          </div>
        </div>

        <div ref={scrollIndicatorRef} className="hero__scroll">
          <span>Scroll</span>
          <div className="hero__scroll-line">
            <span className="hero__scroll-dot" />
          </div>
          <div className="hero__scroll-arrows">
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>

      {/* Feature Showcase */}
      <section ref={statsRef} className="stats-section zoom-section">
        <div className="stats-grid">
          {showcaseCards.map((card) => (
            <FeatureShowcaseCard key={card.id} data={card} />
          ))}
        </div>
      </section>

      {/* Features */}
      <section ref={featuresRef} id="features" className="features zoom-section">
        <div className="section-header">
          <span className="section-header__badge section-header__badge--emerald">
            ✨ Powerful Features
          </span>
          <h2 className="section-header__title font-zentry">
            Everything You <span className="section-header__gradient">Need</span>
          </h2>
          <p className="section-header__desc">
            Build, customize, and grow your community with our comprehensive feature set.
          </p>
        </div>

        <div className="features__grid">
          {features.map((feature) => (
            <TiltCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      {/* Customization Demo */}
      <section className="showcase-section zoom-section">
        <Suspense fallback={<CustomizationDemoSkeleton />}>
          <CustomizationDemo />
        </Suspense>
      </section>

      {/* Forum Showcase */}
      <section className="showcase-section showcase-section--alt zoom-section">
        <Suspense fallback={<ForumShowcaseSkeleton />}>
          <ForumShowcase />
        </Suspense>
      </section>

      {/* About/Security */}
      <section ref={aboutRef} id="security" className="about zoom-section">
        <div className="about__container">
          <div className="about__content">
            <span className="mb-4 inline-block animate-[badge-subtle-pulse_4s_ease-in-out_infinite] cursor-default rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1 text-sm text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.15),0_0_24px_rgba(168,85,247,0.08)] transition-all duration-300 hover:scale-[1.02] hover:animate-none hover:border-purple-500/60 hover:bg-purple-500/20 hover:shadow-[0_0_20px_rgba(168,85,247,0.3),0_0_40px_rgba(168,85,247,0.15)]">
              🔒 Privacy-First Design
            </span>
            <h2 className="about__title font-zentry">
              Your Privacy Is Our <span className="about__gradient">Priority</span>
            </h2>
            <p className="about__desc">
              Built from the ground up with security in mind. Your messages are end-to-end encrypted
              with AES-256, and we use Signal-inspired encryption protocols. Not even we can access
              your private conversations.
            </p>
            <SwapButton mainText="Security Details" altText="Learn More" />
          </div>

          <div ref={aboutVisualRef} className="about__visual">
            <div className="about__orb" />
            <div
              ref={aboutGlowRef}
              className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-0 blur-3xl"
            />
            <div className="about__icon-grid">
              {securityFeatures.map((feature, i) => (
                <SecurityIconCard key={i} feature={feature} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="pricing zoom-section">
        <div className="section-header">
          <span className="section-header__badge section-header__badge--cyan">💎 Pricing</span>
          <h2 className="section-header__title font-zentry">
            Simple, <span className="pricing__gradient-animated">Transparent</span> Pricing
          </h2>
          <p className="section-header__desc">
            Choose the plan that fits your community. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="pricing__grid">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`pricing__card ${tier.highlighted ? 'pricing__card--highlighted' : ''}`}
            >
              {tier.highlighted && <span className="pricing__badge">Most Popular</span>}
              <h3 className="pricing__name font-robert">{tier.name}</h3>
              <div className="pricing__price">
                <span className="pricing__amount">{tier.price}</span>
                <span className="pricing__period">{tier.period}</span>
              </div>
              <p className="pricing__desc">{tier.description}</p>

              <ul className="pricing__features">
                {tier.features.map((feature) => (
                  <li key={feature}>
                    <svg
                      className="pricing__check"
                      viewBox="0 0 24 24"
                      fill="none"
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
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className={`pricing__cta ${tier.highlighted ? 'pricing__cta--primary' : ''}`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaRef} className="cta zoom-section">
        <div className="cta__content">
          <span className="mb-4 inline-block animate-[badge-emerald-pulse_4s_ease-in-out_infinite] cursor-default rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-sm text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15),0_0_24px_rgba(16,185,129,0.08)] transition-all duration-300 hover:scale-[1.02] hover:animate-none hover:border-emerald-500/60 hover:bg-emerald-500/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.3),0_0_40px_rgba(16,185,129,0.15)]">
            🚀 Ready to Start?
          </span>
          <h2 className="cta__title font-zentry">
            Build Your <span className="cta__gradient-animated">Community</span>
          </h2>
          <p className="cta__desc">
            Create forums, customize your space, and connect with like-minded people.
          </p>
          <div className="cta__buttons">
            <SwapButton primary mainText="Create Account" altText="Join Now!" href="/register" />
            <SwapButton mainText="Sign In" altText="Welcome Back" href="/login" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="gl-footer">
        <div className="gl-footer__main">
          <div className="gl-footer__column">
            <h4 className="gl-footer__heading">Product</h4>
            {footerLinks.product.map((link) => (
              <Link key={link.label} to={link.href} className="gl-footer__link">
                {link.label}
              </Link>
            ))}
          </div>
          <div className="gl-footer__column">
            <h4 className="gl-footer__heading">Resources</h4>
            {footerLinks.resources.map((link) =>
              'external' in link && link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  className="gl-footer__link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label}
                </a>
              ) : (
                <Link key={link.label} to={link.href} className="gl-footer__link">
                  {link.label}
                </Link>
              )
            )}
          </div>
          <div className="gl-footer__column">
            <h4 className="gl-footer__heading">Company</h4>
            {footerLinks.company.map((link) => (
              <Link key={link.label} to={link.href} className="gl-footer__link">
                {link.label}
              </Link>
            ))}
          </div>
          <div className="gl-footer__column">
            <h4 className="gl-footer__heading">Legal</h4>
            {footerLinks.legal.map((link) => (
              <Link key={link.label} to={link.href} className="gl-footer__link">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="gl-footer__bottom">
          <div className="gl-footer__bottom-left">
            <Link to="/forums" className="gl-footer__logo">
              <svg
                className="gl-footer__logo-icon"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>© 2026 CGraph</span>
            </Link>
          </div>
          <div className="gl-footer__socials">
            <a
              href="https://twitter.com/cgraph"
              target="_blank"
              rel="noopener noreferrer"
              className="gl-footer__social"
              aria-label="Twitter"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://github.com/cgraph"
              target="_blank"
              rel="noopener noreferrer"
              className="gl-footer__social"
              aria-label="GitHub"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

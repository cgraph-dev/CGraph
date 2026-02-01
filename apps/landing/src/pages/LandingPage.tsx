/**
 * CGraph Enterprise Landing Page
 *
 * Production-ready landing page for cgraph.org
 * Designed for scale (millions of users) following Discord's architecture:
 * - Static generation for CDN caching
 * - Minimal JavaScript for fast FCP/LCP
 * - GSAP for premium scroll animations
 * - Framer Motion for micro-interactions
 * - SEO optimized with semantic HTML
 *
 * Version: 2.0.0 - Added resource pages (/docs, /blog, /status, /download)
 */

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { LogoIcon } from '../components/Logo';
import './landing-page.css';

gsap.registerPlugin(ScrollTrigger);

// =============================================================================
// PERFORMANCE UTILITIES
// =============================================================================

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

const debounce = <T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
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
    { label: 'Features', href: '/#features' },
    { label: 'Security', href: '/#security' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'Download', href: '/download' },
  ],
  resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'Blog', href: '/blog' },
    { label: 'Status', href: '/status' },
    { label: 'API Reference', href: '/docs' },
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
// COMPONENTS
// =============================================================================

const FeatureShowcaseCard = memo(function FeatureShowcaseCard({
  data,
}: {
  data: ShowcaseCardData;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch device on mount
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const renderContent = () => {
    switch (data.id) {
      case 'avatar':
        return (
          <div className="showcase-card__content">
            <div
              className={`showcase-card__state ${isHovered ? 'showcase-card__state--hidden' : 'showcase-card__state--visible'}`}
            >
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
              <div className="showcase-avatar showcase-avatar--premium">
                <div className="showcase-avatar__image showcase-avatar__image--legendary">
                  <span>CG</span>
                </div>
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
              <div className="showcase-profile showcase-profile--premium">
                <div className="showcase-profile__glow" />
                <div className="showcase-profile__avatar showcase-profile__avatar--premium">
                  <span>CG</span>
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
              <div className="showcase-title">
                <span className="showcase-title__text showcase-title__text--basic">Member</span>
                <span className="showcase-title__sublabel">Standard Title</span>
              </div>
            </div>
            <div
              className={`showcase-card__state ${isHovered ? 'showcase-card__state--visible' : 'showcase-card__state--hidden'}`}
            >
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsHovered(!isHovered);
    }
  };

  // Handle touch for mobile - toggle on tap
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsHovered(!isHovered);
  };

  return (
    <motion.div
      className="showcase-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchEnd={handleTouchEnd}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      whileHover={{ scale: 1.02, y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      role="button"
      tabIndex={0}
      aria-pressed={isHovered}
      aria-label={`${data.label} showcase - ${isHovered ? 'showing premium version' : 'tap to see premium version'}`}
    >
      <div className="showcase-card__indicator" aria-hidden="true">
        <span className={`showcase-card__dot ${isHovered ? 'showcase-card__dot--active' : ''}`} />
        <span className="showcase-card__hover-hint">
          {isHovered ? 'Premium' : isTouchDevice ? 'Tap me' : 'Hover me'}
        </span>
      </div>
      {renderContent()}
      <div className="showcase-card__footer">
        <span className="showcase-card__icon" aria-hidden="true">
          {data.icon}
        </span>
        <span className="showcase-card__label">{data.label}</span>
      </div>
    </motion.div>
  );
});

function SecurityIconCard({ feature }: { feature: (typeof securityFeatures)[0] }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [position, setPosition] = useState<'top' | 'bottom'>('top');

  const getParentScale = useCallback(() => {
    if (!cardRef.current) return 1;
    const section = cardRef.current.closest('.zoom-section');
    if (!section) return 1;
    const transform = window.getComputedStyle(section).transform;
    if (transform === 'none') return 1;
    const matrix = transform.match(/matrix\(([^)]+)\)/);
    if (matrix && matrix[1]) {
      const values = matrix[1].split(',').map((v) => parseFloat(v.trim()));
      return values[0] || 1;
    }
    return 1;
  }, []);

  const updatePosition = useCallback(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      const isTop = spaceAbove > spaceBelow;
      setPosition(isTop ? 'top' : 'bottom');

      const scale = getParentScale();

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
      updatePosition();
      window.addEventListener('scroll', updatePosition, { passive: true });
      return () => {
        window.removeEventListener('scroll', updatePosition);
        setIsReady(false);
      };
    }
    return undefined;
  }, [isHovered, updatePosition]);

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
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`${feature.title}: ${feature.description}`}
      aria-expanded={isHovered}
    >
      <span aria-hidden="true">{feature.icon}</span>
      {tooltip && createPortal(tooltip, document.body)}
    </div>
  );
}

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
    // External links or hash links
    if (href.startsWith('http') || href.startsWith('#')) {
      return (
        <a href={href} className={className}>
          {content}
        </a>
      );
    }
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
  const [navHidden, setNavHidden] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const aboutVisualRef = useRef<HTMLDivElement>(null);
  const aboutGlowRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  // Handle hash navigation on page load
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
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

  // Scroll handler for nav visibility
  useEffect(() => {
    let lastScroll = 0;

    const handleScroll = throttle(() => {
      const currentScroll = window.scrollY;
      setNavHidden(currentScroll > lastScroll && currentScroll > 100);
      setNavScrolled(currentScroll > 50);
      lastScroll = currentScroll;
    }, 16);

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cursor-following glow effect for about section
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

      gsap.to(glow, {
        x: x - centerX,
        y: y - centerY,
        opacity: 0.8,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    }, 16);

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

  // GSAP animations
  useEffect(() => {
    let gsapContextRef: gsap.Context | null = null;
    let heroTl: gsap.core.Timeline | null = null;

    // Hero entrance animations
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

    document.documentElement.classList.add('site-ready');

    const timeoutId = setTimeout(() => {
      const ctx = gsap.context(() => {
        const sections = document.querySelectorAll('.zoom-section');

        sections.forEach((section, index) => {
          if (index === 0) {
            gsap.set(section, { scale: 1, opacity: 1, transformOrigin: 'center center' });
          } else {
            gsap.set(section, { scale: 0.75, opacity: 0.2, transformOrigin: 'center center' });
          }
        });

        sections.forEach((section) => {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: 'top 100%',
              end: 'top -50%',
              scrub: 1.2,
              invalidateOnRefresh: true,
            },
          });

          tl.fromTo(
            section,
            { scale: 0.75, opacity: 0.2, transformOrigin: 'center center' },
            { scale: 1, opacity: 1, duration: 0.33, ease: 'sine.out' }
          );

          tl.to(section, { scale: 1, opacity: 1, duration: 0.34, ease: 'none' });

          tl.to(section, {
            scale: 0.75,
            opacity: 0.2,
            duration: 0.33,
            ease: 'sine.in',
          });
        });

        ScrollTrigger.refresh();

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

        if (scrollIndicatorRef.current) {
          const scrollDot = scrollIndicatorRef.current.querySelector('.hero__scroll-dot');
          const scrollArrows = scrollIndicatorRef.current.querySelectorAll(
            '.hero__scroll-arrows span'
          );

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

      gsapContextRef = ctx;

      const resizeObserver = new ResizeObserver(
        debounce(() => {
          ScrollTrigger.refresh();
        }, 200)
      );

      const mainContainer = document.querySelector('.demo-landing');
      if (mainContainer) {
        resizeObserver.observe(mainContainer);
      }

      (window as unknown as { _cgraphResizeObserver?: ResizeObserver })._cgraphResizeObserver =
        resizeObserver;
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      heroTl?.kill();
      const observer = (window as unknown as { _cgraphResizeObserver?: ResizeObserver })
        ._cgraphResizeObserver;
      if (observer) {
        observer.disconnect();
        delete (window as unknown as { _cgraphResizeObserver?: ResizeObserver })
          ._cgraphResizeObserver;
      }
      if (gsapContextRef) {
        gsapContextRef.revert();
        gsapContextRef = null;
      }
    };
  }, []);

  return (
    <div className="demo-landing">
      {/* Navigation */}
      <nav className={`gl-nav ${navHidden ? 'hidden' : ''} ${navScrolled ? 'scrolled' : ''}`}>
        <Link to="/" className="gl-nav__logo">
          <LogoIcon size={32} showGlow animated color="gradient" />
          <span className="gl-nav__logo-text">CGraph</span>
        </Link>

        <div className="gl-nav__links">
          <a
            href="#features"
            className="gl-nav__link"
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById('features');
              if (el) window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' });
            }}
          >
            Features
          </a>
          <a
            href="#security"
            className="gl-nav__link"
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById('security');
              if (el) window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' });
            }}
          >
            Security
          </a>
          <a
            href="#pricing"
            className="gl-nav__link"
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById('pricing');
              if (el) window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' });
            }}
          >
            Pricing
          </a>
        </div>

        <SignInButton />

        {/* Mobile Hamburger Button */}
        <button
          className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
          aria-expanded={mobileMenuOpen}
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
          <nav className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu__header">
              <Link to="/" className="mobile-menu__logo" onClick={() => setMobileMenuOpen(false)}>
                <LogoIcon size={28} showGlow animated color="gradient" />
                <span>CGraph</span>
              </Link>
              <button
                className="mobile-menu__close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mobile-menu__links">
              <a
                href="#features"
                className="mobile-menu__link"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  const el = document.getElementById('features');
                  if (el) window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' });
                }}
              >
                <span className="mobile-menu__link-icon">✨</span>
                Features
              </a>
              <a
                href="#security"
                className="mobile-menu__link"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  const el = document.getElementById('security');
                  if (el) window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' });
                }}
              >
                <span className="mobile-menu__link-icon">🔐</span>
                Security
              </a>
              <a
                href="#pricing"
                className="mobile-menu__link"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  const el = document.getElementById('pricing');
                  if (el) window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' });
                }}
              >
                <span className="mobile-menu__link-icon">💎</span>
                Pricing
              </a>
            </div>

            <div className="mobile-menu__cta">
              <Link
                to="/login"
                className="mobile-menu__signin"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="mobile-menu__signup"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started Free
              </Link>
            </div>
          </nav>
        </div>
      )}

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
            Real-time messaging meets community forums — with end-to-end encryption, Web3
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
        <div className="showcase-header">
          <span className="showcase-header__badge">✨ See the Difference</span>
          <h3 className="showcase-header__title">Hover to Discover Premium Features</h3>
        </div>
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
            <SwapButton mainText="Security Details" altText="Learn More" href="#security" />
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
              <a key={link.label} href={link.href} className="gl-footer__link">
                {link.label}
              </a>
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
                <a key={link.label} href={link.href} className="gl-footer__link">
                  {link.label}
                </a>
              )
            )}
          </div>
          <div className="gl-footer__column">
            <h4 className="gl-footer__heading">Company</h4>
            {footerLinks.company.map((link) => (
              <a key={link.label} href={link.href} className="gl-footer__link">
                {link.label}
              </a>
            ))}
          </div>
          <div className="gl-footer__column">
            <h4 className="gl-footer__heading">Legal</h4>
            {footerLinks.legal.map((link) => (
              <a key={link.label} href={link.href} className="gl-footer__link">
                {link.label}
              </a>
            ))}
          </div>
        </div>
        <div className="gl-footer__bottom">
          <div className="gl-footer__bottom-left">
            <Link to="/" className="gl-footer__logo">
              <LogoIcon size={24} color="white" />
              <span>© 2026 CGraph</span>
            </Link>
          </div>
          <div className="gl-footer__socials">
            <a href="#" className="gl-footer__social" aria-label="Twitter / X">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="#" className="gl-footer__social" aria-label="GitHub">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <a href="#" className="gl-footer__social" aria-label="Discord">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

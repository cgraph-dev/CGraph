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

import { useState, useEffect, useRef, useCallback, memo, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import Navigation from '../components/marketing/Navigation';
import Footer from '../components/marketing/Footer';
import VideoHero from '../components/hero/VideoHero';
import ValueProposition from '../components/sections/ValueProposition';
import { features, showcaseCards, securityFeatures } from '../data/landing-data';
import type { ShowcaseCardData } from '../data/landing-data';
import './landing-page.css';

gsap.registerPlugin(ScrollTrigger);

// Lazy-load showcase sections to reduce initial bundle size
const InteractiveDemo = lazy(() =>
  import('../components/interactive-demo').then((m) => ({ default: m.InteractiveDemo }))
);
const CustomizationDemo = lazy(() =>
  import('../components/customization-demo').then((m) => ({ default: m.CustomizationDemo }))
);
const ForumShowcase = lazy(() =>
  import('../components/forum-showcase').then((m) => ({ default: m.ForumShowcase }))
);

// Web app URL for auth links (direct navigation, not SPA routing)
const WEB_APP_URL = 'https://web.cgraph.org';

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
    const { transform } = window.getComputedStyle(section);
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
  const featuresRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  // Handle hash navigation on page load
  useEffect(() => {
    const { hash } = window.location;
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

  // GSAP ScrollTrigger animations (desktop only)
  useEffect(() => {
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let gsapContextRef: gsap.Context | null = null;

    document.documentElement.classList.add('site-ready');

    if (prefersReduced || !isDesktop) {
      // On mobile or reduced-motion, show all sections immediately
      gsap.set('.zoom-section', { scale: 1, opacity: 1 });
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      const ctx = gsap.context(() => {
        const sections = document.querySelectorAll('.zoom-section');

        sections.forEach((section, index) => {
          if (index === 0) {
            gsap.set(section, { scale: 1, opacity: 1, transformOrigin: 'center center' });
          } else {
            gsap.set(section, { scale: 0.92, opacity: 0.4, transformOrigin: 'center center' });
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
            { scale: 0.92, opacity: 0.4, transformOrigin: 'center center' },
            { scale: 1, opacity: 1, duration: 0.33, ease: 'sine.out' }
          );

          tl.to(section, { scale: 1, opacity: 1, duration: 0.34, ease: 'none' });

          tl.to(section, {
            scale: 0.95,
            opacity: 0.6,
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
      });

      gsapContextRef = ctx;

      const resizeObserver = new ResizeObserver(() => {
        ScrollTrigger.refresh();
      });

      const mainContainer = document.querySelector('.demo-landing');
      if (mainContainer) {
        resizeObserver.observe(mainContainer);
      }

      (window as unknown as { _cgraphResizeObserver?: ResizeObserver })._cgraphResizeObserver =
        resizeObserver;
    }, 100);

    return () => {
      clearTimeout(timeoutId);
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
      {/* Unified Navigation */}
      <Navigation showLandingLinks />

      {/* Hero — Cinematic video background */}
      <VideoHero />

      {/* Feature Showcase */}
      <section className="stats-section zoom-section">
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

      {/* Interactive Demo */}
      <section className="interactive-demo-section zoom-section">
        <div className="section-header">
          <span className="section-header__badge section-header__badge--cyan">🎮 Try It Now</span>
          <h2 className="section-header__title font-zentry">
            Experience CGraph <span className="section-header__gradient">Live</span>
          </h2>
          <p className="section-header__desc">
            No signup required. Explore our features in this interactive demo.
          </p>
        </div>
        <Suspense
          fallback={
            <div className="interactive-demo-skeleton">
              <div className="interactive-demo-skeleton__header" />
              <div className="interactive-demo-skeleton__content" />
            </div>
          }
        >
          <InteractiveDemo />
        </Suspense>
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
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          }
        >
          <CustomizationDemo />
        </Suspense>
      </section>

      {/* Forum Showcase */}
      <section className="showcase-section zoom-section">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
            </div>
          }
        >
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
            <SwapButton mainText="Security Details" altText="Learn More" href="#security" />
          </div>

          <div className="about__visual">
            <div className="about__orb" />
            <div className="about__icon-grid">
              {securityFeatures.map((feature, i) => (
                <SecurityIconCard key={i} feature={feature} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition (replaces pricing) */}
      <ValueProposition />

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
            <SwapButton
              primary
              mainText="Create Account"
              altText="Join Now!"
              href={`${WEB_APP_URL}/register`}
            />
            <SwapButton mainText="Sign In" altText="Welcome Back" href={`${WEB_APP_URL}/login`} />
          </div>
        </div>
      </section>

      {/* Unified Footer */}
      <Footer />
    </div>
  );
}

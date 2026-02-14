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

import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, useReducedMotion } from 'framer-motion';
import Navigation from '../components/marketing/layout/Navigation';
import Footer from '../components/marketing/layout/Footer';
import Hero from '../components/marketing/sections/Hero';
import { Features } from '../components/marketing/sections/Features';
import ValueProposition from '../components/marketing/sections/ValueProposition';
import { Security } from '../components/marketing/sections/Security';
import { CTA } from '../components/marketing/sections/CTA';
import { SectionHeader } from '../components/marketing/ui/SectionHeader';
import './landing-page.css';
import './mobile-fixes.css';

gsap.registerPlugin(ScrollTrigger);

// =============================================================================
// FRAMER MOTION VARIANTS (matches animation patterns from footer pages)
// =============================================================================

/** Scroll-triggered fade-up — the universal entrance used on all footer pages */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

/** Spring-based scale-in — used for icon/stat badges (About page pattern) */
const springScaleIn = {
  hidden: { scale: 0.5, opacity: 0 },
  visible: (delay: number = 0) => ({
    scale: 1,
    opacity: 1,
    transition: { delay, type: 'spring' as const, stiffness: 300, damping: 12 },
  }),
};

/** Stagger container — wraps children that animate in sequence */
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

/** Child item for stagger containers */
const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

// =============================================================================
// ANIMATED SECTION HEADER (matches MarketingLayout hero stagger pattern)
// =============================================================================

// SectionHeader extracted to components/marketing/ui/SectionHeader.tsx

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

// TiltCard extracted/replaced by GlassCard

// SwapButton extracted/replaced by LandingButton

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function LandingPage() {
  const prefersReduced = useReducedMotion();

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

      {/* Hero — Professional SaaS hero */}
      <Hero />

      {/* Interactive Demo */}
      <section className="interactive-demo-section zoom-section">
        <SectionHeader
          badge="Try It Now"
          badgeVariant="cyan"
          title="Experience CGraph"
          titleAccent="Live"
          titleAccentClass="title-fx--electric"
          description="No signup required. Explore our features in this interactive demo."
        />
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
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
        </motion.div>
      </section>

      {/* Features */}
      <Features />

      {/* Customization Demo */}
      <section className="showcase-section zoom-section">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7 }}
        >
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-24">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              </div>
            }
          >
            <CustomizationDemo />
          </Suspense>
        </motion.div>
      </section>

      {/* Forum Showcase */}
      <section className="showcase-section zoom-section">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7 }}
        >
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-24">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
              </div>
            }
          >
            <ForumShowcase />
          </Suspense>
        </motion.div>
      </section>

      {/* Security */}
      <Security />

      {/* Value Proposition (replaces pricing) */}
      <ValueProposition />

      {/* CTA */}
      {/* CTA */}
      <CTA prefersReduced={prefersReduced} />

      {/* Unified Footer */}
      <Footer />
    </div>
  );
}

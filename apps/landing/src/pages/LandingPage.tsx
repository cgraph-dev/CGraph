/**
 * CGraph Enterprise Landing Page
 *
 * Production-ready landing page for cgraph.org
 * Designed for scale (millions of users):
 * - Static generation for CDN caching
 * - Minimal JavaScript for fast FCP/LCP
 * - GSAP for premium scroll animations
 * - Framer Motion for micro-interactions
 * - SEO optimized with semantic HTML
 *
 * Version: 2.0.0 - Added resource pages (/docs, /blog, /status, /download)
 */

import { useEffect, lazy, Suspense } from 'react';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, useReducedMotion } from 'framer-motion';
import Navigation from '../components/marketing/layout/Navigation';
import Footer from '../components/marketing/layout/Footer';
import Hero from '../components/marketing/sections/Hero';
import { Features } from '../components/marketing/sections/Features';
import ValueProposition from '../components/marketing/sections/ValueProposition';
import { Security } from '../components/marketing/sections/Security';
import { GlobalBackground } from '../components/marketing/layout/GlobalBackground';
import '../components/marketing/sections/Security.css';
import { CTA } from '../components/marketing/sections/CTA';
import { SectionHeader } from '../components/marketing/ui/SectionHeader';
import './landing-page.css';
import './mobile-fixes.css';

gsap.registerPlugin(ScrollTrigger);

// =============================================================================
// FRAMER MOTION VARIANTS (matches animation patterns from footer pages)
// =============================================================================

/** Scroll-triggered fade-up — the universal entrance used on all footer pages */
// Variants removed (moved to primitives or sections)

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
// Constants moved to relevant components

// =============================================================================
// COMPONENTS
// =============================================================================

// Security sections moved to dedicated component: Security.tsx

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

      {/* Global Background */}
      <GlobalBackground />

      {/* Hero — Professional SaaS hero */}
      <Hero />

      {/* Interactive Demo */}
      <section className="interactive-demo-section zoom-section">
        <SectionHeader
          badge="Try It Now"
          badgeVariant="cyan"
          title="Experience CGraph"
          titleAccent="Live"
          titleAccentClass="title-fx--air"
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
      <CTA prefersReduced={!!prefersReduced} />

      {/* Unified Footer */}
      <Footer />
    </div>
  );
}

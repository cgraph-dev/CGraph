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

import { useEffect, useRef, lazy, Suspense } from 'react';

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
import SEO from '../components/SEO';

/* ── Split CSS architecture (replaces monolithic landing-page.css) ── */
import '../styles/css-variables.css';
import '../styles/preloader.css';
import '../styles/buttons.css';
import '../styles/hero-landing.css';
import '../styles/section-header.css';
import '../styles/features-section.css';
import '../styles/stats-section.css';
import '../styles/about-security-section.css';
import '../styles/cta-section.css';
import '../styles/showcase-section.css';
import '../styles/pricing-section.css';
import '../styles/interactive-demo-section.css';
import '../styles/customization-preview.css';
import '../styles/value-proposition.css';
import '../styles/animated-borders.css';
import '../styles/mobile-landing.css';
import '../styles/mobile-fixes.css';

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

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function LandingPage() {
  const prefersReduced = useReducedMotion();
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

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

      resizeObserverRef.current = resizeObserver;
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      if (gsapContextRef) {
        gsapContextRef.revert();
        gsapContextRef = null;
      }
    };
  }, []);

  return (
    <div className="demo-landing">
      <SEO path="/" />

      {/* Unified Navigation */}
      <Navigation showLandingLinks />

      {/* Global Background */}
      <GlobalBackground />

      {/* Hero — Professional SaaS hero */}
      <main id="main-content">
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
        <CTA prefersReduced={!!prefersReduced} />
      </main>

      {/* Unified Footer */}
      <Footer />
    </div>
  );
}

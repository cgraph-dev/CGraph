/**
 * CGraph Landing Page
 *
 * Official landing page featuring:
 * - Instant hero animations on mount (no preloader for speed)
 * - Video hero section with clip-path masks
 * - Purple/lime/black color scheme
 * - Button text-swap animation
 * - 3D tilt cards with glare effect
 * - Scroll-triggered GSAP animations
 * - Skeleton loaders for lazy-loaded sections
 *
 * @module pages/landing-page/LandingPage
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/modules/auth/store';
import '../landing-page.css';

// Sub-components
import { LandingNav } from './LandingNav';
import { LandingHero } from './LandingHero';
import {
  FeatureShowcaseSection,
  InteractiveDemoSection,
  FeaturesGridSection,
  CustomizationDemoSection,
  ForumShowcaseSection,
} from './LandingSections';
import { LandingSecurity } from './LandingSecurity';
import { LandingPricing } from './LandingPricing';
import { LandingCTA } from './LandingCTA';
import { LandingFooter } from './LandingFooter';

// Hooks
import { useLandingScroll, useAboutGlow } from './hooks';
import { useLandingAnimations } from './useLandingAnimations';

/**
 * Main landing page component.
 *
 * Composes all landing page sections and orchestrates
 * scroll-triggered animations, auth redirect, and
 * hash-based section navigation.
 */
export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // Section refs for GSAP animations
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const aboutVisualRef = useRef<HTMLDivElement>(null);
  const aboutGlowRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  // Scroll-based nav visibility
  const { navHidden, navScrolled } = useLandingScroll();

  // Cursor-following glow for about section
  useAboutGlow(aboutVisualRef, aboutGlowRef);

  // GSAP scroll-triggered + hero animations
  useLandingAnimations({
    heroRef,
    featuresRef,
    statsRef,
    aboutRef,
    ctaRef,
    aboutVisualRef,
    aboutGlowRef,
    scrollIndicatorRef,
  });

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

  return (
    <div className="demo-landing">
      <LandingNav navHidden={navHidden} navScrolled={navScrolled} />
      <LandingHero heroRef={heroRef} scrollIndicatorRef={scrollIndicatorRef} />
      <FeatureShowcaseSection statsRef={statsRef} />
      <InteractiveDemoSection />
      <FeaturesGridSection featuresRef={featuresRef} />
      <CustomizationDemoSection />
      <ForumShowcaseSection />
      <LandingSecurity
        aboutRef={aboutRef}
        aboutVisualRef={aboutVisualRef}
        aboutGlowRef={aboutGlowRef}
      />
      <LandingPricing />
      <LandingCTA ctaRef={ctaRef} />
      <LandingFooter />
    </div>
  );
}

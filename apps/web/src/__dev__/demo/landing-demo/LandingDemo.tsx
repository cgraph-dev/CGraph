/**
 * CGraph Landing Page Demo - GAMELAND Style
 *
 * This is a demo page to preview the GAMELAND-inspired design:
 * - Preloader with animated loading bar
 * - Video hero section with clip-path masks
 * - Purple/lime/black color scheme
 * - Button text-swap animation
 * - 3D tilt cards with glare effect
 * - Scroll-triggered GSAP animations
 *
 * Visit /demo/landing to preview
 */

import { useState, useRef, useCallback } from 'react';
import '../landing-demo.css';

// Components
import { Preloader } from './Preloader';
import { HeroSection } from './HeroSection';
import { StatsSection } from './StatsSection';
import { FeaturesSection } from './FeaturesSection';
import { CustomizationShowcase, ForumShowcaseSection } from './ShowcaseSections';
import { SecuritySection } from './SecuritySection';
import { PricingSection } from './PricingSection';
import { CTASection } from './CTASection';
import { FooterSection } from './FooterSection';

// Hooks
import { useLandingAnimations } from './useLandingAnimations';

export default function LandingDemo() {
  const [preloading, setPreloading] = useState(true);
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

  // Initialize GSAP animations
  useLandingAnimations({
    preloading,
    heroRef,
    featuresRef,
    aboutRef,
    ctaRef,
    aboutVisualRef,
    aboutGlowRef,
    scrollIndicatorRef,
    setNavHidden,
    setNavScrolled,
  });

  const handlePreloadComplete = useCallback(() => {
    setPreloading(false);
  }, []);

  return (
    <div className="demo-landing">
      {/* Preloader */}
      {preloading && <Preloader onComplete={handlePreloadComplete} />}

      {/* Hero + Navigation */}
      <HeroSection
        ref={heroRef}
        navHidden={navHidden}
        navScrolled={navScrolled}
        scrollIndicatorRef={scrollIndicatorRef}
      />

      {/* Stats */}
      <StatsSection ref={statsRef} />

      {/* Features */}
      <FeaturesSection ref={featuresRef} />

      {/* Customization Demo */}
      <CustomizationShowcase />

      {/* Forum Showcase */}
      <ForumShowcaseSection />

      {/* About/Security */}
      <SecuritySection ref={aboutRef} aboutVisualRef={aboutVisualRef} aboutGlowRef={aboutGlowRef} />

      {/* Pricing */}
      <PricingSection />

      {/* CTA */}
      <CTASection ref={ctaRef} />

      {/* Footer */}
      <FooterSection />
    </div>
  );
}

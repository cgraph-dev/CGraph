/**
 * LandingDemoWorkshop - Main Component
 * GAMELAND-style landing page workshop
 */

import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../landing-demo-workshop.css';

// Components
import { Preloader } from './Preloader';
import { Navigation } from './Navigation';
import { HeroSection } from './HeroSection';
import { FeaturesSection } from './FeaturesSection';
import { StatsSection } from './StatsSection';
import { SecuritySection } from './SecuritySection';
import { ForumShowcaseSection, CustomizationShowcaseSection } from './ShowcaseSections';
import { PricingSection } from './PricingSection';
import { CTASection } from './CTASection';
import { FooterSection } from './FooterSection';

// Hooks
import { useNavScroll } from './useNavScroll';
import { useWorkshopAnimations } from './useWorkshopAnimations';
import { useAboutGlow } from './useAboutGlow';

gsap.registerPlugin(ScrollTrigger);

export default function LandingDemoWorkshop() {
  const [preloading, setPreloading] = useState(true);
  const { navHidden, navScrolled } = useNavScroll();

  // Section refs
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const aboutVisualRef = useRef<HTMLDivElement>(null);
  const aboutGlowRef = useRef<HTMLDivElement>(null);

  // Use custom hooks for effects
  useAboutGlow(aboutVisualRef, aboutGlowRef);
  useWorkshopAnimations(preloading, { featuresRef, statsRef, aboutRef, ctaRef });

  const handlePreloadComplete = useCallback(() => {
    setPreloading(false);
  }, []);

  return (
    <div className="demo-landing">
      {/* Preloader */}
      {preloading && <Preloader onComplete={handlePreloadComplete} />}

      {/* Navigation */}
      <Navigation navHidden={navHidden} navScrolled={navScrolled} />

      {/* Hero */}
      <HeroSection heroRef={heroRef} />

      {/* Features */}
      <FeaturesSection featuresRef={featuresRef} />

      {/* Stats */}
      <StatsSection statsRef={statsRef} />

      {/* About/Security */}
      <SecuritySection
        aboutRef={aboutRef}
        aboutVisualRef={aboutVisualRef}
        aboutGlowRef={aboutGlowRef}
      />

      {/* Forum Showcase */}
      <ForumShowcaseSection />

      {/* Customization Demo */}
      <CustomizationShowcaseSection />

      {/* Pricing */}
      <PricingSection />

      {/* CTA */}
      <CTASection ctaRef={ctaRef} />

      {/* Footer */}
      <FooterSection />

      {/* Return to current landing button */}
      <Link to="/" className="demo-return">
        ← Back to Current Landing
      </Link>
    </div>
  );
}

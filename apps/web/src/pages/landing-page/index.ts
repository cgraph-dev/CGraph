/**
 * Landing Page Module
 *
 * Full-featured landing page with GSAP scroll-triggered animations,
 * hero entrance sequence, 3D tilt cards, pricing tiers, security
 * showcase, and lazy-loaded interactive demos.
 *
 * @module pages/landing-page
 */

// Main component
export { default } from './LandingPage';

// Sub-components
export { LandingNav } from './LandingNav';
export { LandingHero } from './LandingHero';
export {
  FeatureShowcaseSection,
  InteractiveDemoSection,
  FeaturesGridSection,
  CustomizationDemoSection,
  ForumShowcaseSection,
} from './LandingSections';
export { LandingSecurity } from './LandingSecurity';
export { LandingPricing } from './LandingPricing';
export { LandingCTA } from './LandingCTA';
export { LandingFooter } from './LandingFooter';

// Hooks
export { useLandingScroll, useAboutGlow } from './hooks';
export { useLandingAnimations } from './useLandingAnimations';

// Types
export type {
  LandingRefs,
  LandingNavProps,
  LandingHeroProps,
  LandingSecurityProps,
  LandingCTAProps,
} from './types';

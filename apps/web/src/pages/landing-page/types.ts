/**
 * Landing Page Types
 *
 * Type definitions for the LandingPage module and its sub-components.
 *
 * @module pages/landing-page/types
 */

import type { RefObject } from 'react';

/** Refs used by the landing page for scroll-triggered animations */
export interface LandingRefs {
  /** Reference to the hero section */
  heroRef: RefObject<HTMLDivElement | null>;
  /** Reference to the features section */
  featuresRef: RefObject<HTMLDivElement | null>;
  /** Reference to the stats/showcase section */
  statsRef: RefObject<HTMLDivElement | null>;
  /** Reference to the about/security section */
  aboutRef: RefObject<HTMLDivElement | null>;
  /** Reference to the CTA section */
  ctaRef: RefObject<HTMLDivElement | null>;
  /** Reference to the about section visual container */
  aboutVisualRef: RefObject<HTMLDivElement | null>;
  /** Reference to the cursor-following glow element */
  aboutGlowRef: RefObject<HTMLDivElement | null>;
  /** Reference to the scroll indicator */
  scrollIndicatorRef: RefObject<HTMLDivElement | null>;
}

/** Props for the LandingNav component */
export interface LandingNavProps {
  /** Whether the nav bar is hidden (scrolled down) */
  navHidden: boolean;
  /** Whether the nav bar has a scrolled background */
  navScrolled: boolean;
}

/** Props for the LandingHero component */
export interface LandingHeroProps {
  /** Reference to the hero section for animations */
  heroRef: RefObject<HTMLDivElement | null>;
  /** Reference to the scroll indicator for animations */
  scrollIndicatorRef: RefObject<HTMLDivElement | null>;
  /** Motion scale factor from useAdaptiveMotion (0-1) */
  motionScale?: number;
}

/** Props for the LandingSecurity component */
export interface LandingSecurityProps {
  /** Reference to the about/security section */
  aboutRef: RefObject<HTMLDivElement | null>;
  /** Reference to the about visual container */
  aboutVisualRef: RefObject<HTMLDivElement | null>;
  /** Reference to the cursor-following glow */
  aboutGlowRef: RefObject<HTMLDivElement | null>;
}

/** Props for the LandingCTA component */
export interface LandingCTAProps {
  /** Reference to the CTA section for animations */
  ctaRef: RefObject<HTMLDivElement | null>;
}

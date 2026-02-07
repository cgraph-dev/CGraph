/**
 * Landing Page Hero Section
 *
 * Full-viewport hero with animated background layers,
 * staggered entrance text, call-to-action buttons,
 * and a scroll indicator.
 *
 * @module pages/landing-page/LandingHero
 */

import { SwapButton } from '../landing';
import type { LandingHeroProps } from './types';

/**
 * Hero section displayed at the top of the landing page.
 *
 * Background layers include gradient, aurora, grid, particles,
 * streaks, spotlight, noise, and vignette effects composed
 * entirely via CSS classes.
 */
export function LandingHero({ heroRef, scrollIndicatorRef }: LandingHeroProps) {
  return (
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
          Real-time messaging meets community forums — with bank-grade encryption, Web3
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
  );
}

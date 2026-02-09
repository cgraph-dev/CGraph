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
import { FloatingLogo } from '@/components/landing/FloatingLogo';
import { KineticText } from '@/components/landing/KineticText';
import { ParticleField } from '@/components/landing/ParticleField';
import type { LandingHeroProps } from './types';

/**
 * Hero section displayed at the top of the landing page.
 *
 * Background layers include gradient, aurora, grid, particles,
 * streaks, spotlight, noise, and vignette effects composed
 * entirely via CSS classes. Integrates KineticText for animated
 * typography, ParticleField for ambient effects, and FloatingLogo
 * for the 3D-style interactive logo.
 */
export function LandingHero({ heroRef, scrollIndicatorRef, motionScale = 1 }: LandingHeroProps) {
  return (
    <section ref={heroRef} className="hero">
      <div className="hero__bg">
        <div className="hero__gradient-bg" />
        <div className="hero__bg-aurora" />
        <div className="hero__bg-grid" />
        <ParticleField
          count={Math.round(50 * motionScale)}
          colors={['emerald', 'purple', 'cyan']}
          className="pointer-events-none absolute inset-0"
        />
        <div className="hero__bg-streaks" />
        <div className="hero__bg-spotlight" />
        <div className="hero__bg-interactive" />
        <div className="hero__bg-noise" />
        <div className="hero__bg-vignette" />
        <div className="hero__bg-fade" />
      </div>

      <div className="hero__content">
        <FloatingLogo size={120} mouseIntensity={0.2} floatAmplitude={8} className="mx-auto mb-6" />
        <span className="hero__eyebrow font-robert">The All-in-One Platform</span>

        <h1 className="hero__title">
          <KineticText text="Beyond" animation="words" as="span" className="hero__title-beyond" />
          <KineticText
            text="Messaging"
            animation="gradient"
            as="span"
            className="hero__title-gradient"
          />
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

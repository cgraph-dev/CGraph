/**
 * Hero Section Component
 */

import { forwardRef, RefObject } from 'react';
import { LogoIcon } from '@/components/Logo';
import { SignInButton, SwapButton } from './Buttons';

interface HeroSectionProps {
  navHidden: boolean;
  navScrolled: boolean;
  scrollIndicatorRef: RefObject<HTMLDivElement | null>;
}

export const HeroSection = forwardRef<HTMLDivElement, HeroSectionProps>(function HeroSection(
  { navHidden, navScrolled, scrollIndicatorRef },
  ref
) {
  return (
    <>
      {/* Navigation */}
      <nav className={`gl-nav ${navHidden ? 'hidden' : ''} ${navScrolled ? 'scrolled' : ''}`}>
        <a href="/demo/landing" className="gl-nav__logo">
          <LogoIcon size={32} showGlow animated color="gradient" />
          <span className="gl-nav__logo-text">CGraph</span>
        </a>

        <div className="gl-nav__links">
          <a href="#features" className="gl-nav__link">
            Features
          </a>
          <a href="#security" className="gl-nav__link">
            Security
          </a>
          <a href="#pricing" className="gl-nav__link">
            Pricing
          </a>
        </div>

        <SignInButton />
      </nav>

      {/* Hero */}
      <section ref={ref} className="hero">
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

          <h1 className="hero__title font-zentry">
            <span>Beyond</span>
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
    </>
  );
});

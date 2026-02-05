/**
 * HeroSection Component
 * Main hero section with gradient background
 */

import type { RefObject } from 'react';
import { SwapButton } from './SwapButton';

interface HeroSectionProps {
  heroRef: RefObject<HTMLDivElement | null>;
}

export function HeroSection({ heroRef }: HeroSectionProps) {
  return (
    <section ref={heroRef} className="hero">
      <div className="hero__bg">
        <div className="hero__gradient-bg" />
      </div>

      <div className="hero__content">
        <span className="hero__eyebrow font-robert">Secure • Fast • Social</span>

        <h1 className="hero__title font-zentry">
          <span>Connect</span>
          <span className="hero__title-gradient">Without Limits</span>
        </h1>

        <p className="hero__subtitle font-robert">
          The next-generation communication platform with end-to-end encryption, real-time
          messaging, and a thriving community ecosystem.
        </p>

        <div className="hero__buttons">
          <SwapButton primary mainText="Start Free" altText="No Credit Card" href="/register" />
          <SwapButton mainText="Learn More" altText="Explore" href="#features" />
        </div>
      </div>

      <div className="hero__scroll">
        <span>Scroll</span>
        <div className="hero__scroll-line" />
      </div>
    </section>
  );
}

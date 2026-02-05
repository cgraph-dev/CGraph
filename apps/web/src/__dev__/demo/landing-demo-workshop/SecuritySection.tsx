/**
 * SecuritySection Component
 * Security features section with icon grid
 */

import type { RefObject } from 'react';
import { SwapButton } from './SwapButton';
import { SecurityIconCard } from './SecurityIconCard';
import { securityFeatures } from './constants';

interface SecuritySectionProps {
  aboutRef: RefObject<HTMLDivElement | null>;
  aboutVisualRef: RefObject<HTMLDivElement | null>;
  aboutGlowRef: RefObject<HTMLDivElement | null>;
}

export function SecuritySection({ aboutRef, aboutVisualRef, aboutGlowRef }: SecuritySectionProps) {
  return (
    <section ref={aboutRef} id="security" className="about">
      <div className="about__container">
        <div className="about__content">
          <p className="about__eyebrow font-robert">Bank-Grade Security</p>
          <h2 className="about__title font-zentry">Your Privacy Is Our Priority</h2>
          <p className="about__desc">
            Built from the ground up with security in mind. We use the Signal Protocol for
            end-to-end encryption, ensuring that only you and your recipients can read your
            messages. Not even we can access your private conversations.
          </p>
          <SwapButton mainText="Security Details" altText="Learn More" />
        </div>

        <div ref={aboutVisualRef} className="about__visual">
          <div className="about__orb" />
          <div
            ref={aboutGlowRef}
            className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-0 blur-3xl"
          />
          <div className="about__icon-grid">
            {securityFeatures.map((feature, i) => (
              <SecurityIconCard key={i} feature={feature} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

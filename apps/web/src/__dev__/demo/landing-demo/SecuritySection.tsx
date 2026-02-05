/**
 * Security/About Section Component
 */

import { forwardRef, RefObject } from 'react';
import { SecurityIconCard } from './SecurityIconCard';
import { SwapButton } from './Buttons';
import { securityFeatures } from './constants';

interface SecuritySectionProps {
  aboutVisualRef: RefObject<HTMLDivElement | null>;
  aboutGlowRef: RefObject<HTMLDivElement | null>;
}

export const SecuritySection = forwardRef<HTMLDivElement, SecuritySectionProps>(
  function SecuritySection({ aboutVisualRef, aboutGlowRef }, ref) {
    return (
      <section ref={ref} id="security" className="about zoom-section">
        <div className="about__container">
          <div className="about__content">
            <p className="about__eyebrow font-robert">Privacy-First Design</p>
            <h2 className="about__title font-zentry">Your Privacy Is Our Priority</h2>
            <p className="about__desc">
              Built from the ground up with security in mind. Your messages are end-to-end encrypted
              with AES-256, and we use Signal-inspired encryption protocols. Not even we can access
              your private conversations.
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
);

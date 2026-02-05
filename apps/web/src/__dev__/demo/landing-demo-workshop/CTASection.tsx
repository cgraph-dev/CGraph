/**
 * CTASection Component
 * Call-to-action section
 */

import type { RefObject } from 'react';
import { SwapButton } from './SwapButton';

interface CTASectionProps {
  ctaRef: RefObject<HTMLDivElement | null>;
}

export function CTASection({ ctaRef }: CTASectionProps) {
  return (
    <section ref={ctaRef} className="cta">
      <div className="cta__content">
        <span className="cta__rocket">🚀</span>
        <h2 className="cta__title font-zentry">
          Ready for <span className="cta__highlight">True Privacy</span>?
        </h2>
        <p className="cta__desc font-robert">
          Join thousands building the future of secure communication.
        </p>
        <div className="cta__buttons">
          <SwapButton
            primary
            mainText="Create Free Account"
            altText="It's Free!"
            href="/register"
          />
          <SwapButton mainText="Sign In" altText="Welcome Back" href="/login" />
        </div>
      </div>
    </section>
  );
}

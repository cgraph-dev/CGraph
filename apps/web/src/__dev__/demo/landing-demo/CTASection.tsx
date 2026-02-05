/**
 * CTA Section Component
 */

import { forwardRef } from 'react';
import { SwapButton } from './Buttons';

export const CTASection = forwardRef<HTMLDivElement>(function CTASection(_props, ref) {
  return (
    <section ref={ref} className="cta zoom-section">
      <div className="cta__content">
        <span className="cta__rocket">🚀</span>
        <h2 className="cta__title font-zentry">
          Build Your <span className="cta__highlight">Community</span>
        </h2>
        <p className="cta__desc font-robert">
          Create forums, customize your space, and connect with like-minded people.
        </p>
        <div className="cta__buttons">
          <SwapButton primary mainText="Create Account" altText="Join Now!" href="/register" />
          <SwapButton mainText="Sign In" altText="Welcome Back" href="/login" />
        </div>
      </div>
    </section>
  );
});

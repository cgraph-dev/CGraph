/**
 * Landing Page CTA Section
 *
 * Call-to-action section encouraging users to create an account
 * or sign in, with animated badge and swap buttons.
 *
 * @module pages/landing-page/LandingCTA
 */

import { SwapButton } from '../landing';
import type { LandingCTAProps } from './types';

/**
 * Bottom call-to-action section with account creation prompts.
 */
export function LandingCTA({ ctaRef }: LandingCTAProps) {
  return (
    <section ref={ctaRef} className="cta zoom-section">
      <div className="cta__content">
        <span className="mb-4 inline-block animate-[badge-emerald-pulse_4s_ease-in-out_infinite] cursor-default rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-sm text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15),0_0_24px_rgba(16,185,129,0.08)] transition-all duration-300 hover:scale-[1.02] hover:animate-none hover:border-emerald-500/60 hover:bg-emerald-500/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.3),0_0_40px_rgba(16,185,129,0.15)]">
          🚀 Ready to Start?
        </span>
        <h2 className="cta__title font-zentry">
          Build Your <span className="cta__gradient-animated">Community</span>
        </h2>
        <p className="cta__desc">
          Create forums, customize your space, and connect with like-minded people.
        </p>
        <div className="cta__buttons">
          <SwapButton primary mainText="Create Account" altText="Join Now!" href="/register" />
          <SwapButton mainText="Sign In" altText="Welcome Back" href="/login" />
        </div>
      </div>
    </section>
  );
}

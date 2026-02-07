/**
 * Landing Page Security Section
 *
 * Privacy-first design section with interactive cursor-following
 * glow effect and security feature icon grid.
 *
 * @module pages/landing-page/LandingSecurity
 */

import { securityFeatures, SecurityIconCard, SwapButton } from '../landing';
import type { LandingSecurityProps } from './types';

/**
 * About/Security section highlighting CGraph's privacy-first approach.
 *
 * Features an interactive visual area with a cursor-following glow
 * and a grid of security feature icons.
 */
export function LandingSecurity({ aboutRef, aboutVisualRef, aboutGlowRef }: LandingSecurityProps) {
  return (
    <section ref={aboutRef} id="security" className="about zoom-section">
      <div className="about__container">
        <div className="about__content">
          <span className="mb-4 inline-block animate-[badge-subtle-pulse_4s_ease-in-out_infinite] cursor-default rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1 text-sm text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.15),0_0_24px_rgba(168,85,247,0.08)] transition-all duration-300 hover:scale-[1.02] hover:animate-none hover:border-purple-500/60 hover:bg-purple-500/20 hover:shadow-[0_0_20px_rgba(168,85,247,0.3),0_0_40px_rgba(168,85,247,0.15)]">
            🔒 Privacy-First Design
          </span>
          <h2 className="about__title font-zentry">
            Your Privacy Is Our <span className="about__gradient">Priority</span>
          </h2>
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

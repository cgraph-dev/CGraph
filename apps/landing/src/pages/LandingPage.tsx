/**
 * CGraph Landing Page — Liquid Glass Redesign
 *
 * Clean, pearl-white landing with the cgraph-liquid-glass-v1 design system.
 * Sections: Hero (3D glass orb) → Features → Pricing → Social Proof → CTA → Footer.
 *
 * Stack: React 19 + Vite + Tailwind + Framer Motion 12 + Three.js
 */

import {
  Navigation,
  HeroSection,
  FeaturesSection,
  PricingSection,
  SocialProofSection,
  CTASection,
  Footer,
} from '../components/liquid-glass';
import SEO from '../components/SEO';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-pearl">
      <SEO path="/" />
      <Navigation />

      <main id="main-content">
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <SocialProofSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}

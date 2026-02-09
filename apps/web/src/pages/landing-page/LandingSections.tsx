/**
 * Landing Page Content Sections
 *
 * Mid-page sections: feature showcase cards, interactive demo,
 * features grid, customization demo, and forum showcase.
 * Each section uses lazy-loaded Suspense boundaries.
 *
 * @module pages/landing-page/LandingSections
 */

import { lazy, Suspense, type RefObject } from 'react';
import { features, showcaseCards, TiltCard, FeatureShowcaseCard } from '../landing';
import {
  CustomizationDemoSkeleton,
  ForumShowcaseSkeleton,
} from '@/components/landing/LandingSkeletons';
import { BentoGrid, BentoItem } from '@/components/landing/BentoGrid';
import { GlassCard } from '@/components/landing/GlassCard';

// Lazy load showcase components
const CustomizationDemo = lazy(() =>
  import('@/components/landing/CustomizationDemo').then((m) => ({ default: m.CustomizationDemo }))
);

const ForumShowcase = lazy(() =>
  import('@/components/landing/ForumShowcase').then((m) => ({ default: m.ForumShowcase }))
);

const InteractiveDemo = lazy(() =>
  import('@/components/landing/InteractiveDemo').then((m) => ({ default: m.InteractiveDemo }))
);

/** Props for the feature showcase section */
interface ShowcaseSectionProps {
  /** Ref for scroll-triggered animations */
  statsRef: RefObject<HTMLDivElement | null>;
}

/**
 * Feature showcase cards with 3D hover reveal effects.
 */
export function FeatureShowcaseSection({ statsRef }: ShowcaseSectionProps) {
  return (
    <section ref={statsRef} className="stats-section zoom-section">
      <div className="showcase-header">
        <span className="showcase-header__badge">✨ See the Difference</span>
        <h3 className="showcase-header__title">Hover to Discover Premium Features</h3>
      </div>
      <div className="stats-grid">
        {showcaseCards.map((card) => (
          <FeatureShowcaseCard key={card.id} data={card} />
        ))}
      </div>
    </section>
  );
}

/**
 * Interactive demo section with live feature preview.
 */
export function InteractiveDemoSection() {
  return (
    <section className="interactive-demo-section zoom-section">
      <div className="section-header">
        <span className="section-header__badge section-header__badge--cyan">🎮 Try It Now</span>
        <h2 className="section-header__title font-zentry">
          Experience CGraph <span className="section-header__gradient">Live</span>
        </h2>
        <p className="section-header__desc">
          No signup required. Explore our features in this interactive demo.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="interactive-demo-skeleton">
            <div className="interactive-demo-skeleton__header" />
            <div className="interactive-demo-skeleton__content" />
          </div>
        }
      >
        <InteractiveDemo />
      </Suspense>
    </section>
  );
}

/** Props for the features grid section */
interface FeaturesGridProps {
  /** Ref for scroll-triggered animations */
  featuresRef: RefObject<HTMLDivElement | null>;
}

/**
 * Feature grid section with bento layout and glass cards.
 */
export function FeaturesGridSection({ featuresRef }: FeaturesGridProps) {
  return (
    <section ref={featuresRef} id="features" className="features zoom-section">
      <div className="section-header">
        <span className="section-header__badge section-header__badge--emerald">
          ✨ Powerful Features
        </span>
        <h2 className="section-header__title font-zentry">
          Everything You <span className="section-header__gradient">Need</span>
        </h2>
        <p className="section-header__desc">
          Build, customize, and grow your community with our comprehensive feature set.
        </p>
      </div>

      <BentoGrid className="features__grid">
        {features.map((feature, index) => (
          <BentoItem key={feature.title} size={index < 2 ? 'wide' : 'small'}>
            <GlassCard variant="emerald" hoverable className="h-full">
              <TiltCard {...feature} />
            </GlassCard>
          </BentoItem>
        ))}
      </BentoGrid>
    </section>
  );
}

/**
 * Customization demo section with lazy-loaded showcase.
 */
export function CustomizationDemoSection() {
  return (
    <section className="showcase-section zoom-section">
      <Suspense fallback={<CustomizationDemoSkeleton />}>
        <CustomizationDemo />
      </Suspense>
    </section>
  );
}

/**
 * Forum showcase section with lazy-loaded demo.
 */
export function ForumShowcaseSection() {
  return (
    <section className="showcase-section showcase-section--alt zoom-section">
      <Suspense fallback={<ForumShowcaseSkeleton />}>
        <ForumShowcase />
      </Suspense>
    </section>
  );
}

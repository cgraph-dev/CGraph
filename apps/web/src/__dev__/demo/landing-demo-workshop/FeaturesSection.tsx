/**
 * FeaturesSection Component
 * Features grid with tilt cards
 */

import type { RefObject } from 'react';
import { TiltCard } from './TiltCard';
import { features } from './constants';

interface FeaturesSectionProps {
  featuresRef: RefObject<HTMLDivElement | null>;
}

export function FeaturesSection({ featuresRef }: FeaturesSectionProps) {
  return (
    <section ref={featuresRef} id="features" className="features">
      <div className="features__header">
        <p className="features__eyebrow">Powerful Features</p>
        <h2 className="features__title font-zentry">Everything You Need</h2>
      </div>

      <div className="features__grid">
        {features.map((feature) => (
          <TiltCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
}

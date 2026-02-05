/**
 * Features Section Component
 */

import { forwardRef } from 'react';
import { TiltCard } from './TiltCard';
import { features } from './constants';

export const FeaturesSection = forwardRef<HTMLDivElement>(function FeaturesSection(_props, ref) {
  return (
    <section ref={ref} id="features" className="features zoom-section">
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
});

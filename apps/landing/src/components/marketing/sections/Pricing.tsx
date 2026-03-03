/**
 * Pricing Section
 *
 * 3-tier pricing comparison with monthly/annual toggle.
 * Data sourced from pricing-data.ts to match backend TierFeatures.
 *
 * @since v1.0.0
 */

import { useState, memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SectionHeader } from '../ui/SectionHeader';
import { LandingButton } from '../ui/LandingButton';
import { pricingTiers } from '@/data/pricing-data';

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: i * 0.15,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

export const PricingSection = memo(function PricingSection() {
  const [annual, setAnnual] = useState(false);
  const prefersReduced = useReducedMotion();

  return (
    <section id="pricing" className="pricing-section zoom-section">
      <SectionHeader
        badge="Pricing"
        badgeVariant="emerald"
        title="Simple,"
        titleAccent="Transparent Pricing"
        titleAccentClass="title-fx--air"
        description="Start free. Upgrade when you're ready. No hidden fees."
      />

      {/* Monthly / Annual Toggle */}
      <div className="mx-auto mb-12 flex items-center justify-center gap-4">
        <span className={`text-sm font-medium ${!annual ? 'text-white' : 'text-gray-500'}`}>
          Monthly
        </span>
        <button
          onClick={() => setAnnual(!annual)}
          className={`relative h-7 w-14 rounded-full transition-colors ${
            annual ? 'bg-emerald-600' : 'bg-dark-600'
          }`}
          aria-label="Toggle annual billing"
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
              annual ? 'translate-x-7' : 'translate-x-0.5'
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${annual ? 'text-white' : 'text-gray-500'}`}>
          Annual
          <span className="ml-1.5 rounded bg-emerald-900/50 px-1.5 py-0.5 text-xs text-emerald-400">
            Save 17%
          </span>
        </span>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-6 md:grid-cols-3">
        {pricingTiers.map((tier, i) => {
          const price = annual ? tier.annualPrice : tier.price;
          return (
            <motion.div
              key={tier.name}
              custom={i}
              variants={prefersReduced ? {} : cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              className={`relative rounded-2xl border p-8 ${
                tier.highlighted
                  ? 'border-emerald-500/50 bg-gradient-to-b from-emerald-950/40 to-dark-900/80 shadow-[0_0_40px_rgba(16,185,129,0.15)]'
                  : 'border-dark-700/50 bg-dark-900/60'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-emerald-600 px-4 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                </div>
              )}

              <h3 className="text-xl font-bold text-white">{tier.name}</h3>
              <p className="mt-1 text-sm text-gray-400">{tier.description}</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">
                  {price === 0 ? 'Free' : `$${price.toFixed(2)}`}
                </span>
                {price > 0 && <span className="text-gray-500">/mo</span>}
              </div>

              <div className="mt-8">
                <LandingButton
                  href={tier.ctaLink}
                  variant={tier.highlighted ? 'primary' : 'secondary'}
                  size="md"
                  className="w-full justify-center"
                >
                  {tier.cta}
                </LandingButton>
              </div>

              <ul className="mt-8 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-300">
                    <svg
                      className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
});

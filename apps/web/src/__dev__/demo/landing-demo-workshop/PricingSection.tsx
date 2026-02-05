/**
 * PricingSection Component
 * Pricing tiers display section
 */

import { Link } from 'react-router-dom';
import { pricingTiers } from './constants';

export function PricingSection() {
  return (
    <section id="pricing" className="pricing">
      <div className="pricing__header">
        <p className="features__eyebrow font-robert">Pricing</p>
        <h2 className="features__title font-zentry">Simple, Transparent Pricing</h2>
      </div>

      <div className="pricing__grid">
        {pricingTiers.map((tier) => (
          <div
            key={tier.name}
            className={`pricing__card ${tier.highlighted ? 'pricing__card--highlighted' : ''}`}
          >
            {tier.highlighted && <span className="pricing__badge">Most Popular</span>}
            <h3 className="pricing__name font-robert">{tier.name}</h3>
            <div className="pricing__price">
              <span className="pricing__amount">{tier.price}</span>
              <span className="pricing__period">{tier.period}</span>
            </div>
            <p className="pricing__desc">{tier.description}</p>

            <ul className="pricing__features">
              {tier.features.map((feature) => (
                <li key={feature}>
                  <svg
                    className="pricing__check"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              to="/register"
              className={`pricing__cta ${tier.highlighted ? 'pricing__cta--primary' : ''}`}
            >
              {tier.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

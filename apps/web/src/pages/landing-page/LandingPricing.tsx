/**
 * Landing Page Pricing Section
 *
 * Pricing tier cards with feature lists, popular badge,
 * and call-to-action buttons.
 *
 * @module pages/landing-page/LandingPricing
 */

import { Link } from 'react-router-dom';
import { pricingTiers } from '../landing';

/**
 * Pricing section displaying all available plan tiers.
 *
 * Each tier card shows price, description, feature list,
 * and a CTA button. The highlighted tier gets a "Most Popular" badge.
 */
export function LandingPricing() {
  return (
    <section id="pricing" className="pricing zoom-section">
      <div className="section-header">
        <span className="section-header__badge section-header__badge--cyan">💎 Pricing</span>
        <h2 className="section-header__title font-zentry">
          Simple, <span className="pricing__gradient-animated">Transparent</span> Pricing
        </h2>
        <p className="section-header__desc">
          Choose the plan that fits your community. No hidden fees, cancel anytime.
        </p>
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

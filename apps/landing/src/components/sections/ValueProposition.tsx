/**
 * ValueProposition Section
 *
 * Replaces the pricing section with a "Why CGraph?" comparison.
 * Follows Discord's approach: show the value, not premature pricing.
 * Features 4 key differentiators with highlighted stats.
 *
 * @since v2.1.0
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { valueProps, WEB_APP_URL } from '../../data/landing-data';
import type { ValuePropData } from '../../data/landing-data';

const ValueCard = memo(function ValueCard({ data, index }: { data: ValuePropData; index: number }) {
  return (
    <motion.div
      className="value-card"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <div className="value-card__icon" aria-hidden="true">
        {data.icon}
      </div>
      {data.highlight && <span className="value-card__highlight">{data.highlight}</span>}
      <h3 className="value-card__title">{data.title}</h3>
      <p className="value-card__desc">{data.description}</p>
    </motion.div>
  );
});

export default function ValueProposition(): React.JSX.Element {
  return (
    <section id="pricing" className="value-section zoom-section">
      <div className="section-header">
        <span className="section-header__badge section-header__badge--cyan">💎 Why CGraph?</span>
        <h2 className="section-header__title font-zentry">
          Built <span className="section-header__gradient">Different</span>
        </h2>
        <p className="section-header__desc">
          Not just another chat app. CGraph combines the best of Discord, Signal, and Reddit into
          one privacy-first platform.
        </p>
      </div>

      <div className="value-grid">
        {valueProps.map((prop, i) => (
          <ValueCard key={prop.title} data={prop} index={i} />
        ))}
      </div>

      {/* Comparison row */}
      <motion.div
        className="value-comparison"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="value-comparison__row">
          <span className="value-comparison__feature">E2E Encryption</span>
          <span className="value-comparison__us">✓</span>
          <span className="value-comparison__them">Limited</span>
        </div>
        <div className="value-comparison__row">
          <span className="value-comparison__feature">Built-in Forums</span>
          <span className="value-comparison__us">✓</span>
          <span className="value-comparison__them">✗</span>
        </div>
        <div className="value-comparison__row">
          <span className="value-comparison__feature">Gamification</span>
          <span className="value-comparison__us">✓</span>
          <span className="value-comparison__them">✗</span>
        </div>
        <div className="value-comparison__row">
          <span className="value-comparison__feature">Web3 Auth</span>
          <span className="value-comparison__us">✓</span>
          <span className="value-comparison__them">✗</span>
        </div>
        <div className="value-comparison__header">
          <span />
          <span className="value-comparison__label value-comparison__label--us">CGraph</span>
          <span className="value-comparison__label">Others</span>
        </div>
      </motion.div>

      {/* Single CTA */}
      <motion.div
        className="value-cta"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <a href={`${WEB_APP_URL}/register`} className="value-cta__btn">
          Start for Free — No Credit Card Required
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </a>
      </motion.div>
    </section>
  );
}

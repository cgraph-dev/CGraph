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
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
    >
      <motion.div
        className="value-card__icon"
        aria-hidden="true"
        initial={{ scale: 0.5, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 + 0.2, type: 'spring', stiffness: 300, damping: 12 }}
      >
        {data.icon}
      </motion.div>
      {data.highlight && (
        <motion.span
          className="value-card__highlight"
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 + 0.3 }}
        >
          {data.highlight}
        </motion.span>
      )}
      <h3 className="value-card__title">{data.title}</h3>
      <p className="value-card__desc">{data.description}</p>
    </motion.div>
  );
});

export default function ValueProposition(): React.JSX.Element {
  return (
    <section id="pricing" className="value-section zoom-section">
      <div className="section-header">
        <motion.span
          className="section-header__badge section-header__badge--cyan"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
        >
          💎 Why CGraph?
        </motion.span>
        <motion.h2
          className="section-header__title font-zentry"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Built <span className="section-header__gradient">Different</span>
        </motion.h2>
        <motion.p
          className="section-header__desc"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Not just another chat app. CGraph combines the best of Discord, Signal, and Reddit into
          one privacy-first platform.
        </motion.p>
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
        {[
          { feature: 'E2E Encryption', us: '✓', them: 'Limited' },
          { feature: 'Built-in Forums', us: '✓', them: '✗' },
          { feature: 'Gamification', us: '✓', them: '✗' },
          { feature: 'Web3 Auth', us: '✓', them: '✗' },
        ].map((row, i) => (
          <motion.div
            key={row.feature}
            className="value-comparison__row"
            initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 + i * 0.08 }}
          >
            <span className="value-comparison__feature">{row.feature}</span>
            <motion.span
              className="value-comparison__us"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 + i * 0.08, type: 'spring', stiffness: 300, damping: 12 }}
            >
              {row.us}
            </motion.span>
            <span className="value-comparison__them">{row.them}</span>
          </motion.div>
        ))}
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
        <motion.a
          href={`${WEB_APP_URL}/register`}
          className="value-cta__btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
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
        </motion.a>
      </motion.div>
    </section>
  );
}

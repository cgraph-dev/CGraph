/**
 * ValueProposition Section
 *
 * Replaces the pricing section with a "Why CGraph?" comparison.
 * Shows the value proposition, not premature pricing.
 * Features 4 key differentiators with highlighted stats.
 *
 * @since v2.1.0
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { valueProps } from '../../../data/landing-data';
import type { ValuePropData } from '../../../data/landing-data';
import { SectionHeader } from '../ui/SectionHeader';
import { FlowingBorder } from '../../customization-demo/effects';

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
      <SectionHeader
        badge="Why CGraph?"
        badgeVariant="cyan"
        title="Built"
        titleAccent="Different"
        titleAccentClass="title-fx--air"
        description="Not just another chat app. CGraph unifies real-time messaging, community forums, and military-grade encryption into one privacy-first platform."
      />

      <div className="value-grid">
        {valueProps.map((prop, i) => (
          <ValueCard key={prop.title} data={prop} index={i} />
        ))}
      </div>

      {/* Comparison row */}
      <motion.div
        className="value-comparison panel-border-glow"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <FlowingBorder borderRadius="12px" />
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
    </section>
  );
}

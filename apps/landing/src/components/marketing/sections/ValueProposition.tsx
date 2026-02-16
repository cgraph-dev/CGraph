/**
 * ValueProposition Section
 *
 * Replaces the pricing section with a "Why CGraph?" comparison.
 * Shows the value proposition, not premature pricing.
 * Features 4 key differentiators with highlighted stats.
 *
 * @since v2.1.0
 */

import { memo, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { valueProps } from '../../../data/landing-data';
import type { ValuePropData } from '../../../data/landing-data';
import { SectionHeader } from '../ui/SectionHeader';
import { FlowingBorder } from '../../customization-demo/effects';

type ValueIconVariant = 'encryption' | 'forums' | 'gamification' | 'realtime';

const getValueIconVariant = (title: string): ValueIconVariant => {
  if (title === 'Post-Quantum Encryption') return 'encryption';
  if (title === 'Forums Built In') return 'forums';
  if (title === 'Gamification That Works') return 'gamification';
  return 'realtime';
};

const ValueCardIcon = ({ title, index }: { title: string; index: number }) => {
  const variant = getValueIconVariant(title);
  const style = {
    '--value-icon-delay': `${index * 0.18}s`,
  } as CSSProperties;

  const className = `value-card__icon-neon value-card__icon-neon--${variant}`;

  if (variant === 'encryption') {
    return (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.6}
        style={style}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
        />
      </svg>
    );
  }

  if (variant === 'forums') {
    return (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.6}
        style={style}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.5 17.25h-3a1.5 1.5 0 01-1.5-1.5V6.75a1.5 1.5 0 011.5-1.5h10.5a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5H10.5l-3 3v-3z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h3m-3 3h6" />
      </svg>
    );
  }

  if (variant === 'gamification') {
    return (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.6}
        style={style}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 5.25h7.5v2.25a3.75 3.75 0 01-3.75 3.75A3.75 3.75 0 018.25 7.5V5.25z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.75 11.25v2.25a2.25 2.25 0 01-2.25 2.25H6.75m7.5-4.5v2.25a2.25 2.25 0 002.25 2.25h.75"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 18.75h3m-4.5 0h6" />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.6}
      style={style}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v10.5m0-10.5l-3 3m3-3l3 3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 13.5h2.25v4.5h9v-4.5h2.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 15.75h4.5" />
    </svg>
  );
};

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
        <ValueCardIcon title={data.title} index={index} />
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

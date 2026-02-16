import { memo } from 'react';
import { motion } from 'framer-motion';
import { GradientText } from './GradientText';

export interface SectionHeaderProps {
  badge: string;
  badgeVariant?: 'emerald' | 'purple' | 'cyan' | 'orange';
  title: string;
  titleAccent: string;
  titleAccentClass?: string;
  description: string;
}

export const SectionHeader = memo(function SectionHeader({
  badge,
  badgeVariant = 'emerald',
  title,
  titleAccent,
  titleAccentClass = '',
  description,
}: SectionHeaderProps) {
  return (
    <div className="section-header">
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 10 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <span className={`section-header__badge section-header__badge--${badgeVariant}`}>
          <span className="section-header__badge-chrome" aria-hidden="true" />
          <span className="section-header__badge-dot" aria-hidden="true" />
          <span className="section-header__badge-text">{badge}</span>
        </span>
      </motion.div>
      <motion.h2
        className="section-header__title font-zentry"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {title}{' '}
        <GradientText variant="emerald-purple" animated className={titleAccentClass}>
          {titleAccent}
        </GradientText>
      </motion.h2>
      <motion.p
        className="section-header__desc font-space"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {description}
      </motion.p>
    </div>
  );
});

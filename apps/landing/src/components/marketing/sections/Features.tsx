import React from 'react';
import { motion } from 'framer-motion';
import { features } from '../../../data/landing-data';
import { SectionHeader } from '../ui/SectionHeader';
import { FeatureCard } from '../ui/FeatureCard';

type NeonFeatureIconVariant = 'shield' | 'bolt' | 'chain' | 'crown' | 'folder' | 'spark';

const getFeatureIconVariant = (title: string): NeonFeatureIconVariant => {
  if (title.includes('Encrypted') || title.includes('Encrypte')) return 'shield';
  if (title.includes('Real-Time')) return 'bolt';
  if (title.includes('Web3')) return 'chain';
  if (title.includes('Gamified')) return 'crown';
  if (title.includes('File Sharing')) return 'folder';
  return 'spark';
};

const NeonFeatureIcon = ({
  variant,
  delay = 0,
}: {
  variant: NeonFeatureIconVariant;
  delay?: number;
}) => {
  const style = { '--feature-icon-delay': `${delay}s` } as React.CSSProperties;

  const shared = {
    className: 'feature-card__icon-svg',
    fill: 'none',
    viewBox: '0 0 24 24',
    stroke: 'currentColor',
    strokeWidth: 1.7,
  };

  if (variant === 'shield') {
    return (
      <span
        className="feature-card__icon-neon feature-card__icon-neon--shield"
        style={style}
        aria-hidden="true"
      >
        <svg {...shared}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.96 11.96 0 013.598 6 11.99 11.99 0 003 9.744c0 1.947.466 3.784 1.294 5.41a12.04 12.04 0 009.61 7.593c.31.042.625.063.944.063a12.054 12.054 0 009.61-7.593 11.99 11.99 0 001.294-5.41c0-1.306-.208-2.564-.598-3.743A11.959 11.959 0 0112 2.714z"
          />
        </svg>
      </span>
    );
  }

  if (variant === 'bolt') {
    return (
      <span
        className="feature-card__icon-neon feature-card__icon-neon--bolt"
        style={style}
        aria-hidden="true"
      >
        <svg {...shared}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
        </svg>
      </span>
    );
  }

  if (variant === 'chain') {
    return (
      <span
        className="feature-card__icon-neon feature-card__icon-neon--chain"
        style={style}
        aria-hidden="true"
      >
        <svg {...shared}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.19 8.688a4.5 4.5 0 016.364 6.364l-1.757 1.757a4.5 4.5 0 01-6.364 0m1.757-9.879a4.5 4.5 0 00-6.364 0L5.07 8.687a4.5 4.5 0 000 6.364m3.182-3.182l7.5-7.5"
          />
        </svg>
      </span>
    );
  }

  if (variant === 'crown') {
    return (
      <span
        className="feature-card__icon-neon feature-card__icon-neon--crown"
        style={style}
        aria-hidden="true"
      >
        <svg {...shared}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 8.25l3.5 4.5 4.75-6 4.75 6 3.5-4.5L18.75 19.5H5.25L3.75 8.25z"
          />
        </svg>
      </span>
    );
  }

  if (variant === 'folder') {
    return (
      <span
        className="feature-card__icon-neon feature-card__icon-neon--folder"
        style={style}
        aria-hidden="true"
      >
        <svg {...shared}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 7.5A2.25 2.25 0 014.5 5.25h4.189a2.25 2.25 0 011.59.659l.658.659a2.25 2.25 0 001.591.659H19.5a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V7.5z"
          />
        </svg>
      </span>
    );
  }

  return (
    <span
      className="feature-card__icon-neon feature-card__icon-neon--spark"
      style={style}
      aria-hidden="true"
    >
      <svg {...shared}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3l2.25 4.75L19 10l-4.75 2.25L12 17l-2.25-4.75L5 10l4.75-2.25L12 3z"
        />
      </svg>
    </span>
  );
};

// Stagger variants
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export const Features = () => {
  return (
    <section id="features" className="features zoom-section">
      <SectionHeader
        badge="Powerful Features"
        badgeVariant="orange"
        title="Everything You"
        titleAccent="Need"
        titleAccentClass="title-fx--air"
        description="Build, customize, and grow your community with our comprehensive feature set."
      />

      <motion.div
        className="features__grid"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
      >
        {features.map((feature, index) => (
          <motion.div key={feature.title} variants={staggerItem}>
            <FeatureCard
              {...feature}
              icon={
                <NeonFeatureIcon
                  variant={getFeatureIconVariant(feature.title)}
                  delay={index * 0.14}
                />
              }
            />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

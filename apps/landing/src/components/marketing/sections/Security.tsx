/**
 * Security Section
 *
 * Showcases CGraph's privacy-first approach with E2E encryption,
 * secure protocols, and security feature highlights.
 *
 * @since v2.1.0 - Redesigned as "Security Vault"
 */

import React from 'react';
import { motion } from 'framer-motion';
import { SectionHeader } from '../ui/SectionHeader';
import { securityFeatures } from '../../../data/landing-data';
import type { SecurityFeatureData } from '../../../data/landing-data';
import './Security.css';

interface SecurityCardProps {
  feature: SecurityFeatureData;
  index: number;
}

type SecurityIconVariant = 'encrypted' | 'zero-knowledge' | 'argon2' | 'sync' | '2fa' | 'web3';

const getSecurityIconVariant = (title: string): SecurityIconVariant => {
  if (title === 'End-to-End Encrypted') return 'encrypted';
  if (title === 'Zero-Knowledge') return 'zero-knowledge';
  if (title === 'Argon2 Passwords') return 'argon2';
  if (title === 'Multi-Device Sync') return 'sync';
  if (title === '2FA Protection') return '2fa';
  return 'web3';
};

const SecurityIcon = ({ title, index }: { title: string; index: number }) => {
  const variant = getSecurityIconVariant(title);
  const style = {
    '--security-icon-delay': `${index * 0.2}s`,
  } as React.CSSProperties;

  const iconClass = `security-card__icon-svg security-card__icon-svg--${variant}`;

  if (variant === 'encrypted') {
    return (
      <svg
        className={iconClass}
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

  if (variant === 'zero-knowledge') {
    return (
      <svg
        className={iconClass}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.6}
        style={style}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 12s3.75-6 9-6 9 6 9 6-3.75 6-9 6-9-6-9-6z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9.5l5 5m0-5l-5 5" />
      </svg>
    );
  }

  if (variant === 'argon2') {
    return (
      <svg
        className={iconClass}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.6}
        style={style}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L9.75 14.25" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.5 12a4.5 4.5 0 004.5-4.5V6.75h-1.5A4.5 4.5 0 0015 11.25V12h1.5zm-9 0A4.5 4.5 0 013 7.5V6.75h1.5A4.5 4.5 0 019 11.25V12H7.5zM12 16.5A4.5 4.5 0 007.5 21H6.75v-1.5A4.5 4.5 0 0111.25 15H12v1.5z"
        />
      </svg>
    );
  }

  if (variant === 'sync') {
    return (
      <svg
        className={iconClass}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.6}
        style={style}
      >
        <rect x="3.75" y="4.5" width="8.5" height="14.5" rx="1.5" />
        <rect x="13.75" y="7" width="6.5" height="11" rx="1.25" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16h.01M17 15h.01" />
      </svg>
    );
  }

  if (variant === '2fa') {
    return (
      <svg
        className={iconClass}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.6}
        style={style}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3.75c2.4 0 4.35 1.95 4.35 4.35V12.75"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 10.5h7.5a2.25 2.25 0 012.25 2.25v5.25a2.25 2.25 0 01-2.25 2.25h-7.5A2.25 2.25 0 016 18v-5.25a2.25 2.25 0 012.25-2.25z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 14.25h1.5m-1.5 2.25h1.5" />
      </svg>
    );
  }

  return (
    <svg
      className={iconClass}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.6}
      style={style}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3.75l6.25 3.5v9L12 20.25l-6.25-4v-9L12 3.75z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 13.5l2.5-5 2.5 5M10.5 11.5h3" />
    </svg>
  );
};

const SecurityCard = ({ feature, index }: SecurityCardProps) => {
  return (
    <motion.div
      className="security-card group"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
      whileHover={{ y: -10, transition: { duration: 0.4 } }}
    >
      <div className="security-card__animated-border" />
      <div className="security-card__bg" />
      <div className="security-card__glare" />

      <div className="security-card__content">
        <div className="security-card__icon-wrapper">
          <SecurityIcon title={feature.title} index={index} />
        </div>
        <motion.h3
          className="security-card__title"
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
        >
          {feature.title}
        </motion.h3>
        <motion.p
          className="security-card__desc"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
        >
          {feature.description}
        </motion.p>
        {feature.details && (
          <motion.p
            className="security-card__extra"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
          >
            {feature.details}
          </motion.p>
        )}
      </div>

      <div className="security-card__accent" />
    </motion.div>
  );
};

export function Security() {
  return (
    <section id="security" className="security-vault zoom-section">
      <div className="container relative z-10 mx-auto flex flex-col items-center px-4">
        {/* Header */}
        <motion.div
          className="mb-16 px-4 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <SectionHeader
            badge="Privacy-First"
            badgeVariant="purple"
            title="Your Privacy Is Our"
            titleAccent="Priority"
            titleAccentClass="title-fx--air"
            description="Military-grade encryption isn't just a marketing buzzword. We've built a zero-trust architecture where you hold the keys, and we only ever handle encrypted blobs."
          />
        </motion.div>

        {/* Security features grid */}
        <div className="security-vault__grid">
          {securityFeatures.slice(0, 6).map((feature, i) => (
            <SecurityCard key={i} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

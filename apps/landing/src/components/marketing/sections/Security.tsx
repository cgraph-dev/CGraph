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
import { GlassCard } from '../ui/GlassCard';
import { securityFeatures } from '../../../data/landing-data';
import type { SecurityFeatureData } from '../../../data/landing-data';
import './Security.css';

interface SecurityCardProps {
  feature: SecurityFeatureData;
  index: number;
}

type SecurityStatusTone = 'good' | 'warn' | 'neutral';

interface SecurityStatusRow {
  control: string;
  cgraph: string;
  baseline: string;
  detail: string;
  tone: SecurityStatusTone;
}

const securityStatusRows: SecurityStatusRow[] = [
  {
    control: 'E2EE Protocol',
    cgraph: 'PQXDH + Triple Ratchet',
    baseline: 'Transport TLS only',
    detail: 'Post-quantum hybrid design is active in production.',
    tone: 'good',
  },
  {
    control: 'Trusted Proxy',
    cgraph: 'Cloudflare CIDR enforced',
    baseline: 'Open origin ingress',
    detail: 'Origin only trusts Cloudflare IP ranges.',
    tone: 'good',
  },
  {
    control: 'API Hosting',
    cgraph: 'Fly.io (IAD region)',
    baseline: 'Single VM / unmanaged edge',
    detail: 'Current deployment is single-region for backend.',
    tone: 'neutral',
  },
  {
    control: 'Database Access',
    cgraph: 'PostgreSQL 16 + PgBouncer',
    baseline: 'Direct DB connections',
    detail: 'Connection pooling runs as Fly.io sidecar.',
    tone: 'good',
  },
  {
    control: 'Observability',
    cgraph: 'Prometheus + Grafana IaC',
    baseline: 'No SLO instrumentation',
    detail: 'Dashboards are infrastructure-as-code ready; full live rollout is pending.',
    tone: 'neutral',
  },
  {
    control: 'Independent Reviews',
    cgraph: 'E2EE audit pending (Q1 2026)',
    baseline: 'Not scheduled',
    detail: 'Formal protocol audit and external pen test are not yet completed.',
    tone: 'warn',
  },
];

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
          className="security-card__title font-zentry"
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
        >
          {feature.title}
        </motion.h3>
        <motion.p
          className="security-card__desc font-space"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
        >
          {feature.description}
        </motion.p>
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

        {/* Comparison Vault Panel */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-4xl"
        >
          <GlassCard className="security-comparison panel-border-glow relative overflow-hidden">
            <div className="security-comparison__header relative z-10 pb-3 pt-8">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="security-comparison__chip"
              >
                <span className="security-comparison__chip-dot" />
                <span className="security-comparison__chip-text">Security Posture Snapshot</span>
              </motion.div>

              <motion.h3
                className="mb-3 font-zentry text-4xl tracking-wide text-white md:text-5xl"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                The Security Vault
              </motion.h3>
              <motion.p
                className="security-comparison__subtitle"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                Real controls currently deployed across crypto, infrastructure, and operations.
              </motion.p>
            </div>

            <div className="security-comparison__table relative z-10 px-4 pb-10 md:px-12">
              <div className="security-comparison__legend">
                <span>Control</span>
                <span>CGraph</span>
                <span className="hidden md:inline">Typical Baseline</span>
              </div>

              {securityStatusRows.map((row, i) => (
                <motion.div
                  key={row.control}
                  className="security-comparison__row"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.68 + i * 0.08, ease: 'easeOut' }}
                >
                  <div className="security-comparison__row-grid">
                    <div>
                      <span className="security-comparison__label">{row.control}</span>
                      <p className="security-comparison__detail">{row.detail}</p>
                    </div>
                    <div
                      className={`security-comparison__value security-comparison__value--${row.tone}`}
                    >
                      {row.cgraph}
                    </div>
                    <span className="security-comparison__baseline hidden md:block">
                      {row.baseline}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="security-comparison__footer mt-4 border-t border-white/5 px-6 pt-6 md:px-12">
              <span>Source: internal security + infrastructure docs (Feb 2026)</span>
              <span>Formal E2EE audit: pending</span>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
}

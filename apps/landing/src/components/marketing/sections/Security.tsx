/**
 * Security Section
 *
 * Showcases CGraph's privacy-first approach with E2E encryption,
 * secure protocols, and security feature highlights.
 *
 * @since v2.1.0 - Redesigned as "Security Vault"
 */

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

const SecurityIcon = ({ type }: { type: string }) => {
  // Simple stylized SVG icons to replace emojis
  if (type.includes('Encryption') || type.includes('Encrypted')) {
    return (
      <svg
        className="h-12 w-12 text-emerald-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
        />
      </svg>
    );
  }
  if (type.includes('Privacy') || type.includes('Knowledge')) {
    return (
      <svg
        className="h-12 w-12 text-purple-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.744c0 1.947.466 3.784 1.294 5.41a12.04 12.04 0 009.61 7.593c.31.042.625.063.944.063a12.054 12.054 0 009.61-7.593 11.99 11.99 0 001.294-5.41c0-1.306-.208-2.564-.598-3.743A11.959 11.959 0 0112 2.714z"
        />
      </svg>
    );
  }
  return (
    <svg
      className="h-12 w-12 text-cyan-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.744c0 1.947.466 3.784 1.294 5.41a12.04 12.04 0 009.61 7.593c.31.042.625.063.944.063a12.054 12.054 0 009.61-7.593 11.99 11.99 0 001.294-5.41c0-1.306-.208-2.564-.598-3.743A11.959 11.959 0 0112 2.714z"
      />
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
          <SecurityIcon type={feature.title} />
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

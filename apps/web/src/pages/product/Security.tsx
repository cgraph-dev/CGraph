/**
 * Security Page
 *
 * Detailed overview of CGraph security features and practices.
 *
 * @since v0.9.3
 */

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MarketingLayout } from '@/components/marketing';

const securityFeatures = [
  {
    icon: '🔐',
    title: 'End-to-End Encryption',
    description:
      'All messages are encrypted using the Signal Protocol with X3DH key agreement and Double Ratchet algorithm. Not even we can read your messages.',
    details: ['AES-256-GCM encryption', 'Perfect forward secrecy', 'Post-compromise security'],
  },
  {
    icon: '🛡️',
    title: 'Zero-Knowledge Architecture',
    description:
      'We designed CGraph with zero-knowledge principles. Your data is encrypted before it reaches our servers.',
    details: [
      'Client-side encryption',
      'No plaintext storage',
      'Encrypted metadata where possible',
    ],
  },
  {
    icon: '🔑',
    title: 'Secure Authentication',
    description:
      'Industry-leading authentication with Argon2id password hashing and multiple 2FA options.',
    details: ['Argon2id (OWASP recommended)', 'TOTP-based 2FA', 'WebAuthn/FIDO2 support'],
  },
  {
    icon: '🌐',
    title: 'Web3 Authentication',
    description:
      'Sign in securely with your cryptocurrency wallet. No password needed, no email required.',
    details: ['Ethereum wallet support', 'Message signing verification', 'No central authority'],
  },
  {
    icon: '⚡',
    title: 'Secure Real-Time',
    description:
      'All WebSocket connections are encrypted with TLS 1.3 for real-time message delivery.',
    details: ['TLS 1.3 encryption', 'Certificate pinning', 'Secure WebSocket (WSS)'],
  },
  {
    icon: '📱',
    title: 'Multi-Device Security',
    description:
      'Each device has its own encryption keys. Compromise of one device does not affect others.',
    details: ['Per-device keys', 'Device verification', 'Remote session management'],
  },
];

const certifications = [
  { name: 'GDPR Compliant', icon: '🇪🇺', description: 'Full compliance with EU data protection' },
  { name: 'SOC 2 Type II', icon: '✅', description: 'Third-party security audit certified' },
  { name: 'ISO 27001', icon: '🏆', description: 'Information security management certified' },
  { name: 'Open Source', icon: '📖', description: 'Transparent, auditable codebase' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Security() {
  return (
    <MarketingLayout
      title="Security"
      subtitle="Your privacy and security are our top priorities"
      eyebrow="Trust"
      showCTA
    >
      {/* Security Features */}
      <section className="marketing-section">
        <div className="marketing-section__container">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
          >
            {securityFeatures.map((feature) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="rounded-xl border p-6 transition-all hover:border-primary-500/50 hover:shadow-lg"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <span className="text-4xl">{feature.icon}</span>
                <h3 className="mt-4 text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
                  {feature.title}
                </h3>
                <p className="mt-2" style={{ color: 'var(--color-gray)' }}>
                  {feature.description}
                </p>
                <ul className="mt-4 space-y-2">
                  {feature.details.map((detail) => (
                    <li
                      key={detail}
                      className="flex items-center gap-2 text-sm"
                      style={{ color: 'var(--color-gray)' }}
                    >
                      <span className="text-primary-500">✓</span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Certifications */}
      <section className="marketing-section marketing-section--alt">
        <div className="marketing-section__container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="marketing-section__title font-zentry">Certifications & Compliance</h2>
            <p className="mt-4 text-lg" style={{ color: 'var(--color-gray)' }}>
              We maintain the highest standards of security and privacy
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {certifications.map((cert) => (
              <motion.div
                key={cert.name}
                variants={itemVariants}
                className="rounded-xl border p-6 text-center transition-all hover:border-primary-500/50"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <span className="text-4xl">{cert.icon}</span>
                <h3 className="mt-3 font-semibold" style={{ color: 'var(--color-text)' }}>
                  {cert.name}
                </h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-gray)' }}>
                  {cert.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Security Practices */}
      <section className="marketing-section">
        <div className="marketing-section__container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl text-center"
          >
            <h2 className="marketing-section__title font-zentry">Our Security Practices</h2>
            <div className="mt-8 space-y-6 text-left">
              <div
                className="rounded-lg border p-6"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                  🔍 Regular Security Audits
                </h3>
                <p className="mt-2" style={{ color: 'var(--color-gray)' }}>
                  Our code is regularly audited by independent security researchers. We also run a
                  bug bounty program to encourage responsible disclosure.
                </p>
              </div>
              <div
                className="rounded-lg border p-6"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                  🔄 Incident Response
                </h3>
                <p className="mt-2" style={{ color: 'var(--color-gray)' }}>
                  We have a dedicated incident response team and clear procedures for handling
                  security incidents. Any breaches are communicated transparently.
                </p>
              </div>
              <div
                className="rounded-lg border p-6"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                  📊 Transparency Reports
                </h3>
                <p className="mt-2" style={{ color: 'var(--color-gray)' }}>
                  We publish regular transparency reports detailing any government requests for data
                  and how we responded.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="marketing-section marketing-section--alt">
        <div className="marketing-section__container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="marketing-section__title font-zentry">Questions about security?</h2>
            <p className="mt-4 text-lg" style={{ color: 'var(--color-gray)' }}>
              Our team is happy to discuss our security practices in detail.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/contact"
                className="rounded-lg bg-primary-500 px-8 py-3 font-semibold text-white transition-all hover:bg-primary-600 hover:shadow-lg"
              >
                Contact Security Team
              </Link>
              <a
                href="https://github.com/cgraph-dev/CGraph"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border px-8 py-3 font-semibold transition-all hover:bg-white/5"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                View Source Code
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
}

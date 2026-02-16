/**
 * Privacy Policy Page
 *
 * Renders the Privacy Policy legal document with consistent
 * marketing page styling.
 *
 * @since v0.9.2
 */

import DOMPurify from 'dompurify';
import { motion } from 'framer-motion';
import { MarketingLayout } from '@/components/marketing';

// Privacy Policy content sections
const sections = [
  {
    id: 'info-collect',
    title: '1. Information We Collect',
    content: `
      <h4>1.1 Information You Provide</h4>
      <table>
        <thead><tr><th>Data Type</th><th>Purpose</th><th>Retention</th></tr></thead>
        <tbody>
          <tr><td><strong>Account Information</strong></td><td>Email, username, profile picture</td><td>Until account deletion</td></tr>
          <tr><td><strong>Messages</strong></td><td>Direct messages, group chat content</td><td>Until deleted by user</td></tr>
          <tr><td><strong>Profile Data</strong></td><td>Bio, display name, avatar</td><td>Until account deletion</td></tr>
          <tr><td><strong>Wallet Address</strong></td><td>Web3 authentication (optional)</td><td>Until account deletion</td></tr>
          <tr><td><strong>Forum Content</strong></td><td>Posts, comments, votes, community membership</td><td>Until deleted by user</td></tr>
          <tr><td><strong>Gamification Data</strong></td><td>XP, achievements, quest progress, leaderboard rankings</td><td>Until account deletion</td></tr>
        </tbody>
      </table>
      
      <h4>1.2 Automatically Collected Information</h4>
      <table>
        <thead><tr><th>Data Type</th><th>Purpose</th><th>Retention</th></tr></thead>
        <tbody>
          <tr><td><strong>Device Information</strong></td><td>App functionality, debugging</td><td>90 days</td></tr>
          <tr><td><strong>Usage Data</strong></td><td>Analytics, service improvement</td><td>90 days (anonymized)</td></tr>
          <tr><td><strong>IP Address</strong></td><td>Security, rate limiting</td><td>30 days</td></tr>
          <tr><td><strong>Push Tokens</strong></td><td>Notification delivery</td><td>Until logout</td></tr>
        </tbody>
      </table>
      
      <h4>1.3 Information We Do NOT Collect</h4>
      <ul>
        <li>❌ Location data (GPS)</li>
        <li>❌ Contact lists (without explicit consent)</li>
        <li>❌ Biometric data (processed locally only)</li>
        <li>❌ Advertising identifiers</li>
        <li>❌ Health or fitness data</li>
      </ul>
    `,
  },
  {
    id: 'encryption',
    title: '2. End-to-End Encryption',
    content: `
      <h4>2.1 Private Messages</h4>
      <p>All direct messages between users are <strong>end-to-end encrypted</strong> using the X3DH key agreement protocol with AES-256-GCM encryption. This means:</p>
      <ul>
        <li>Only you and your conversation partner can read messages</li>
        <li>We cannot decrypt or access message content</li>
        <li>Messages are encrypted on your device before transmission</li>
        <li>Encryption keys never leave your device</li>
      </ul>
      
      <h4>2.2 What We CAN See (Metadata)</h4>
      <ul>
        <li>Sender and recipient identifiers</li>
        <li>Timestamps of messages</li>
        <li>Message delivery status</li>
        <li>File sizes (but not content)</li>
      </ul>
      
      <h4>2.3 What We CANNOT See</h4>
      <ul>
        <li>Message content (text, images, files)</li>
        <li>Encryption keys</li>
        <li>Voice message audio content</li>
      </ul>
    `,
  },
  {
    id: 'usage',
    title: '3. How We Use Your Information',
    content: `
      <p>We use collected information to:</p>
      <ol>
        <li><strong>Provide the Service</strong> - Deliver messages, manage accounts</li>
        <li><strong>Ensure Security</strong> - Detect abuse, prevent fraud, enforce ToS</li>
        <li><strong>Improve the Service</strong> - Analytics, bug fixes, new features</li>
        <li><strong>Send Notifications</strong> - Push notifications you've opted into</li>
        <li><strong>Comply with Law</strong> - Legal obligations, valid court orders</li>
      </ol>
      
      <p><strong>We do NOT:</strong></p>
      <ul>
        <li>Sell your personal data to third parties</li>
        <li>Use your data for targeted advertising</li>
        <li>Share data with advertisers</li>
        <li>Profile you for marketing purposes</li>
      </ul>
    `,
  },
  {
    id: 'sharing',
    title: '4. Data Sharing',
    content: `
      <p>We may share your information only in these limited circumstances:</p>
      
      <h4>4.1 With Your Consent</h4>
      <ul>
        <li>Profile information you make public</li>
        <li>Content you explicitly share</li>
      </ul>
      
      <h4>4.2 Service Providers</h4>
      <table>
        <thead><tr><th>Provider</th><th>Purpose</th><th>Data Shared</th></tr></thead>
        <tbody>
          <tr><td>Cloudflare</td><td>CDN, Security</td><td>Request metadata</td></tr>
          <tr><td>Resend</td><td>Email delivery</td><td>Email addresses</td></tr>
          <tr><td>Expo</td><td>Push notifications</td><td>Push tokens</td></tr>
          <tr><td>Sentry</td><td>Error tracking</td><td>Crash logs (anonymized)</td></tr>
          <tr><td>Stripe</td><td>Payment processing</td><td>Payment details (processed by Stripe, not stored by CGraph)</td></tr>
        </tbody>
      </table>
      <p>All service providers are bound by data processing agreements and are prohibited from using your data for any purpose other than providing services to CGraph.</p>
      
      <h4>4.3 Legal Requirements</h4>
      <p>We may disclose data when required by law, such as valid court orders, government requests (with legal basis), or to protect rights, safety, or property.</p>
      <p><strong>Note:</strong> Due to end-to-end encryption, we cannot provide message content even if legally compelled.</p>
      
      <h4>4.4 Business Transfers</h4>
      <p>In the event of a merger, acquisition, reorganization, bankruptcy, or sale of all or a portion of CGraph's assets, your personal data may be transferred as part of that transaction. We will notify you (via email or prominent notice on the Service) before your data is transferred and becomes subject to a different privacy policy.</p>
      
      <h4>4.5 Aggregated & De-Identified Data</h4>
      <p>We may create aggregated, anonymized, or de-identified data from your personal data. Such data is not considered personal data and may be used for any purpose, including analytics, research, and improving the Service. We will not attempt to re-identify anonymized data.</p>
    `,
  },
  {
    id: 'retention',
    title: '5. Data Retention',
    content: `
      <table>
        <thead><tr><th>Data Type</th><th>Retention Period</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td>Account data</td><td>Until account deletion</td><td>Can be deleted anytime</td></tr>
          <tr><td>Messages</td><td>Until deleted</td><td>User-controlled</td></tr>
          <tr><td>Access logs</td><td>30 days</td><td>Security purposes</td></tr>
          <tr><td>Analytics</td><td>90 days</td><td>Anonymized after 30 days</td></tr>
          <tr><td>Backups</td><td>30 days</td><td>Rolling window</td></tr>
        </tbody>
      </table>
    `,
  },
  {
    id: 'rights',
    title: '6. Your Rights',
    content: `
      <p>Depending on your location, you have various data protection rights:</p>
      
      <h4>6.1 Rights for All Users</h4>
      <ul>
        <li><strong>Access</strong> - Request a copy of your data</li>
        <li><strong>Rectification</strong> - Correct inaccurate data</li>
        <li><strong>Erasure</strong> - Delete your account and data</li>
        <li><strong>Portability</strong> - Export your data in a standard format</li>
        <li><strong>Restriction</strong> - Limit how we process your data</li>
        <li><strong>Object</strong> - Object to certain processing activities</li>
      </ul>
      
      <h4>6.2 EU/EEA/UK Residents (GDPR)</h4>
      <ul>
        <li>All rights under Articles 15-22 of the GDPR</li>
        <li>Right to lodge a complaint with your supervisory authority</li>
        <li>Right to withdraw consent at any time</li>
        <li>See our <a href="/gdpr">GDPR Compliance</a> page for full details</li>
      </ul>
      
      <h4>6.3 California Residents (CCPA/CPRA)</h4>
      <ul>
        <li>Right to know what personal information is collected, used, and disclosed</li>
        <li>Right to delete personal information</li>
        <li>Right to opt-out of sale/sharing — <strong>we do NOT sell your data</strong></li>
        <li>Right to non-discrimination for exercising your rights</li>
        <li>Right to correct inaccurate personal information</li>
        <li>Right to limit use of sensitive personal information</li>
      </ul>
      
      <h4>6.4 Canadian Residents (PIPEDA)</h4>
      <ul>
        <li>Right to access your personal information</li>
        <li>Right to challenge the accuracy and completeness of your data</li>
        <li>Right to withdraw consent (subject to legal/contractual restrictions)</li>
        <li>Right to complain to the Office of the Privacy Commissioner of Canada</li>
      </ul>
      
      <h4>6.5 Brazilian Residents (LGPD)</h4>
      <ul>
        <li>Confirmation of data processing and access to data</li>
        <li>Correction of incomplete, inaccurate, or outdated data</li>
        <li>Anonymization, blocking, or deletion of unnecessary data</li>
        <li>Data portability to another service provider</li>
        <li>Information about public and private entities with which data is shared</li>
      </ul>
      
      <p>Exercise these rights in <strong>Settings → Privacy</strong> or by contacting <a href="mailto:privacy@cgraph.org">privacy@cgraph.org</a></p>
    `,
  },
  {
    id: 'security',
    title: '7. Security Measures',
    content: `
      <p>We implement industry-standard security measures:</p>
      <ul>
        <li><strong>Encryption in Transit</strong> — TLS 1.3 for all connections</li>
        <li><strong>Encryption at Rest</strong> — AES-256 for stored data</li>
        <li><strong>End-to-End Encryption</strong> — Triple Ratchet protocol (PQXDH + ML-KEM-768) for direct messages</li>
        <li><strong>Regular Audits</strong> — Third-party security assessments</li>
        <li><strong>Bug Bounty</strong> — Responsible disclosure program at <a href="mailto:security@cgraph.org">security@cgraph.org</a></li>
        <li><strong>Access Controls</strong> — Least-privilege access for all employees and systems</li>
        <li><strong>Incident Response</strong> — Documented breach response procedures with 72-hour notification</li>
      </ul>
      <p>Despite our best efforts, no electronic transmission or storage method is 100% secure. We cannot guarantee absolute security of your data.</p>
    `,
  },
  {
    id: 'children',
    title: "8. Children's Privacy",
    content: `
      <p>CGraph is not directed toward children under 13 years of age (or the applicable minimum age in your jurisdiction). We do not knowingly collect personal information from children under 13.</p>
      
      <h4>8.1 COPPA Compliance (United States)</h4>
      <p>In compliance with the Children's Online Privacy Protection Act (COPPA):</p>
      <ul>
        <li>We do not knowingly collect, use, or disclose personal information from children under 13</li>
        <li>If we discover that a child under 13 has created an account, we will promptly delete the account and all associated data</li>
        <li>Parents or guardians who believe their child has provided personal information may contact us at <a href="mailto:privacy@cgraph.org">privacy@cgraph.org</a></li>
      </ul>
      
      <h4>8.2 EU/UK (Age of Digital Consent)</h4>
      <p>In the EU and UK, the minimum age for digital consent varies by country (typically 13-16). Users below the applicable age in their jurisdiction must have verifiable parental consent.</p>
      
      <h4>8.3 Safety Measures</h4>
      <p>For users between 13-18 (where permitted), we implement additional safety measures, including default privacy settings and content filtering options available to parents/guardians.</p>
    `,
  },
  {
    id: 'international',
    title: '9. International Data Transfers',
    content: `
      <p>CGraph is operated from Georgia and uses infrastructure located in multiple countries. Your data may be transferred to and processed in countries other than your own. We protect international data transfers through:</p>
      <ul>
        <li><strong>Standard Contractual Clauses (SCCs)</strong> — EU-approved contractual safeguards with all service providers</li>
        <li><strong>Adequacy Decisions</strong> — Where available, we transfer data to countries recognized by the EU as having adequate data protection</li>
        <li><strong>End-to-End Encryption</strong> — Message content is protected regardless of where infrastructure is located</li>
        <li><strong>Data Processing Agreements</strong> — All sub-processors are contractually bound to protect your data</li>
      </ul>
      <p>For an up-to-date list of sub-processors and their locations, see our <a href="/gdpr">GDPR Compliance</a> page.</p>
    `,
  },
  {
    id: 'contact',
    title: '10. Contact Us',
    content: `
      <p>If you have questions about this Privacy Policy, please contact us:</p>
      <ul>
        <li><strong>Company:</strong> CGraph, registered in Georgia</li>
        <li><strong>Founded:</strong> 2026</li>
        <li><strong>Email:</strong> <a href="mailto:privacy@cgraph.org">privacy@cgraph.org</a></li>
        <li><strong>Data Protection Officer:</strong> <a href="mailto:dpo@cgraph.org">dpo@cgraph.org</a></li>
        <li><strong>Website:</strong> <a href="https://cgraph.org">cgraph.org</a></li>
      </ul>
      <p>For GDPR-specific inquiries, see our <a href="/gdpr">GDPR Compliance</a> page.</p>
      <p>For California residents, see Section 6 for your CCPA/CPRA rights. For Canadian residents, your PIPEDA rights are detailed in our GDPR page. For Brazilian residents, your LGPD rights are covered under our GDPR compliance framework.</p>
    `,
  },
];

export default function PrivacyPolicy() {
  return (
    <MarketingLayout
      title="Privacy Policy"
      subtitle="Last updated: February 10, 2026 • Version 2.0"
      eyebrow="Your Data, Your Rights"
    >
      <section className="marketing-section marketing-section--alt">
        <div className="mx-auto max-w-4xl px-4">
          {/* Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="marketing-card"
            style={{ marginBottom: '3rem' }}
          >
            <p style={{ color: 'var(--color-gray)', fontSize: '1.125rem', lineHeight: 1.7 }}>
              CGraph ("we", "us", "our"), a company registered in Georgia, is committed to
              protecting your privacy. This Privacy Policy explains how we collect, use, disclose,
              and safeguard your information when you use our mobile application and web platform
              (collectively, the "Service"). This policy applies to users worldwide and complies
              with the EU General Data Protection Regulation (GDPR), California Consumer Privacy Act
              (CCPA/CPRA), Canada's Personal Information Protection and Electronic Documents Act
              (PIPEDA), Brazil's Lei Geral de Proteção de Dados (LGPD), and other applicable data
              protection laws.
            </p>
          </motion.div>

          {/* Table of Contents */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-12"
          >
            <h2 className="mb-4 text-xl font-semibold" style={{ color: 'var(--color-light)' }}>
              Table of Contents
            </h2>
            <nav className="grid gap-2 sm:grid-cols-2">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  style={{ color: 'var(--color-gray)', transition: 'color 0.2s' }}
                  className="hover:text-emerald-400"
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </motion.div>

          {/* Sections */}
          {sections.map((section) => (
            <motion.section
              key={section.id}
              id={section.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-12 scroll-mt-24"
            >
              <h2
                className="mb-6 font-zentry text-2xl font-bold"
                style={{ color: 'var(--color-light)' }}
              >
                {section.title}
              </h2>
              <div
                className="legal-content"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(section.content, { USE_PROFILES: { html: true } }),
                }}
              />
            </motion.section>
          ))}

          {/* Related Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="marketing-card"
          >
            <h3 className="mb-4 text-xl font-semibold" style={{ color: 'var(--color-light)' }}>
              Related Documents
            </h3>
            <div className="marketing-grid marketing-grid--3">
              <a href="/terms" className="marketing-card" style={{ padding: '1rem' }}>
                <h4 className="font-medium" style={{ color: 'var(--color-light)' }}>
                  Terms of Service
                </h4>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-gray)' }}>
                  Rules for using CGraph
                </p>
              </a>
              <a href="/cookies" className="marketing-card" style={{ padding: '1rem' }}>
                <h4 className="font-medium" style={{ color: 'var(--color-light)' }}>
                  Cookie Policy
                </h4>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-gray)' }}>
                  How we use cookies
                </p>
              </a>
              <a href="/gdpr" className="marketing-card" style={{ padding: '1rem' }}>
                <h4 className="font-medium" style={{ color: 'var(--color-light)' }}>
                  GDPR Compliance
                </h4>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-gray)' }}>
                  Your data rights
                </p>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
}

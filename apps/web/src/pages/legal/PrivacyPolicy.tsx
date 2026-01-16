/**
 * Privacy Policy Page
 * 
 * Renders the Privacy Policy legal document with consistent
 * marketing page styling.
 * 
 * @since v0.9.2
 */

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
        </tbody>
      </table>
      
      <h4>4.3 Legal Requirements</h4>
      <p>We may disclose data when required by law, such as valid court orders, government requests (with legal basis), or to protect rights, safety, or property.</p>
      <p><strong>Note:</strong> Due to end-to-end encryption, we cannot provide message content even if legally compelled.</p>
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
      <p>You have the right to:</p>
      <ul>
        <li><strong>Access</strong> - Request a copy of your data</li>
        <li><strong>Rectification</strong> - Correct inaccurate data</li>
        <li><strong>Erasure</strong> - Delete your account and data</li>
        <li><strong>Portability</strong> - Export your data in a standard format</li>
        <li><strong>Restriction</strong> - Limit how we process your data</li>
        <li><strong>Object</strong> - Object to certain processing activities</li>
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
        <li><strong>Encryption in Transit</strong> - TLS 1.3 for all connections</li>
        <li><strong>Encryption at Rest</strong> - AES-256 for stored data</li>
        <li><strong>End-to-End Encryption</strong> - Signal Protocol for messages</li>
        <li><strong>Regular Audits</strong> - Third-party security assessments</li>
        <li><strong>Bug Bounty</strong> - Responsible disclosure program</li>
      </ul>
    `,
  },
  {
    id: 'contact',
    title: '8. Contact Us',
    content: `
      <p>If you have questions about this Privacy Policy, please contact us:</p>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:privacy@cgraph.org">privacy@cgraph.org</a></li>
        <li><strong>Data Protection Officer:</strong> <a href="mailto:dpo@cgraph.org">dpo@cgraph.org</a></li>
      </ul>
      <p>For GDPR-specific inquiries, see our <a href="/gdpr">GDPR Compliance</a> page.</p>
    `,
  },
];

export default function PrivacyPolicy() {
  return (
    <MarketingLayout
      title="Privacy Policy"
      subtitle="Last updated: January 8, 2026 • Version 1.0"
    >
      <section className="bg-gray-950 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 rounded-2xl border border-gray-800 bg-gray-900/50 p-8"
          >
            <p className="text-lg text-gray-300">
              CGraph ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy 
              explains how we collect, use, disclose, and safeguard your information when you use our 
              mobile application and web platform (collectively, the "Service").
            </p>
          </motion.div>

          {/* Table of Contents */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-12"
          >
            <h2 className="mb-4 text-xl font-semibold text-white">Table of Contents</h2>
            <nav className="grid gap-2 sm:grid-cols-2">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="text-gray-400 transition-colors hover:text-purple-400"
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
              <h2 className="mb-6 text-2xl font-bold text-white">{section.title}</h2>
              <div 
                className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-300 prose-li:text-gray-300 prose-a:text-purple-400 prose-a:no-underline hover:prose-a:text-purple-300 prose-strong:text-white prose-table:border-gray-700 prose-th:bg-gray-800 prose-th:text-white prose-td:text-gray-300 prose-th:border-gray-700 prose-td:border-gray-700"
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            </motion.section>
          ))}

          {/* Related Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8"
          >
            <h3 className="mb-4 text-xl font-semibold text-white">Related Documents</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <a
                href="/terms"
                className="rounded-lg border border-gray-700 bg-gray-800 p-4 transition-colors hover:border-purple-500/50"
              >
                <h4 className="font-medium text-white">Terms of Service</h4>
                <p className="mt-1 text-sm text-gray-400">Rules for using CGraph</p>
              </a>
              <a
                href="/cookies"
                className="rounded-lg border border-gray-700 bg-gray-800 p-4 transition-colors hover:border-purple-500/50"
              >
                <h4 className="font-medium text-white">Cookie Policy</h4>
                <p className="mt-1 text-sm text-gray-400">How we use cookies</p>
              </a>
              <a
                href="/gdpr"
                className="rounded-lg border border-gray-700 bg-gray-800 p-4 transition-colors hover:border-purple-500/50"
              >
                <h4 className="font-medium text-white">GDPR Compliance</h4>
                <p className="mt-1 text-sm text-gray-400">Your data rights</p>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
}

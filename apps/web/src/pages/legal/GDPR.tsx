/**
 * GDPR Compliance Page
 * 
 * Renders the GDPR compliance information with consistent
 * marketing page styling.
 * 
 * @since v0.9.2
 */

import { motion } from 'framer-motion';
import { MarketingLayout } from '@/components/marketing';

const sections = [
  {
    id: 'controller',
    title: '1. Data Controller',
    content: `
      <p>CGraph acts as the <strong>data controller</strong> for personal data processed through our Service. This means we determine how and why your personal data is processed.</p>
      
      <p><strong>Contact Information:</strong></p>
      <ul>
        <li><strong>Company:</strong> CGraph, Inc.</li>
        <li><strong>Email:</strong> <a href="mailto:privacy@cgraph.org">privacy@cgraph.org</a></li>
        <li><strong>Data Protection Officer:</strong> <a href="mailto:dpo@cgraph.org">dpo@cgraph.org</a></li>
      </ul>
    `,
  },
  {
    id: 'legal-bases',
    title: '2. Legal Bases for Processing',
    content: `
      <p>We process your personal data under the following legal bases:</p>
      
      <table>
        <thead><tr><th>Processing Activity</th><th>Legal Basis</th><th>Details</th></tr></thead>
        <tbody>
          <tr><td><strong>Account Creation</strong></td><td>Contract</td><td>Necessary to provide the Service</td></tr>
          <tr><td><strong>Message Delivery</strong></td><td>Contract</td><td>Core service functionality</td></tr>
          <tr><td><strong>Security Measures</strong></td><td>Legitimate Interest</td><td>Protecting users and the platform</td></tr>
          <tr><td><strong>Analytics</strong></td><td>Consent</td><td>Understanding service usage</td></tr>
          <tr><td><strong>Marketing Emails</strong></td><td>Consent</td><td>Only with explicit opt-in</td></tr>
          <tr><td><strong>Legal Compliance</strong></td><td>Legal Obligation</td><td>Responding to lawful requests</td></tr>
        </tbody>
      </table>
    `,
  },
  {
    id: 'your-rights',
    title: '3. Your Rights Under GDPR',
    content: `
      <p>As a data subject, you have the following rights:</p>
      
      <h4>3.1 Right to Access (Article 15)</h4>
      <p>You can request a copy of all personal data we hold about you.</p>
      <ul>
        <li><strong>How to exercise:</strong> Settings → Privacy → Download My Data</li>
        <li><strong>Response time:</strong> Within 30 days</li>
      </ul>
      
      <h4>3.2 Right to Rectification (Article 16)</h4>
      <p>You can correct inaccurate personal data.</p>
      <ul>
        <li><strong>How to exercise:</strong> Edit your profile directly in Settings, or contact support</li>
      </ul>
      
      <h4>3.3 Right to Erasure (Article 17)</h4>
      <p>You can request deletion of your personal data ("right to be forgotten").</p>
      <ul>
        <li><strong>How to exercise:</strong> Settings → Account → Delete Account</li>
      </ul>
      <p><strong>What gets deleted:</strong></p>
      <ul>
        <li>Account information</li>
        <li>Profile data</li>
        <li>Message history</li>
        <li>Forum posts (optional)</li>
        <li>All associated metadata</li>
      </ul>
      
      <h4>3.4 Right to Restriction (Article 18)</h4>
      <p>You can request we limit how we use your data.</p>
      <ul>
        <li><strong>How to exercise:</strong> Contact <a href="mailto:privacy@cgraph.org">privacy@cgraph.org</a></li>
      </ul>
      
      <h4>3.5 Right to Data Portability (Article 20)</h4>
      <p>You can receive your data in a structured, machine-readable format.</p>
      <ul>
        <li><strong>How to exercise:</strong> Settings → Privacy → Export My Data</li>
        <li><strong>Formats available:</strong> JSON (structured data), ZIP (messages, files)</li>
      </ul>
      
      <h4>3.6 Right to Object (Article 21)</h4>
      <p>You can object to processing based on legitimate interests.</p>
      <ul>
        <li><strong>How to exercise:</strong> Contact <a href="mailto:privacy@cgraph.org">privacy@cgraph.org</a></li>
      </ul>
      
      <h4>3.7 Rights Related to Automated Decision-Making (Article 22)</h4>
      <p>We do NOT use automated decision-making or profiling that significantly affects you.</p>
    `,
  },
  {
    id: 'transfers',
    title: '4. Data Transfers',
    content: `
      <p>Your data may be transferred outside the EEA. We ensure protection through:</p>
      
      <table>
        <thead><tr><th>Mechanism</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><strong>Standard Contractual Clauses</strong></td><td>EU-approved contract terms with processors</td></tr>
          <tr><td><strong>Adequacy Decisions</strong></td><td>Transfers to countries with adequate protection</td></tr>
          <tr><td><strong>Encryption</strong></td><td>End-to-end encryption protects message content</td></tr>
        </tbody>
      </table>
      
      <h4>Sub-processors</h4>
      <table>
        <thead><tr><th>Processor</th><th>Location</th><th>Purpose</th><th>Safeguards</th></tr></thead>
        <tbody>
          <tr><td>Cloudflare</td><td>USA</td><td>CDN, Security</td><td>SCCs, DPA</td></tr>
          <tr><td>Fly.io</td><td>USA/EU</td><td>Hosting</td><td>SCCs, DPA</td></tr>
          <tr><td>Resend</td><td>USA</td><td>Email delivery</td><td>SCCs, DPA</td></tr>
          <tr><td>Sentry</td><td>USA</td><td>Error tracking</td><td>SCCs, DPA, anonymization</td></tr>
        </tbody>
      </table>
    `,
  },
  {
    id: 'retention',
    title: '5. Data Retention',
    content: `
      <table>
        <thead><tr><th>Data Type</th><th>Retention Period</th><th>Justification</th></tr></thead>
        <tbody>
          <tr><td>Account data</td><td>Until deletion</td><td>Contract</td></tr>
          <tr><td>Messages</td><td>Until deleted by user</td><td>Contract</td></tr>
          <tr><td>Access logs</td><td>30 days</td><td>Security</td></tr>
          <tr><td>Analytics</td><td>90 days (anonymized)</td><td>Legitimate interest</td></tr>
          <tr><td>Legal records</td><td>As required by law</td><td>Legal obligation</td></tr>
        </tbody>
      </table>
    `,
  },
  {
    id: 'security',
    title: '6. Security Measures',
    content: `
      <p>We implement appropriate technical and organizational measures:</p>
      
      <h4>6.1 Technical Measures</h4>
      <ul>
        <li>End-to-end encryption (X3DH + AES-256-GCM)</li>
        <li>TLS 1.3 for all connections</li>
        <li>At-rest encryption for databases</li>
        <li>Regular security audits and penetration testing</li>
      </ul>
      
      <h4>6.2 Organizational Measures</h4>
      <ul>
        <li>Employee training on data protection</li>
        <li>Access controls and least-privilege principles</li>
        <li>Data Protection Impact Assessments (DPIA) for new features</li>
        <li>Incident response procedures</li>
      </ul>
    `,
  },
  {
    id: 'breach',
    title: '7. Data Breach Notification',
    content: `
      <p>In the event of a data breach affecting your personal data:</p>
      <ol>
        <li><strong>Supervisory Authority:</strong> We will notify the relevant authority within 72 hours</li>
        <li><strong>Affected Users:</strong> We will notify you without undue delay if there's high risk to your rights</li>
        <li><strong>Documentation:</strong> We maintain records of all breaches</li>
      </ol>
    `,
  },
  {
    id: 'exercise',
    title: '8. Exercising Your Rights',
    content: `
      <h4>8.1 Self-Service</h4>
      <p>Many rights can be exercised directly in the app:</p>
      <ul>
        <li>Settings → Privacy → Download My Data</li>
        <li>Settings → Privacy → Export My Data</li>
        <li>Settings → Account → Delete Account</li>
      </ul>
      
      <h4>8.2 Contact Us</h4>
      <p>For other requests:</p>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:privacy@cgraph.org">privacy@cgraph.org</a></li>
        <li><strong>Subject line:</strong> "GDPR Request - [Your Right]"</li>
      </ul>
      
      <h4>8.3 What We Need</h4>
      <p>To verify your identity, we may ask for:</p>
      <ul>
        <li>Confirmation from your registered email</li>
        <li>Two-factor authentication (if enabled)</li>
        <li>Additional verification for sensitive requests</li>
      </ul>
      
      <h4>8.4 Response Time</h4>
      <p>We will respond to all requests within <strong>30 days</strong>. Complex requests may take up to 60 days with notice.</p>
    `,
  },
  {
    id: 'authority',
    title: '9. Supervisory Authority',
    content: `
      <p>You have the right to lodge a complaint with your local data protection authority:</p>
      
      <table>
        <thead><tr><th>Country</th><th>Authority</th><th>Website</th></tr></thead>
        <tbody>
          <tr><td>Ireland</td><td>Data Protection Commission</td><td><a href="https://dataprotection.ie" target="_blank" rel="noopener noreferrer">dataprotection.ie</a></td></tr>
          <tr><td>UK</td><td>Information Commissioner's Office</td><td><a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a></td></tr>
          <tr><td>Germany</td><td>BfDI</td><td><a href="https://bfdi.bund.de" target="_blank" rel="noopener noreferrer">bfdi.bund.de</a></td></tr>
          <tr><td>France</td><td>CNIL</td><td><a href="https://cnil.fr" target="_blank" rel="noopener noreferrer">cnil.fr</a></td></tr>
          <tr><td>Netherlands</td><td>Autoriteit Persoonsgegevens</td><td><a href="https://autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer">autoriteitpersoonsgegevens.nl</a></td></tr>
        </tbody>
      </table>
    `,
  },
  {
    id: 'regional',
    title: '10. Additional Rights by Region',
    content: `
      <h4>10.1 California (CCPA/CPRA)</h4>
      <p>California residents have additional rights under the CCPA:</p>
      <ul>
        <li>Right to know what personal information is collected</li>
        <li>Right to delete personal information</li>
        <li>Right to opt-out of sale (we do not sell data)</li>
        <li>Right to non-discrimination</li>
      </ul>
      
      <h4>10.2 Brazil (LGPD)</h4>
      <p>Brazilian users have similar rights under the LGPD:</p>
      <ul>
        <li>Confirmation of data processing</li>
        <li>Access to personal data</li>
        <li>Correction and deletion</li>
        <li>Portability</li>
      </ul>
    `,
  },
];

export default function GDPR() {
  return (
    <MarketingLayout
      title="GDPR Compliance"
      subtitle="Last updated: January 16, 2026 • Version 1.0"
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
              This document outlines CGraph's compliance with the General Data Protection Regulation (GDPR) 
              and explains the rights available to users in the European Economic Area (EEA), United Kingdom, 
              and other jurisdictions with similar data protection laws.
            </p>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-12 grid gap-4 sm:grid-cols-3"
          >
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
              <div className="mb-2 text-3xl">📥</div>
              <h3 className="font-semibold text-white">Download Data</h3>
              <p className="mt-1 text-sm text-gray-400">Settings → Privacy → Download</p>
            </div>
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-6 text-center">
              <div className="mb-2 text-3xl">📤</div>
              <h3 className="font-semibold text-white">Export Data</h3>
              <p className="mt-1 text-sm text-gray-400">Settings → Privacy → Export</p>
            </div>
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
              <div className="mb-2 text-3xl">🗑️</div>
              <h3 className="font-semibold text-white">Delete Account</h3>
              <p className="mt-1 text-sm text-gray-400">Settings → Account → Delete</p>
            </div>
          </motion.div>

          {/* Table of Contents */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
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
              transition={{ duration: 0.5 }}
              className="mb-12 scroll-mt-24"
            >
              <h2 className="mb-6 text-2xl font-bold text-white">{section.title}</h2>
              <div 
                className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-300 prose-li:text-gray-300 prose-a:text-purple-400 prose-a:no-underline hover:prose-a:text-purple-300 prose-strong:text-white prose-table:border-gray-700 prose-th:bg-gray-800 prose-th:text-white prose-td:text-gray-300 prose-th:border-gray-700 prose-td:border-gray-700"
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            </motion.section>
          ))}

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8"
          >
            <h3 className="mb-4 text-xl font-semibold text-white">Contact</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-gray-400">General Privacy Inquiries</p>
                <a href="mailto:privacy@cgraph.org" className="text-purple-400 hover:text-purple-300">
                  privacy@cgraph.org
                </a>
              </div>
              <div>
                <p className="text-gray-400">Data Protection Officer</p>
                <a href="mailto:dpo@cgraph.org" className="text-purple-400 hover:text-purple-300">
                  dpo@cgraph.org
                </a>
              </div>
            </div>
            
            <h4 className="mb-4 mt-8 font-semibold text-white">Related Documents</h4>
            <div className="grid gap-4 sm:grid-cols-3">
              <a
                href="/privacy"
                className="rounded-lg border border-gray-700 bg-gray-800 p-4 transition-colors hover:border-purple-500/50"
              >
                <h5 className="font-medium text-white">Privacy Policy</h5>
                <p className="mt-1 text-sm text-gray-400">How we handle your data</p>
              </a>
              <a
                href="/terms"
                className="rounded-lg border border-gray-700 bg-gray-800 p-4 transition-colors hover:border-purple-500/50"
              >
                <h5 className="font-medium text-white">Terms of Service</h5>
                <p className="mt-1 text-sm text-gray-400">Rules for using CGraph</p>
              </a>
              <a
                href="/cookies"
                className="rounded-lg border border-gray-700 bg-gray-800 p-4 transition-colors hover:border-purple-500/50"
              >
                <h5 className="font-medium text-white">Cookie Policy</h5>
                <p className="mt-1 text-sm text-gray-400">How we use cookies</p>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
}

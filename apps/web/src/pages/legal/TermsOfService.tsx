/**
 * Terms of Service Page
 *
 * Renders the Terms of Service legal document with consistent
 * marketing page styling.
 *
 * @since v0.9.2
 */

import { motion } from 'framer-motion';
import { MarketingLayout } from '@/components/marketing';

const sections = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content: `
      <p>By creating an account or using CGraph, you agree to:</p>
      <ul>
        <li>These Terms of Service</li>
        <li>Our <a href="/privacy">Privacy Policy</a></li>
        <li>Our Community Guidelines</li>
      </ul>
      <p>If you do not agree, do not use the Service.</p>
    `,
  },
  {
    id: 'eligibility',
    title: '2. Eligibility',
    content: `
      <p>To use CGraph, you must:</p>
      <ul>
        <li>Be at least 13 years old (or the minimum age in your jurisdiction)</li>
        <li>Be at least 16 years old in the European Union</li>
        <li>Have the legal capacity to enter into a binding agreement</li>
        <li>Not be prohibited from using the Service under applicable law</li>
      </ul>
      <p><strong>Parental Consent:</strong> If you are between 13-18 (or the age of majority in your jurisdiction), you must have parental or guardian consent.</p>
    `,
  },
  {
    id: 'account',
    title: '3. Your Account',
    content: `
      <h4>3.1 Account Creation</h4>
      <p>You may create an account using:</p>
      <ul>
        <li>Email and password</li>
        <li>Web3 wallet (Ethereum/Polygon)</li>
        <li>OAuth providers (Google, Apple, Facebook, TikTok)</li>
      </ul>
      
      <h4>3.2 Account Security</h4>
      <p>You are responsible for:</p>
      <ul>
        <li>Maintaining the confidentiality of your credentials</li>
        <li>All activities under your account</li>
        <li>Notifying us immediately of unauthorized access</li>
        <li>Using a strong, unique password</li>
      </ul>
      
      <h4>3.3 Account Termination</h4>
      <p><strong>By You:</strong> You may delete your account at any time via Settings.</p>
      <p><strong>By Us:</strong> We may suspend or terminate your account if you violate these Terms or Community Guidelines, engage in fraudulent or illegal activity, pose a security risk, or fail to pay applicable fees.</p>
    `,
  },
  {
    id: 'use',
    title: '4. Use of the Service',
    content: `
      <h4>4.1 License Grant</h4>
      <p>Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to:</p>
      <ul>
        <li>Access and use the Service for personal, non-commercial purposes</li>
        <li>Download and install our mobile applications on devices you own</li>
      </ul>
      
      <h4>4.2 Restrictions</h4>
      <p>You agree NOT to:</p>
      <ul>
        <li>Reverse engineer, decompile, or modify the Service</li>
        <li>Use the Service for illegal purposes</li>
        <li>Attempt to gain unauthorized access to any systems</li>
        <li>Interfere with the Service's security or integrity</li>
        <li>Create multiple accounts to evade bans or restrictions</li>
        <li>Use bots, scrapers, or automated tools without permission</li>
        <li>Impersonate others or misrepresent your identity</li>
        <li>Sell, resell, or commercially exploit the Service</li>
      </ul>
    `,
  },
  {
    id: 'content',
    title: '5. User Content',
    content: `
      <h4>5.1 Your Content</h4>
      <p>You retain ownership of content you create ("User Content"). By posting, you grant CGraph a worldwide, non-exclusive, royalty-free license to:</p>
      <ul>
        <li>Host, store, and display your content</li>
        <li>Distribute your content to intended recipients</li>
        <li>Create backups for service continuity</li>
      </ul>
      <p>This license terminates when you delete the content (subject to backup retention periods).</p>
      
      <h4>5.2 Content Responsibility</h4>
      <p>You are solely responsible for your User Content. You represent that:</p>
      <ul>
        <li>You own or have rights to post the content</li>
        <li>Your content does not violate any laws or third-party rights</li>
        <li>Your content complies with our Community Guidelines</li>
      </ul>
      
      <h4>5.3 Content Removal</h4>
      <p>We may remove content that violates these Terms or Community Guidelines, is subject to valid legal takedown requests, or poses risks to user safety or the Service.</p>
    `,
  },
  {
    id: 'encryption',
    title: '6. End-to-End Encryption',
    content: `
      <p>CGraph provides end-to-end encryption for direct messages using the X3DH key agreement protocol. Important points:</p>
      <ul>
        <li><strong>We cannot access encrypted content</strong> - Only you and your conversation partners can read messages</li>
        <li><strong>No backdoors</strong> - We will not implement encryption backdoors</li>
        <li><strong>Key responsibility</strong> - You are responsible for backing up your encryption keys</li>
        <li><strong>Device loss</strong> - If you lose access to all devices without backup, encrypted messages cannot be recovered</li>
      </ul>
    `,
  },
  {
    id: 'guidelines',
    title: '7. Community Guidelines',
    content: `
      <p>You agree not to post or share content that:</p>
      <ul>
        <li>❌ Is illegal, harmful, or promotes violence</li>
        <li>❌ Harasses, bullies, or threatens others</li>
        <li>❌ Contains hate speech or discrimination</li>
        <li>❌ Is sexually explicit or exploitative</li>
        <li>❌ Infringes intellectual property rights</li>
        <li>❌ Contains malware or phishing attempts</li>
        <li>❌ Spreads misinformation that could cause harm</li>
        <li>❌ Violates others' privacy without consent</li>
      </ul>
      <p>Violations may result in content removal, account suspension, or permanent ban.</p>
    `,
  },
  {
    id: 'premium',
    title: '8. Premium Features & Payments',
    content: `
      <h4>8.1 Subscription Tiers</h4>
      <p>CGraph offers free and paid subscription tiers. Premium features may include:</p>
      <ul>
        <li>Increased storage limits</li>
        <li>Group video calls with more participants</li>
        <li>Custom badges and titles</li>
        <li>Bonus XP and exclusive achievements</li>
        <li>Priority quest access and seasonal rewards</li>
        <li>Priority support</li>
      </ul>
      
      <h4>8.2 Payment Terms</h4>
      <ul>
        <li>Subscriptions renew automatically unless cancelled</li>
        <li>Prices may change with 30 days notice</li>
        <li>Refunds are available within 14 days for unused features</li>
        <li>Payments are processed securely via Stripe</li>
      </ul>
    `,
  },
  {
    id: 'ip',
    title: '9. Intellectual Property',
    content: `
      <p>The Service and its original content (excluding User Content) remain the exclusive property of CGraph. This includes:</p>
      <ul>
        <li>Software, code, and algorithms</li>
        <li>Visual design and user interface</li>
        <li>Trademarks, logos, and branding</li>
        <li>Documentation and marketing materials</li>
      </ul>
      <p>You may not use our intellectual property without written permission.</p>
    `,
  },
  {
    id: 'disclaimer',
    title: '10. Disclaimers',
    content: `
      <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM:</p>
      <ul>
        <li>WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE</li>
        <li>WARRANTIES OF NON-INFRINGEMENT</li>
        <li>WARRANTIES REGARDING SECURITY, RELIABILITY, OR AVAILABILITY</li>
      </ul>
      <p>We do not warrant that the Service will be uninterrupted, error-free, or secure.</p>
    `,
  },
  {
    id: 'liability',
    title: '11. Limitation of Liability',
    content: `
      <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, CGRAPH SHALL NOT BE LIABLE FOR:</p>
      <ul>
        <li>Indirect, incidental, special, or consequential damages</li>
        <li>Loss of profits, data, or goodwill</li>
        <li>Service interruption or data breaches</li>
        <li>Third-party actions or content</li>
      </ul>
      <p>Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim, or $100 USD, whichever is greater.</p>
    `,
  },
  {
    id: 'governing',
    title: '12. Governing Law & Disputes',
    content: `
      <p>These Terms shall be governed by the laws of Delaware, USA, without regard to conflict of law principles.</p>
      <p>Any disputes shall be resolved through:</p>
      <ol>
        <li><strong>Informal Resolution</strong> - Contact us first at legal@cgraph.org</li>
        <li><strong>Arbitration</strong> - Binding arbitration under AAA rules (individual claims only)</li>
        <li><strong>Small Claims Court</strong> - Either party may bring claims in small claims court</li>
      </ol>
      <p><strong>Class Action Waiver:</strong> You agree to resolve disputes individually and waive the right to participate in class actions.</p>
    `,
  },
  {
    id: 'changes',
    title: '13. Changes to Terms',
    content: `
      <p>We may update these Terms from time to time. When we do:</p>
      <ul>
        <li>We will update the "Last Updated" date</li>
        <li>Material changes will be notified via email or in-app notice</li>
        <li>Continued use after changes constitutes acceptance</li>
      </ul>
      <p>If you disagree with changes, you may close your account before they take effect.</p>
    `,
  },
  {
    id: 'contact',
    title: '14. Contact Us',
    content: `
      <p>If you have questions about these Terms, please contact us:</p>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:legal@cgraph.org">legal@cgraph.org</a></li>
        <li><strong>Support:</strong> <a href="mailto:support@cgraph.org">support@cgraph.org</a></li>
      </ul>
    `,
  },
];

export default function TermsOfService() {
  return (
    <MarketingLayout
      title="Terms of Service"
      subtitle="Last updated: January 21, 2026 • Version 1.1"
      eyebrow="Service Agreement"
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
              Welcome to CGraph! These Terms of Service ("Terms") govern your access to and use of
              CGraph's mobile applications, websites, and services (collectively, the "Service"). By
              accessing or using the Service, you agree to be bound by these Terms.
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
            <nav className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
              transition={{ duration: 0.5 }}
              className="mb-12 scroll-mt-24"
            >
              <h2
                className="font-zentry mb-6 text-2xl font-bold"
                style={{ color: 'var(--color-light)' }}
              >
                {section.title}
              </h2>
              <div
                className="legal-content"
                dangerouslySetInnerHTML={{ __html: section.content }}
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
              <a href="/privacy" className="marketing-card" style={{ padding: '1rem' }}>
                <h4 className="font-medium" style={{ color: 'var(--color-light)' }}>
                  Privacy Policy
                </h4>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-gray)' }}>
                  How we handle your data
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

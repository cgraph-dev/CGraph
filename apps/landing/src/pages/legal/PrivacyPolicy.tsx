/**
 * Privacy Policy Page
 *
 * GDPR-compliant privacy policy for CGraph
 */

import { LegalLayout } from './LegalLayout';

const tableOfContents = [
  { id: 'information-we-collect', title: 'Information We Collect' },
  { id: 'how-we-use', title: 'How We Use Your Information' },
  { id: 'data-sharing', title: 'Data Sharing' },
  { id: 'data-retention', title: 'Data Retention' },
  { id: 'your-rights', title: 'Your Rights' },
  { id: 'security', title: 'Security' },
  { id: 'international', title: 'International Transfers' },
  { id: 'children', title: "Children's Privacy" },
  { id: 'changes', title: 'Changes to Policy' },
  { id: 'contact', title: 'Contact Us' },
];

export default function PrivacyPolicy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="Your privacy is important to us. This policy explains how we collect, use, and protect your information."
      lastUpdated="January 29, 2026"
      tableOfContents={tableOfContents}
    >
      <section id="information-we-collect" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">1. Information We Collect</h2>

        <h3 className="mb-3 mt-6 text-lg font-semibold text-white">Information You Provide</h3>
        <ul className="list-inside list-disc space-y-2 text-gray-400">
          <li>
            <strong className="text-white">Account Information:</strong> Username, email address,
            and password when you create an account
          </li>
          <li>
            <strong className="text-white">Profile Information:</strong> Display name, avatar, bio,
            and customization preferences
          </li>
          <li>
            <strong className="text-white">Communications:</strong> Messages, posts, and other
            content you create (encrypted end-to-end)
          </li>
          <li>
            <strong className="text-white">Payment Information:</strong> Processed securely through
            Stripe; we don't store card details
          </li>
        </ul>

        <h3 className="mb-3 mt-6 text-lg font-semibold text-white">
          Information Collected Automatically
        </h3>
        <ul className="list-inside list-disc space-y-2 text-gray-400">
          <li>
            <strong className="text-white">Device Information:</strong> Device type, operating
            system, browser type
          </li>
          <li>
            <strong className="text-white">Usage Data:</strong> Features used, time spent,
            interaction patterns (anonymized)
          </li>
          <li>
            <strong className="text-white">Log Data:</strong> IP address, access times, error logs
            (retained for 30 days)
          </li>
        </ul>

        <div className="mt-6 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-sm text-emerald-400">
            <strong>🔒 End-to-End Encryption:</strong> Your private messages are encrypted using the
            Signal Protocol. We cannot read your messages—only you and your intended recipients can.
          </p>
        </div>
      </section>

      <section id="how-we-use" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">2. How We Use Your Information</h2>
        <ul className="list-inside list-disc space-y-2 text-gray-400">
          <li>Provide, maintain, and improve our services</li>
          <li>Process transactions and send related information</li>
          <li>Send technical notices, updates, and security alerts</li>
          <li>Respond to your comments, questions, and customer service requests</li>
          <li>Monitor and analyze trends, usage, and activities</li>
          <li>Detect, prevent, and address fraud and abuse</li>
          <li>Personalize and improve your experience</li>
        </ul>
      </section>

      <section id="data-sharing" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">3. Data Sharing</h2>
        <p className="mb-4 text-gray-400">
          We do not sell your personal information. We may share information with:
        </p>
        <ul className="list-inside list-disc space-y-2 text-gray-400">
          <li>
            <strong className="text-white">Service Providers:</strong> Companies that help us
            operate (hosting, analytics, payment processing)
          </li>
          <li>
            <strong className="text-white">Legal Requirements:</strong> When required by law or to
            protect rights and safety
          </li>
          <li>
            <strong className="text-white">Business Transfers:</strong> In connection with a merger,
            acquisition, or sale of assets
          </li>
          <li>
            <strong className="text-white">With Your Consent:</strong> When you explicitly agree to
            sharing
          </li>
        </ul>

        <h3 className="mb-3 mt-6 text-lg font-semibold text-white">Third-Party Services</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-400">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-3 text-left text-white">Service</th>
                <th className="py-3 text-left text-white">Purpose</th>
                <th className="py-3 text-left text-white">Data Shared</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/5">
                <td className="py-3">Stripe</td>
                <td className="py-3">Payment processing</td>
                <td className="py-3">Payment details (PCI compliant)</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3">Vercel</td>
                <td className="py-3">Hosting</td>
                <td className="py-3">Access logs, IP addresses</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3">Fly.io</td>
                <td className="py-3">Backend infrastructure</td>
                <td className="py-3">Encrypted application data</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="data-retention" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">4. Data Retention</h2>
        <ul className="list-inside list-disc space-y-2 text-gray-400">
          <li>
            <strong className="text-white">Account Data:</strong> Retained while your account is
            active
          </li>
          <li>
            <strong className="text-white">Messages:</strong> Retained until you delete them
            (encrypted at rest)
          </li>
          <li>
            <strong className="text-white">Log Data:</strong> Retained for 30 days
          </li>
          <li>
            <strong className="text-white">Backups:</strong> Retained for 90 days after deletion
          </li>
        </ul>
        <p className="mt-4 text-gray-400">
          When you delete your account, we remove your personal data within 30 days, except where
          retention is required by law or legitimate business purposes.
        </p>
      </section>

      <section id="your-rights" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">5. Your Rights</h2>
        <p className="mb-4 text-gray-400">Depending on your location, you may have the right to:</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h4 className="mb-2 font-semibold text-white">Access</h4>
            <p className="text-sm text-gray-400">Request a copy of your personal data</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h4 className="mb-2 font-semibold text-white">Rectification</h4>
            <p className="text-sm text-gray-400">Correct inaccurate personal data</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h4 className="mb-2 font-semibold text-white">Erasure</h4>
            <p className="text-sm text-gray-400">Request deletion of your data</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h4 className="mb-2 font-semibold text-white">Portability</h4>
            <p className="text-sm text-gray-400">Export your data in a portable format</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h4 className="mb-2 font-semibold text-white">Restriction</h4>
            <p className="text-sm text-gray-400">Limit how we process your data</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h4 className="mb-2 font-semibold text-white">Objection</h4>
            <p className="text-sm text-gray-400">Object to certain processing activities</p>
          </div>
        </div>
        <p className="mt-4 text-gray-400">
          To exercise these rights, visit{' '}
          <strong className="text-white">Settings → Privacy → Data Export/Deletion</strong> or
          contact us at{' '}
          <a href="mailto:privacy@cgraph.org" className="text-emerald-400 hover:text-emerald-300">
            privacy@cgraph.org
          </a>
          .
        </p>
      </section>

      <section id="security" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">6. Security</h2>
        <p className="mb-4 text-gray-400">We implement industry-standard security measures:</p>
        <ul className="list-inside list-disc space-y-2 text-gray-400">
          <li>End-to-end encryption for private messages (Signal Protocol)</li>
          <li>TLS 1.3 encryption for all data in transit</li>
          <li>AES-256 encryption for data at rest</li>
          <li>Argon2id password hashing (OWASP recommended)</li>
          <li>Regular security audits and penetration testing</li>
          <li>Bug bounty program for responsible disclosure</li>
        </ul>
      </section>

      <section id="international" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">7. International Data Transfers</h2>
        <p className="text-gray-400">
          We operate globally and may transfer your data to countries outside your residence. We
          ensure appropriate safeguards are in place, including Standard Contractual Clauses
          approved by the European Commission for transfers from the EEA.
        </p>
      </section>

      <section id="children" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">8. Children's Privacy</h2>
        <p className="text-gray-400">
          CGraph is not intended for users under 13 years of age (or 16 in the EEA). We do not
          knowingly collect personal information from children. If you believe we have collected
          data from a child, please contact us immediately.
        </p>
      </section>

      <section id="changes" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">9. Changes to This Policy</h2>
        <p className="text-gray-400">
          We may update this Privacy Policy from time to time. We will notify you of any changes by
          posting the new policy on this page and updating the "Last updated" date. For significant
          changes, we will provide additional notice via email or in-app notification.
        </p>
      </section>

      <section id="contact" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">10. Contact Us</h2>
        <p className="mb-4 text-gray-400">For privacy-related inquiries:</p>
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <p className="font-semibold text-white">CGraph Privacy Team</p>
          <p className="mt-2 text-gray-400">
            Email:{' '}
            <a href="mailto:privacy@cgraph.org" className="text-emerald-400 hover:text-emerald-300">
              privacy@cgraph.org
            </a>
          </p>
          <p className="mt-1 text-gray-400">
            Data Protection Officer:{' '}
            <a href="mailto:dpo@cgraph.org" className="text-emerald-400 hover:text-emerald-300">
              dpo@cgraph.org
            </a>
          </p>
        </div>
      </section>
    </LegalLayout>
  );
}

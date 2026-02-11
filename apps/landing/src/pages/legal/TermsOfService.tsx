/**
 * Terms of Service Page
 */

import { Link } from 'react-router-dom';
import { LegalLayout } from './LegalLayout';

const tableOfContents = [
  { id: 'acceptance', title: 'Acceptance of Terms' },
  { id: 'eligibility', title: 'Eligibility' },
  { id: 'account', title: 'Your Account' },
  { id: 'acceptable-use', title: 'Acceptable Use' },
  { id: 'content', title: 'User Content' },
  { id: 'intellectual-property', title: 'Intellectual Property' },
  { id: 'payments', title: 'Payments & Subscriptions' },
  { id: 'termination', title: 'Termination' },
  { id: 'disclaimers', title: 'Disclaimers' },
  { id: 'liability', title: 'Limitation of Liability' },
  { id: 'disputes', title: 'Dispute Resolution' },
  { id: 'changes', title: 'Changes to Terms' },
];

export default function TermsOfService() {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="Please read these terms carefully before using CGraph."
      lastUpdated="January 29, 2026"
      tableOfContents={tableOfContents}
    >
      <section id="acceptance" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">1. Acceptance of Terms</h2>
        <p className="mb-4 text-gray-400">
          By accessing or using CGraph ("Service"), you agree to be bound by these Terms of Service
          ("Terms"). If you disagree with any part of the terms, you may not access the Service.
        </p>
        <p className="text-gray-400">
          These Terms apply to all visitors, users, and others who access or use the Service. By
          using the Service, you also agree to our{' '}
          <Link to="/privacy" className="text-emerald-400 hover:text-emerald-300">
            Privacy Policy
          </Link>
          .
        </p>
      </section>

      <section id="eligibility" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">2. Eligibility</h2>
        <p className="mb-4 text-gray-400">To use CGraph, you must:</p>
        <ul className="list-inside list-disc space-y-2 text-gray-400">
          <li>Be at least 13 years old (or 16 in the European Economic Area)</li>
          <li>Have the legal capacity to enter into these Terms</li>
          <li>Not be prohibited from using the Service under applicable laws</li>
          <li>Not have been previously banned from using CGraph</li>
        </ul>
      </section>

      <section id="account" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">3. Your Account</h2>
        <h3 className="mb-3 mt-6 text-lg font-semibold text-white">Account Security</h3>
        <p className="mb-4 text-gray-400">You are responsible for:</p>
        <ul className="list-inside list-disc space-y-2 text-gray-400">
          <li>Maintaining the confidentiality of your account credentials</li>
          <li>All activities that occur under your account</li>
          <li>Notifying us immediately of any unauthorized access</li>
        </ul>

        <h3 className="mb-3 mt-6 text-lg font-semibold text-white">Account Information</h3>
        <p className="text-gray-400">
          You agree to provide accurate, current, and complete information during registration and
          to update such information to keep it accurate, current, and complete.
        </p>
      </section>

      <section id="acceptable-use" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">4. Acceptable Use</h2>
        <p className="mb-4 text-gray-400">You agree not to:</p>
        <div className="grid gap-3">
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-gray-400">
            <strong className="text-red-400">❌</strong> Use the Service for any illegal purpose or
            in violation of any laws
          </div>
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-gray-400">
            <strong className="text-red-400">❌</strong> Harass, abuse, threaten, or incite violence
            against any person
          </div>
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-gray-400">
            <strong className="text-red-400">❌</strong> Share content that is illegal, harmful,
            fraudulent, or objectionable
          </div>
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-gray-400">
            <strong className="text-red-400">❌</strong> Attempt to gain unauthorized access to
            other accounts or systems
          </div>
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-gray-400">
            <strong className="text-red-400">❌</strong> Use automated means to access the Service
            without permission
          </div>
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-gray-400">
            <strong className="text-red-400">❌</strong> Interfere with or disrupt the Service or
            servers/networks
          </div>
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-gray-400">
            <strong className="text-red-400">❌</strong> Impersonate others or misrepresent your
            affiliation
          </div>
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-gray-400">
            <strong className="text-red-400">❌</strong> Share malware, spam, or engage in phishing
            activities
          </div>
        </div>
      </section>

      <section id="content" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">5. User Content</h2>
        <h3 className="mb-3 mt-6 text-lg font-semibold text-white">Your Content</h3>
        <p className="mb-4 text-gray-400">
          You retain ownership of content you create. By posting content, you grant us a
          non-exclusive, worldwide, royalty-free license to use, display, and distribute your
          content solely for operating and improving the Service.
        </p>

        <h3 className="mb-3 mt-6 text-lg font-semibold text-white">Content Moderation</h3>
        <p className="text-gray-400">
          We may, but are not obligated to, review, monitor, or remove content that violates these
          Terms. We are not responsible for content posted by users.
        </p>

        <div className="mt-6 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-sm text-emerald-400">
            <strong>🔒 Encryption Note:</strong> Private messages are end-to-end encrypted. We
            cannot access, moderate, or report on the content of encrypted messages.
          </p>
        </div>
      </section>

      <section id="intellectual-property" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">6. Intellectual Property</h2>
        <p className="mb-4 text-gray-400">
          The Service and its original content (excluding user content), features, and functionality
          are and will remain the exclusive property of CGraph and its licensors.
        </p>
        <p className="text-gray-400">
          Our trademarks and trade dress may not be used in connection with any product or service
          without the prior written consent of CGraph.
        </p>
      </section>

      <section id="payments" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">7. Payments & Subscriptions</h2>
        <h3 className="mb-3 mt-6 text-lg font-semibold text-white">Premium Subscriptions</h3>
        <ul className="list-inside list-disc space-y-2 text-gray-400">
          <li>Subscriptions are billed in advance on a recurring basis</li>
          <li>You can cancel your subscription at any time</li>
          <li>Cancellations take effect at the end of the current billing period</li>
          <li>Refunds are provided in accordance with applicable law</li>
        </ul>

        <h3 className="mb-3 mt-6 text-lg font-semibold text-white">In-App Purchases</h3>
        <p className="text-gray-400">
          Virtual items and currencies purchased within CGraph have no real-world value and cannot
          be exchanged for real money. Purchases are final except where required by law.
        </p>
      </section>

      <section id="termination" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">8. Termination</h2>
        <p className="mb-4 text-gray-400">
          We may terminate or suspend your account immediately, without prior notice or liability,
          for any reason, including if you breach these Terms.
        </p>
        <p className="text-gray-400">
          Upon termination, your right to use the Service will immediately cease. You may delete
          your account at any time through Settings → Account → Delete Account.
        </p>
      </section>

      <section id="disclaimers" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">9. Disclaimers</h2>
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4 text-gray-400">
          <p className="mb-2 font-semibold text-yellow-400">IMPORTANT</p>
          <p>
            THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. CGRAPH DISCLAIMS ALL
            WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
            IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
            NON-INFRINGEMENT.
          </p>
        </div>
      </section>

      <section id="liability" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">10. Limitation of Liability</h2>
        <p className="text-gray-400">
          IN NO EVENT SHALL CGRAPH, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR
          AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
          DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER
          INTANGIBLE LOSSES.
        </p>
      </section>

      <section id="disputes" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">11. Dispute Resolution</h2>
        <h3 className="mb-3 mt-6 text-lg font-semibold text-white">Informal Resolution</h3>
        <p className="mb-4 text-gray-400">
          Before filing a claim, you agree to try to resolve the dispute informally by contacting us
          at{' '}
          <a href="mailto:legal@cgraph.org" className="text-emerald-400 hover:text-emerald-300">
            legal@cgraph.org
          </a>
          .
        </p>

        <h3 className="mb-3 mt-6 text-lg font-semibold text-white">Governing Law</h3>
        <p className="text-gray-400">
          These Terms shall be governed by and construed in accordance with the laws of the
          jurisdiction in which CGraph is incorporated, without regard to its conflict of law
          provisions.
        </p>
      </section>

      <section id="changes" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">12. Changes to Terms</h2>
        <p className="mb-4 text-gray-400">
          We reserve the right to modify or replace these Terms at any time. We will provide notice
          of any changes by posting the new Terms on this page.
        </p>
        <p className="text-gray-400">
          Your continued use of the Service after any changes constitutes acceptance of the new
          Terms. If you do not agree to the new terms, please stop using the Service.
        </p>
      </section>

      <section className="mt-16 rounded-lg border border-white/10 bg-white/5 p-6">
        <h3 className="mb-2 text-lg font-semibold text-white">Questions?</h3>
        <p className="text-gray-400">
          If you have any questions about these Terms, please contact us at{' '}
          <a href="mailto:legal@cgraph.org" className="text-emerald-400 hover:text-emerald-300">
            legal@cgraph.org
          </a>
          .
        </p>
      </section>
    </LegalLayout>
  );
}

/**
 * GDPR Rights Page
 */

import { LegalLayout } from './LegalLayout';

const tableOfContents = [
  { id: 'overview', title: 'Overview' },
  { id: 'your-rights', title: 'Your Rights' },
  { id: 'right-to-access', title: 'Right to Access' },
  { id: 'right-to-rectification', title: 'Right to Rectification' },
  { id: 'right-to-erasure', title: 'Right to Erasure' },
  { id: 'right-to-portability', title: 'Right to Data Portability' },
  { id: 'right-to-restrict', title: 'Right to Restrict Processing' },
  { id: 'right-to-object', title: 'Right to Object' },
  { id: 'automated-decisions', title: 'Automated Decision-Making' },
  { id: 'exercising-rights', title: 'Exercising Your Rights' },
  { id: 'data-controller', title: 'Data Controller' },
  { id: 'complaints', title: 'Filing Complaints' },
];

export default function GDPR() {
  return (
    <LegalLayout
      title="GDPR Rights"
      subtitle="Your rights under the General Data Protection Regulation."
      lastUpdated="January 29, 2026"
      tableOfContents={tableOfContents}
    >
      <section id="overview" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">Overview</h2>
        <p className="mb-4 text-gray-400">
          The General Data Protection Regulation (GDPR) is a comprehensive data protection law that
          gives individuals in the European Economic Area (EEA) greater control over their personal
          data.
        </p>
        <p className="text-gray-400">
          CGraph is committed to GDPR compliance. This page explains your rights under GDPR and how
          to exercise them. These rights apply to users in the EEA, UK, and Switzerland.
        </p>
      </section>

      <section id="your-rights" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">Your Rights at a Glance</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-4 text-center">
            <div className="mb-2 text-3xl">👁️</div>
            <h3 className="text-sm font-semibold text-white">Access</h3>
          </div>
          <div className="rounded-lg border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-4 text-center">
            <div className="mb-2 text-3xl">✏️</div>
            <h3 className="text-sm font-semibold text-white">Rectification</h3>
          </div>
          <div className="rounded-lg border border-red-500/20 bg-gradient-to-br from-red-500/10 to-red-600/5 p-4 text-center">
            <div className="mb-2 text-3xl">🗑️</div>
            <h3 className="text-sm font-semibold text-white">Erasure</h3>
          </div>
          <div className="rounded-lg border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-4 text-center">
            <div className="mb-2 text-3xl">📦</div>
            <h3 className="text-sm font-semibold text-white">Portability</h3>
          </div>
          <div className="rounded-lg border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 p-4 text-center">
            <div className="mb-2 text-3xl">⏸️</div>
            <h3 className="text-sm font-semibold text-white">Restriction</h3>
          </div>
          <div className="rounded-lg border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-orange-600/5 p-4 text-center">
            <div className="mb-2 text-3xl">🚫</div>
            <h3 className="text-sm font-semibold text-white">Object</h3>
          </div>
          <div className="rounded-lg border border-pink-500/20 bg-gradient-to-br from-pink-500/10 to-pink-600/5 p-4 text-center">
            <div className="mb-2 text-3xl">🤖</div>
            <h3 className="text-sm font-semibold text-white">Automated Decisions</h3>
          </div>
          <div className="rounded-lg border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 p-4 text-center">
            <div className="mb-2 text-3xl">🔔</div>
            <h3 className="text-sm font-semibold text-white">Be Informed</h3>
          </div>
        </div>
      </section>

      <section id="right-to-access" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">Right to Access (Article 15)</h2>
        <p className="mb-4 text-gray-400">
          You have the right to obtain confirmation as to whether we are processing your personal
          data and, if so, access to that data along with:
        </p>
        <ul className="list-inside list-disc space-y-2 text-gray-400">
          <li>The purposes of the processing</li>
          <li>The categories of personal data concerned</li>
          <li>The recipients or categories of recipient to whom the data has been disclosed</li>
          <li>The envisaged period for which the data will be stored</li>
          <li>
            The existence of your other rights (rectification, erasure, restriction, objection)
          </li>
          <li>Information about the source of the data</li>
          <li>The existence of automated decision-making, including profiling</li>
        </ul>

        <div className="mt-6 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
          <h4 className="mb-2 font-semibold text-emerald-400">📥 How to Access Your Data</h4>
          <p className="text-sm text-gray-400">
            Go to <strong>Settings → Privacy & Safety → Request My Data</strong> to download a copy
            of all your personal data. Your data package will be ready within 30 days.
          </p>
        </div>
      </section>

      <section id="right-to-rectification" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">Right to Rectification (Article 16)</h2>
        <p className="mb-4 text-gray-400">
          You have the right to have inaccurate personal data corrected without undue delay. Taking
          into account the purposes of the processing, you also have the right to have incomplete
          personal data completed.
        </p>

        <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
          <h4 className="mb-2 font-semibold text-blue-400">✏️ How to Correct Your Data</h4>
          <p className="text-sm text-gray-400">
            Most data can be corrected directly in <strong>Settings → Account</strong>. For data you
            cannot edit yourself, contact us at{' '}
            <a href="mailto:privacy@cgraph.org" className="text-emerald-400 hover:text-emerald-300">
              privacy@cgraph.org
            </a>
            .
          </p>
        </div>
      </section>

      <section id="right-to-erasure" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">Right to Erasure (Article 17)</h2>
        <p className="mb-4 text-gray-400">
          Also known as the "right to be forgotten," you have the right to have your personal data
          erased when:
        </p>
        <ul className="mb-4 list-inside list-disc space-y-2 text-gray-400">
          <li>The data is no longer necessary for its original purpose</li>
          <li>You withdraw consent and there is no other legal basis for processing</li>
          <li>You object to the processing and there are no overriding legitimate grounds</li>
          <li>The data has been unlawfully processed</li>
          <li>The data must be erased for compliance with a legal obligation</li>
        </ul>

        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
          <h4 className="mb-2 font-semibold text-red-400">🗑️ How to Delete Your Data</h4>
          <p className="text-sm text-gray-400">
            Go to <strong>Settings → Account → Delete Account</strong> to permanently delete your
            account and all associated data. This action cannot be undone.
          </p>
        </div>

        <div className="mt-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
          <p className="text-sm text-yellow-400">
            <strong>Note:</strong> Some data may be retained for legal compliance, fraud prevention,
            or to protect the rights of others. End-to-end encrypted messages cannot be recovered
            once deleted as we don't have access to their content.
          </p>
        </div>
      </section>

      <section id="right-to-portability" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">
          Right to Data Portability (Article 20)
        </h2>
        <p className="mb-4 text-gray-400">
          You have the right to receive your personal data in a structured, commonly used,
          machine-readable format and to transmit that data to another controller without hindrance.
        </p>
        <p className="mb-4 text-gray-400">This right applies when:</p>
        <ul className="list-inside list-disc space-y-2 text-gray-400">
          <li>The processing is based on consent or a contract</li>
          <li>The processing is carried out by automated means</li>
        </ul>

        <div className="mt-6 rounded-lg border border-purple-500/20 bg-purple-500/10 p-4">
          <h4 className="mb-2 font-semibold text-purple-400">📦 Data Export Formats</h4>
          <p className="text-sm text-gray-400">
            Your data export includes JSON files for structured data (messages, settings, activity)
            and original format for media files (images, videos, documents).
          </p>
        </div>
      </section>

      <section id="right-to-restrict" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">
          Right to Restrict Processing (Article 18)
        </h2>
        <p className="mb-4 text-gray-400">
          You have the right to restrict the processing of your personal data when:
        </p>
        <ul className="list-inside list-disc space-y-2 text-gray-400">
          <li>You contest the accuracy of the data (during verification)</li>
          <li>The processing is unlawful and you oppose erasure</li>
          <li>We no longer need the data but you require it for legal claims</li>
          <li>You have objected to processing (pending verification of legitimate grounds)</li>
        </ul>
      </section>

      <section id="right-to-object" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">Right to Object (Article 21)</h2>
        <p className="mb-4 text-gray-400">
          You have the right to object to the processing of your personal data based on our
          legitimate interests or for direct marketing purposes.
        </p>
        <p className="text-gray-400">
          If you object to processing for direct marketing purposes, we will stop processing
          immediately. For other objections, we will stop unless we can demonstrate compelling
          legitimate grounds that override your interests, rights, and freedoms.
        </p>
      </section>

      <section id="automated-decisions" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">
          Automated Decision-Making (Article 22)
        </h2>
        <p className="mb-4 text-gray-400">
          You have the right not to be subject to decisions based solely on automated processing
          that significantly affect you, unless:
        </p>
        <ul className="mb-4 list-inside list-disc space-y-2 text-gray-400">
          <li>It is necessary for a contract</li>
          <li>It is authorized by law</li>
          <li>It is based on your explicit consent</li>
        </ul>

        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <h4 className="mb-2 font-semibold text-white">Our Use of Automated Processing</h4>
          <p className="text-sm text-gray-400">
            CGraph uses automated processing for spam detection, content moderation, and
            recommendation systems. These systems do not make legally binding decisions. You can
            always appeal automated moderation decisions to human reviewers.
          </p>
        </div>
      </section>

      <section id="exercising-rights" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">Exercising Your Rights</h2>

        <div className="space-y-4">
          <div className="rounded-lg border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-transparent p-4">
            <h3 className="mb-2 font-semibold text-white">Option 1: In-App</h3>
            <p className="text-sm text-gray-400">
              Most rights can be exercised through <strong>Settings → Privacy & Safety</strong>.
              This is the fastest way to access, export, or delete your data.
            </p>
          </div>

          <div className="rounded-lg border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-transparent p-4">
            <h3 className="mb-2 font-semibold text-white">Option 2: Email</h3>
            <p className="text-sm text-gray-400">
              Send a request to{' '}
              <a
                href="mailto:privacy@cgraph.org"
                className="text-emerald-400 hover:text-emerald-300"
              >
                privacy@cgraph.org
              </a>{' '}
              with the subject line "GDPR Request" and specify which right you wish to exercise.
            </p>
          </div>

          <div className="rounded-lg border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-transparent p-4">
            <h3 className="mb-2 font-semibold text-white">Option 3: Contact Form</h3>
            <p className="text-sm text-gray-400">
              Use our{' '}
              <a href="/contact" className="text-emerald-400 hover:text-emerald-300">
                contact form
              </a>{' '}
              and select "Privacy / GDPR Request" as the topic.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4">
          <h4 className="mb-2 font-semibold text-white">Response Timeline</h4>
          <p className="text-sm text-gray-400">
            We will respond to your request within <strong>30 days</strong>. In complex cases, this
            may be extended by an additional 60 days, and we will inform you of any extension within
            the initial 30-day period.
          </p>
        </div>
      </section>

      <section id="data-controller" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">Data Controller</h2>
        <p className="mb-4 text-gray-400">
          CGraph is the data controller responsible for your personal data. Our Data Protection
          Officer can be contacted at:
        </p>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-gray-400">
            <strong className="text-white">Data Protection Officer</strong>
            <br />
            CGraph Inc.
            <br />
            Email:{' '}
            <a href="mailto:dpo@cgraph.org" className="text-emerald-400 hover:text-emerald-300">
              dpo@cgraph.org
            </a>
          </p>
        </div>
      </section>

      <section id="complaints" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">Filing Complaints</h2>
        <p className="mb-4 text-gray-400">
          If you believe your data protection rights have been violated, you have the right to lodge
          a complaint with a supervisory authority. You can file a complaint with:
        </p>
        <ul className="list-inside list-disc space-y-2 text-gray-400">
          <li>The supervisory authority in your country of residence</li>
          <li>The supervisory authority in your place of work</li>
          <li>The supervisory authority where the alleged infringement took place</li>
        </ul>
        <p className="mt-4 text-gray-400">
          We encourage you to contact us first so we can try to resolve your concerns directly.
        </p>
      </section>

      <section className="mt-16 rounded-lg border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 p-6">
        <h3 className="mb-2 text-lg font-semibold text-white">Need Help?</h3>
        <p className="mb-4 text-gray-400">
          Our privacy team is here to help you understand and exercise your rights.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="mailto:privacy@cgraph.org"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 px-4 py-2 text-emerald-400 transition-colors hover:bg-emerald-500/30"
          >
            ✉️ Email Privacy Team
          </a>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-white transition-colors hover:bg-white/20"
          >
            💬 Contact Form
          </a>
        </div>
      </section>
    </LegalLayout>
  );
}

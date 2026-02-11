/**
 * Cookie Policy Page
 */

import { Link } from 'react-router-dom';
import { LegalLayout } from './LegalLayout';

const tableOfContents = [
  { id: 'what-are-cookies', title: 'What Are Cookies?' },
  { id: 'how-we-use', title: 'How We Use Cookies' },
  { id: 'types', title: 'Types of Cookies' },
  { id: 'third-party', title: 'Third-Party Cookies' },
  { id: 'managing', title: 'Managing Cookies' },
  { id: 'specific-cookies', title: 'Specific Cookies We Use' },
  { id: 'updates', title: 'Policy Updates' },
  { id: 'contact', title: 'Contact Us' },
];

export default function CookiePolicy() {
  return (
    <LegalLayout
      title="Cookie Policy"
      subtitle="Learn how CGraph uses cookies and similar technologies."
      lastUpdated="January 29, 2026"
      tableOfContents={tableOfContents}
    >
      <section id="what-are-cookies" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">What Are Cookies?</h2>
        <p className="mb-4 text-gray-400">
          Cookies are small text files that are placed on your device when you visit a website. They
          are widely used to make websites work more efficiently, provide a better user experience,
          and give website owners information about how their site is being used.
        </p>
        <p className="text-gray-400">
          Similar technologies include pixel tags, web beacons, and local storage, which serve
          similar functions and are collectively referred to as "cookies" in this policy.
        </p>
      </section>

      <section id="how-we-use" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">How We Use Cookies</h2>
        <p className="mb-4 text-gray-400">CGraph uses cookies to:</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
            <div className="mb-2 text-2xl text-emerald-400">🔐</div>
            <h3 className="mb-1 font-semibold text-white">Authentication</h3>
            <p className="text-sm text-gray-400">
              Keep you logged in as you navigate between pages
            </p>
          </div>
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
            <div className="mb-2 text-2xl text-blue-400">⚙️</div>
            <h3 className="mb-1 font-semibold text-white">Preferences</h3>
            <p className="text-sm text-gray-400">Remember your settings and customizations</p>
          </div>
          <div className="rounded-lg border border-purple-500/20 bg-purple-500/10 p-4">
            <div className="mb-2 text-2xl text-purple-400">📊</div>
            <h3 className="mb-1 font-semibold text-white">Analytics</h3>
            <p className="text-sm text-gray-400">Understand how our service is used</p>
          </div>
          <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-4">
            <div className="mb-2 text-2xl text-orange-400">🛡️</div>
            <h3 className="mb-1 font-semibold text-white">Security</h3>
            <p className="text-sm text-gray-400">Detect and prevent fraudulent activity</p>
          </div>
        </div>
      </section>

      <section id="types" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">Types of Cookies</h2>

        <div className="space-y-6">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center gap-3">
              <span className="rounded bg-green-500/20 px-2 py-1 text-xs font-medium text-green-400">
                Required
              </span>
              <h3 className="font-semibold text-white">Essential Cookies</h3>
            </div>
            <p className="text-sm text-gray-400">
              These cookies are necessary for the website to function properly. They enable core
              functionality such as security, authentication, and accessibility. You cannot opt out
              of these cookies.
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center gap-3">
              <span className="rounded bg-blue-500/20 px-2 py-1 text-xs font-medium text-blue-400">
                Optional
              </span>
              <h3 className="font-semibold text-white">Preference Cookies</h3>
            </div>
            <p className="text-sm text-gray-400">
              These cookies allow the website to remember choices you make (such as your theme
              preference, language, or region) and provide enhanced, personalized features.
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center gap-3">
              <span className="rounded bg-purple-500/20 px-2 py-1 text-xs font-medium text-purple-400">
                Optional
              </span>
              <h3 className="font-semibold text-white">Analytics Cookies</h3>
            </div>
            <p className="text-sm text-gray-400">
              These cookies help us understand how visitors interact with our website by collecting
              and reporting information anonymously. This helps us improve our service.
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center gap-3">
              <span className="rounded bg-orange-500/20 px-2 py-1 text-xs font-medium text-orange-400">
                Optional
              </span>
              <h3 className="font-semibold text-white">Marketing Cookies</h3>
            </div>
            <p className="text-sm text-gray-400">
              These cookies are used to deliver advertisements more relevant to you and your
              interests. They may also be used to limit the number of times you see an
              advertisement.
            </p>
          </div>
        </div>
      </section>

      <section id="third-party" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">Third-Party Cookies</h2>
        <p className="mb-4 text-gray-400">
          Some cookies are placed by third-party services that appear on our pages. We use the
          following third-party services:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left font-semibold text-white">Provider</th>
                <th className="px-4 py-3 text-left font-semibold text-white">Purpose</th>
                <th className="px-4 py-3 text-left font-semibold text-white">Duration</th>
              </tr>
            </thead>
            <tbody className="text-gray-400">
              <tr className="border-b border-white/5">
                <td className="px-4 py-3">Cloudflare</td>
                <td className="px-4 py-3">Security, performance</td>
                <td className="px-4 py-3">Session to 1 year</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-3">PostHog</td>
                <td className="px-4 py-3">Analytics (self-hosted)</td>
                <td className="px-4 py-3">1 year</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-3">Stripe</td>
                <td className="px-4 py-3">Payment processing</td>
                <td className="px-4 py-3">Session to 2 years</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-3">Sentry</td>
                <td className="px-4 py-3">Error tracking</td>
                <td className="px-4 py-3">Session</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="managing" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">Managing Cookies</h2>

        <h3 className="mb-3 mt-6 text-lg font-semibold text-white">In-App Cookie Settings</h3>
        <p className="mb-4 text-gray-400">
          You can manage your cookie preferences at any time through our cookie settings panel.
          Click the "Cookie Settings" link in the footer to access these controls.
        </p>

        <h3 className="mb-3 mt-6 text-lg font-semibold text-white">Browser Settings</h3>
        <p className="mb-4 text-gray-400">
          You can also control cookies through your browser settings. Here's how to manage cookies
          in popular browsers:
        </p>
        <ul className="list-inside list-disc space-y-2 text-gray-400">
          <li>
            <a
              href="https://support.google.com/chrome/answer/95647"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300"
            >
              Google Chrome
            </a>
          </li>
          <li>
            <a
              href="https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300"
            >
              Mozilla Firefox
            </a>
          </li>
          <li>
            <a
              href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300"
            >
              Safari
            </a>
          </li>
          <li>
            <a
              href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300"
            >
              Microsoft Edge
            </a>
          </li>
        </ul>

        <div className="mt-6 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
          <p className="text-sm text-yellow-400">
            <strong>⚠️ Note:</strong> Disabling cookies may affect your experience on CGraph. Some
            features may not work properly without essential cookies.
          </p>
        </div>
      </section>

      <section id="specific-cookies" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">Specific Cookies We Use</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left font-semibold text-white">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-white">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-white">Purpose</th>
                <th className="px-4 py-3 text-left font-semibold text-white">Duration</th>
              </tr>
            </thead>
            <tbody className="text-gray-400">
              <tr className="border-b border-white/5">
                <td className="px-4 py-3 font-mono text-xs">cg_session</td>
                <td className="px-4 py-3">Essential</td>
                <td className="px-4 py-3">Session management</td>
                <td className="px-4 py-3">Session</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-3 font-mono text-xs">cg_auth_token</td>
                <td className="px-4 py-3">Essential</td>
                <td className="px-4 py-3">Authentication</td>
                <td className="px-4 py-3">14 days</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-3 font-mono text-xs">cg_refresh_token</td>
                <td className="px-4 py-3">Essential</td>
                <td className="px-4 py-3">Token refresh</td>
                <td className="px-4 py-3">30 days</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-3 font-mono text-xs">cg_theme</td>
                <td className="px-4 py-3">Preference</td>
                <td className="px-4 py-3">Theme preference</td>
                <td className="px-4 py-3">1 year</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-3 font-mono text-xs">cg_locale</td>
                <td className="px-4 py-3">Preference</td>
                <td className="px-4 py-3">Language preference</td>
                <td className="px-4 py-3">1 year</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-3 font-mono text-xs">cg_consent</td>
                <td className="px-4 py-3">Essential</td>
                <td className="px-4 py-3">Cookie consent</td>
                <td className="px-4 py-3">1 year</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="px-4 py-3 font-mono text-xs">cg_csrf</td>
                <td className="px-4 py-3">Essential</td>
                <td className="px-4 py-3">CSRF protection</td>
                <td className="px-4 py-3">Session</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="updates" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">Policy Updates</h2>
        <p className="text-gray-400">
          We may update this Cookie Policy from time to time to reflect changes in our practices or
          for other operational, legal, or regulatory reasons. We will notify you of any material
          changes by posting the new policy on this page with an updated "Last Updated" date.
        </p>
      </section>

      <section id="contact" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-white">Contact Us</h2>
        <p className="mb-4 text-gray-400">
          If you have any questions about our use of cookies or this policy, please contact us:
        </p>
        <ul className="space-y-2 text-gray-400">
          <li>
            <strong className="text-white">Email:</strong>{' '}
            <a href="mailto:privacy@cgraph.org" className="text-emerald-400 hover:text-emerald-300">
              privacy@cgraph.org
            </a>
          </li>
          <li>
            <strong className="text-white">Web:</strong>{' '}
            <Link to="/contact" className="text-emerald-400 hover:text-emerald-300">
              Contact Form
            </Link>
          </li>
        </ul>
      </section>
    </LegalLayout>
  );
}

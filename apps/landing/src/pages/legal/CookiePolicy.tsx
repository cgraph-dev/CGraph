/**
 * Cookie Policy Page
 *
 * Renders the Cookie Policy legal document with consistent
 * marketing page styling.
 *
 * @since v0.9.2
 */

import DOMPurify from 'dompurify';
import { motion } from 'framer-motion';
import { LiquidGlassLayout } from '@/components/liquid-glass';

const sections = [
  {
    id: 'what-are-cookies',
    title: '1. What Are Cookies?',
    content: `
      <p>Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit a website. They help the website remember your preferences, login status, and other information to improve your browsing experience.</p>
      
      <h4>1.1 Types of Cookies We Use</h4>
      <table>
        <thead><tr><th>Cookie Type</th><th>Purpose</th><th>Duration</th></tr></thead>
        <tbody>
          <tr><td><strong>Essential Cookies</strong></td><td>Required for the Service to function (authentication, security)</td><td>Session / 14 days</td></tr>
          <tr><td><strong>Functional Cookies</strong></td><td>Remember your preferences (theme, language)</td><td>1 year</td></tr>
          <tr><td><strong>Analytics Cookies</strong></td><td>Help us understand how you use the Service</td><td>90 days</td></tr>
        </tbody>
      </table>
    `,
  },
  {
    id: 'essential',
    title: '2. Essential Cookies',
    content: `
      <p>These cookies are strictly necessary for the Service to work. Without them, you cannot use basic features like logging in or accessing secure areas.</p>
      
      <table>
        <thead><tr><th>Cookie Name</th><th>Purpose</th><th>Expiry</th></tr></thead>
        <tbody>
          <tr><td><code>_cgraph_session</code></td><td>Session authentication token</td><td>14 days</td></tr>
          <tr><td><code>csrf_token</code></td><td>Cross-site request forgery protection</td><td>Session</td></tr>
          <tr><td><code>device_id</code></td><td>Device identification for multi-device sync</td><td>1 year</td></tr>
          <tr><td><code>cookie_consent</code></td><td>Stores your cookie preferences</td><td>1 year</td></tr>
        </tbody>
      </table>
      
      <p><strong>Legal Basis:</strong> Legitimate interest (necessary for service operation)</p>
    `,
  },
  {
    id: 'functional',
    title: '3. Functional Cookies',
    content: `
      <p>These cookies remember choices you make to provide enhanced, personalized features.</p>
      
      <table>
        <thead><tr><th>Cookie Name</th><th>Purpose</th><th>Expiry</th></tr></thead>
        <tbody>
          <tr><td><code>theme</code></td><td>Your preferred color theme (dark/light/matrix)</td><td>1 year</td></tr>
          <tr><td><code>locale</code></td><td>Your preferred language</td><td>1 year</td></tr>
          <tr><td><code>sidebar_collapsed</code></td><td>Sidebar state preference</td><td>1 year</td></tr>
          <tr><td><code>notification_prefs</code></td><td>Notification display preferences</td><td>1 year</td></tr>
        </tbody>
      </table>
      
      <p><strong>Legal Basis:</strong> Consent (you can disable these in Settings)</p>
    `,
  },
  {
    id: 'analytics',
    title: '4. Analytics Cookies',
    content: `
      <p>We use privacy-focused analytics to understand how the Service is used and to improve it. We do NOT use third-party tracking services like Google Analytics.</p>
      
      <table>
        <thead><tr><th>Cookie Name</th><th>Purpose</th><th>Expiry</th></tr></thead>
        <tbody>
          <tr><td><code>_plausible</code></td><td>Anonymous pageview analytics</td><td>Session</td></tr>
          <tr><td><code>usage_session</code></td><td>Session-based usage patterns</td><td>Session</td></tr>
        </tbody>
      </table>
      
      <h4>What We Track</h4>
      <ul>
        <li>Pages visited (anonymized)</li>
        <li>Feature usage patterns</li>
        <li>Error occurrences</li>
        <li>Performance metrics</li>
      </ul>
      
      <h4>What We Do NOT Track</h4>
      <ul>
        <li>No personal identifiers</li>
        <li>No cross-site browsing</li>
        <li>No advertising profiles</li>
        <li>No third-party cookies</li>
      </ul>
    `,
  },
  {
    id: 'third-party',
    title: '5. Third-Party Cookies',
    content: `
      <p>We minimize third-party cookies. The following may be set by our service providers:</p>
      
      <table>
        <thead><tr><th>Provider</th><th>Purpose</th><th>Cookie Type</th></tr></thead>
        <tbody>
          <tr><td>Cloudflare</td><td>DDoS protection, CDN</td><td>Security</td></tr>
          <tr><td>Stripe</td><td>Payment processing (if applicable)</td><td>Essential</td></tr>
        </tbody>
      </table>
      
      <p>These providers have their own privacy policies governing their cookies.</p>
    `,
  },
  {
    id: 'managing',
    title: '6. Managing Cookies',
    content: `
      <h4>6.1 In-App Settings</h4>
      <p>You can manage cookie preferences directly in CGraph:</p>
      <ol>
        <li>Go to <strong>Settings</strong> → <strong>Privacy</strong></li>
        <li>Toggle <strong>Analytics Cookies</strong> on/off</li>
        <li>Toggle <strong>Functional Cookies</strong> on/off</li>
      </ol>
      
      <h4>6.2 Browser Settings</h4>
      <p>Most browsers allow you to:</p>
      <ul>
        <li>View cookies stored on your device</li>
        <li>Delete individual or all cookies</li>
        <li>Block cookies from specific or all websites</li>
        <li>Set preferences for first-party vs third-party cookies</li>
      </ul>
      
      <p><strong>Browser Cookie Settings:</strong></p>
      <ul>
        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Chrome</a></li>
        <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer">Firefox</a></li>
        <li><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
        <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Edge</a></li>
      </ul>
      
      <h4>6.3 Do Not Track</h4>
      <p>We respect the "Do Not Track" browser setting. When enabled, we automatically disable non-essential cookies and analytics.</p>
    `,
  },
  {
    id: 'storage',
    title: '7. Local Storage & Session Storage',
    content: `
      <p>In addition to cookies, we use browser storage technologies:</p>
      
      <table>
        <thead><tr><th>Storage Type</th><th>Purpose</th><th>Data Stored</th></tr></thead>
        <tbody>
          <tr><td><strong>LocalStorage</strong></td><td>Persistent app state</td><td>Encrypted encryption keys, draft messages</td></tr>
          <tr><td><strong>SessionStorage</strong></td><td>Temporary session data</td><td>Temporary UI state</td></tr>
          <tr><td><strong>IndexedDB</strong></td><td>Offline message cache</td><td>Encrypted message database</td></tr>
        </tbody>
      </table>
      
      <p>This data never leaves your device and is encrypted at rest using your account keys.</p>
    `,
  },
  {
    id: 'mobile',
    title: '8. Mobile Applications',
    content: `
      <p>Our mobile apps (iOS/Android) do not use traditional cookies. Instead, we use:</p>
      <ul>
        <li><strong>Secure Storage:</strong> For authentication tokens</li>
        <li><strong>AsyncStorage:</strong> For preferences (encrypted)</li>
        <li><strong>Device Identifiers:</strong> Anonymous device ID for multi-device sync</li>
      </ul>
      
      <p>We do NOT use:</p>
      <ul>
        <li>No advertising identifiers (IDFA/GAID)</li>
        <li>No device fingerprinting</li>
        <li>No third-party SDKs that track users</li>
      </ul>
    `,
  },
  {
    id: 'changes',
    title: '9. Changes to This Policy',
    content: `
      <p>We may update this Cookie Policy to reflect changes in technology or legal requirements. We will:</p>
      <ul>
        <li>Update the "Last Updated" date at the top</li>
        <li>Notify you of material changes via email or in-app notification</li>
        <li>Obtain new consent if required by law</li>
      </ul>
    `,
  },
  {
    id: 'contact',
    title: '10. Contact Us',
    content: `
      <p>If you have questions about our use of cookies, please contact us:</p>
      <ul>
        <li><strong>Company:</strong> CGraph, registered in Georgia</li>
        <li><strong>Founded:</strong> 2026</li>
        <li><strong>Email:</strong> <a href="mailto:privacy@cgraph.org">privacy@cgraph.org</a></li>
        <li><strong>Privacy Portal:</strong> <a href="/privacy">cgraph.org/privacy</a></li>
        <li><strong>Data Protection Officer:</strong> <a href="mailto:dpo@cgraph.org">dpo@cgraph.org</a></li>
        <li><strong>Website:</strong> <a href="https://cgraph.org">cgraph.org</a></li>
      </ul>
    `,
  },
];

export default function CookiePolicy() {
  return (
    <LiquidGlassLayout
      title="Cookie Policy"
      subtitle="Last updated: February 10, 2026 • Version 2.0"
    >
      {/* Introduction */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-surface mb-12 rounded-2xl p-6 shadow-glass"
      >
        <p className="text-lg leading-relaxed text-slate-500">
          This Cookie Policy explains how CGraph, a company registered in Georgia (&ldquo;we&rdquo;,
          &ldquo;us&rdquo;, &ldquo;our&rdquo;), uses cookies and similar technologies when you visit
          our website at cgraph.org or use our web application (collectively, the
          &ldquo;Service&rdquo;). This policy is designed to comply with cookie and tracking
          regulations worldwide, including the EU ePrivacy Directive, GDPR, CCPA/CPRA, PIPEDA, and
          LGPD.
        </p>
      </motion.div>

      {/* Table of Contents */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-12"
      >
        <h2 className="mb-4 text-xl font-semibold text-slate-900">Table of Contents</h2>
        <nav className="grid gap-2 sm:grid-cols-2">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="text-slate-500 transition-colors hover:text-glow-purple"
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
          <h2 className="mb-6 text-2xl font-bold text-slate-900">{section.title}</h2>
          <div
            className="prose prose-slate prose-headings:text-slate-900 prose-a:text-glow-purple max-w-none"
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
        className="glass-surface rounded-2xl p-6 shadow-glass"
      >
        <h3 className="mb-4 text-xl font-semibold text-slate-900">Related Documents</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <a
            href="/privacy"
            className="glass-surface rounded-xl p-4 shadow-glass transition-shadow hover:shadow-glass-lg"
          >
            <h4 className="font-medium text-slate-900">Privacy Policy</h4>
            <p className="mt-1 text-sm text-slate-500">How we handle your data</p>
          </a>
          <a
            href="/terms"
            className="glass-surface rounded-xl p-4 shadow-glass transition-shadow hover:shadow-glass-lg"
          >
            <h4 className="font-medium text-slate-900">Terms of Service</h4>
            <p className="mt-1 text-sm text-slate-500">Rules for using CGraph</p>
          </a>
          <a
            href="/gdpr"
            className="glass-surface rounded-xl p-4 shadow-glass transition-shadow hover:shadow-glass-lg"
          >
            <h4 className="font-medium text-slate-900">GDPR Compliance</h4>
            <p className="mt-1 text-sm text-slate-500">Your data rights</p>
          </a>
        </div>
      </motion.div>
    </LiquidGlassLayout>
  );
}

/**
 * GDPR Compliance Page - Section Data
 *
 * Static content for each GDPR section rendered on the compliance page.
 *
 * @since v0.9.2
 */

export interface GDPRSection {
  id: string;
  title: string;
  content: string;
}

export const sections: GDPRSection[] = [
  {
    id: 'controller',
    title: '1. Data Controller',
    content: `
      <p>CGraph acts as the <strong>data controller</strong> for personal data processed through our Service. This means we determine how and why your personal data is processed.</p>
      
      <p><strong>Contact Information:</strong></p>
      <ul>
        <li><strong>Company:</strong> CGraph, registered in Georgia</li>
        <li><strong>Founded:</strong> 2026</li>
        <li><strong>Privacy inquiries:</strong> <a href="mailto:privacy@cgraph.org">privacy@cgraph.org</a></li>
        <li><strong>Data Protection Officer:</strong> <a href="mailto:dpo@cgraph.org">dpo@cgraph.org</a></li>
        <li><strong>Security reports:</strong> <a href="mailto:security@cgraph.org">security@cgraph.org</a></li>
        <li><strong>Website:</strong> <a href="https://cgraph.org">cgraph.org</a></li>
      </ul>
      
      <p><strong>Scope of Processing:</strong> This applies to all personal data processed through our web platform, mobile applications, APIs, and related services.</p>
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
          <tr><td><strong>Forum & Communities</strong></td><td>Contract</td><td>Community features and discussions</td></tr>
          <tr><td><strong>Achievements & Cosmetics</strong></td><td>Contract</td><td>Achievements, cosmetics, Pulse reputation</td></tr>
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
          <tr><td><strong>Standard Contractual Clauses (SCCs)</strong></td><td>EU-approved contract terms with all data processors</td></tr>
          <tr><td><strong>Adequacy Decisions</strong></td><td>Transfers to countries with adequate protection as determined by the European Commission</td></tr>
          <tr><td><strong>Data Privacy Framework</strong></td><td>Where applicable, service providers certified under the EU-US Data Privacy Framework, the UK Extension, and/or the Swiss-US Data Privacy Framework</td></tr>
          <tr><td><strong>End-to-End Encryption</strong></td><td>Message content is encrypted on your device and remains protected regardless of transfer location</td></tr>
        </tbody>
      </table>
      
      <h4>Sub-processors</h4>
      <table>
        <thead><tr><th>Processor</th><th>Location</th><th>Purpose</th><th>Safeguards</th></tr></thead>
        <tbody>
          <tr><td>Cloudflare</td><td>USA/Global</td><td>CDN, DDoS Protection</td><td>SCCs, DPA, DPF Certified</td></tr>
          <tr><td>Fly.io</td><td>USA/EU</td><td>Application Hosting</td><td>SCCs, DPA</td></tr>
          <tr><td>Resend</td><td>USA</td><td>Email Delivery</td><td>SCCs, DPA</td></tr>
          <tr><td>Sentry</td><td>USA</td><td>Error Tracking</td><td>SCCs, DPA, Data Anonymization</td></tr>
          <tr><td>Stripe</td><td>USA/EU</td><td>Payment Processing</td><td>SCCs, DPA, DPF Certified, PCI DSS</td></tr>
          <tr><td>Expo</td><td>USA</td><td>Push Notifications</td><td>SCCs, DPA</td></tr>
          <tr><td>Vercel</td><td>USA/Global</td><td>Web Hosting</td><td>SCCs, DPA</td></tr>
        </tbody>
      </table>
      
      <p>We regularly review and update our sub-processor list. Material changes will be communicated via our Privacy Policy updates.</p>
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
        <li>End-to-end encryption (PQXDH + Triple Ratchet with AES-256-GCM)</li>
        <li>TLS 1.3 for all connections</li>
        <li>At-rest encryption for databases</li>
        <li>Security audits and penetration testing are planned</li>
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
      <p>California residents have additional rights under the CCPA/CPRA:</p>
      <ul>
        <li>Right to know what personal information is collected, used, shared, or sold</li>
        <li>Right to delete personal information held by businesses</li>
        <li>Right to opt-out of sale or sharing of personal information (we do not sell data)</li>
        <li>Right to non-discrimination for exercising privacy rights</li>
        <li>Right to correct inaccurate personal information</li>
        <li>Right to limit use/disclosure of sensitive personal information</li>
      </ul>
      <p>To exercise CCPA/CPRA rights, email <a href="mailto:privacy@cgraph.org">privacy@cgraph.org</a> with the subject "CCPA Request".</p>
      
      <h4>10.2 Brazil (LGPD)</h4>
      <p>Brazilian users have rights under the Lei Geral de Proteção de Dados (LGPD):</p>
      <ul>
        <li>Confirmation of data processing activities</li>
        <li>Access to all personal data we hold</li>
        <li>Correction of incomplete, inaccurate, or outdated data</li>
        <li>Anonymization, blocking, or deletion of unnecessary data</li>
        <li>Data portability to another service provider</li>
        <li>Deletion of personal data processed with consent</li>
        <li>Information about public and private entities with which data is shared</li>
        <li>Revocation of consent at any time</li>
      </ul>
      <p>Contact the ANPD (Autoridade Nacional de Proteção de Dados) at <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer">gov.br/anpd</a> for complaints.</p>
      
      <h4>10.3 Canada (PIPEDA)</h4>
      <p>Canadian users have rights under the Personal Information Protection and Electronic Documents Act (PIPEDA):</p>
      <ul>
        <li>Right to know why personal information is being collected</li>
        <li>Right to expect collection limited to stated purposes</li>
        <li>Right to access personal information held about you</li>
        <li>Right to challenge accuracy and request corrections</li>
        <li>Right to withdraw consent (subject to legal or contractual restrictions)</li>
        <li>Right to complain about handling of personal information</li>
      </ul>
      <p>File complaints with the Office of the Privacy Commissioner of Canada at <a href="https://www.priv.gc.ca" target="_blank" rel="noopener noreferrer">priv.gc.ca</a>.</p>
      
      <h4>10.4 South Africa (POPIA)</h4>
      <p>South African users have rights under the Protection of Personal Information Act (POPIA):</p>
      <ul>
        <li>Right to be notified of data collection</li>
        <li>Right to access personal information</li>
        <li>Right to request correction or deletion</li>
        <li>Right to object to processing</li>
        <li>Right to submit a complaint to the Information Regulator</li>
      </ul>
      <p>Contact the Information Regulator at <a href="https://inforegulator.org.za" target="_blank" rel="noopener noreferrer">inforegulator.org.za</a>.</p>
      
      <h4>10.5 Australia (APPs)</h4>
      <p>Australian users have rights under the Australian Privacy Principles (APPs):</p>
      <ul>
        <li>Right to know how personal information is managed</li>
        <li>Right to access personal information</li>
        <li>Right to request correction of personal information</li>
        <li>Right to complain about privacy breaches</li>
      </ul>
      <p>File complaints with the OAIC at <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer">oaic.gov.au</a>.</p>
      
      <h4>10.6 Other Jurisdictions</h4>
      <p>CGraph is committed to respecting privacy rights worldwide. If your country has specific data protection legislation not listed above, please contact <a href="mailto:privacy@cgraph.org">privacy@cgraph.org</a> and we will work to honor your rights under applicable local law.</p>
    `,
  },
];

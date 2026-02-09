/**
 * GDPRScreen - Mobile GDPR Information & Rights page
 */
import React from 'react';
import LegalScreen, { type LegalSection } from './LegalScreen';

const sections: LegalSection[] = [
  {
    title: '1. Data Controller',
    content: [
      'CGraph acts as the data controller for personal data processed through the service.',
      'For GDPR inquiries, contact our Data Protection Officer at: dpo@cgraph.app',
    ],
  },
  {
    title: '2. Legal Basis for Processing',
    content: [
      'Consent: You provide explicit consent when creating an account.',
      'Contract Performance: Processing necessary to deliver the messaging service you signed up for.',
      'Legitimate Interest: Security monitoring, fraud prevention, and service improvement (balanced against your privacy rights).',
      'Legal Obligation: Compliance with applicable laws and regulations.',
    ],
  },
  {
    title: '3. Your GDPR Rights',
    content: [
      'Right of Access (Art. 15): Request a copy of all personal data we process about you.',
      'Right to Rectification (Art. 16): Correct inaccurate or incomplete personal data.',
      'Right to Erasure (Art. 17): Request deletion of your personal data ("right to be forgotten").',
      'Right to Restriction (Art. 18): Restrict processing of your data in certain circumstances.',
      'Right to Data Portability (Art. 20): Receive your data in a machine-readable format.',
      'Right to Object (Art. 21): Object to processing based on legitimate interest.',
      'Right Not to Be Subject to Automated Decision-Making (Art. 22): We do not make automated decisions that significantly affect you.',
    ],
  },
  {
    title: '4. Data Transfers',
    content: [
      'Your data may be processed in countries outside the EEA. When this occurs, we ensure adequate safeguards through Standard Contractual Clauses (SCCs) or equivalent mechanisms.',
      'Our infrastructure providers maintain SOC 2 Type II certification and GDPR compliance.',
    ],
  },
  {
    title: '5. Data Retention',
    content: [
      'Account data: Retained until you delete your account, then permanently erased within 30 days.',
      'Messages: End-to-end encrypted; deleted when you delete them. Server-side metadata retained for up to 90 days after deletion.',
      'Analytics: Anonymized within 90 days of collection.',
      'Security logs: Retained for 12 months for fraud prevention.',
    ],
  },
  {
    title: '6. Data Breach Notification',
    content: [
      'In the event of a personal data breach that poses a risk to your rights, we will notify the relevant supervisory authority within 72 hours.',
      'If the breach is likely to result in a high risk to your rights, we will also notify you directly.',
    ],
  },
  {
    title: '7. Exercising Your Rights',
    content: [
      'To exercise any of your rights, go to Settings > Privacy > Data Export, or email dpo@cgraph.app.',
      'We will respond to your request within 30 days. Complex requests may take up to 90 days with notice.',
      'You also have the right to lodge a complaint with your local data protection authority.',
    ],
  },
];

export default function GDPRScreen() {
  return (
    <LegalScreen
      title="GDPR Information"
      lastUpdated="January 2025"
      icon="shield"
      sections={sections}
    />
  );
}

/**
 * PrivacyPolicyScreen - Mobile Privacy Policy page
 */
import React from 'react';
import LegalScreen, { type LegalSection } from './LegalScreen';

const sections: LegalSection[] = [
  {
    title: '1. Information We Collect',
    content: [
      'Account Information: Email, username, profile picture — retained until account deletion.',
      'Messages: Direct messages and group chat content — retained until deleted by user. All DMs are end-to-end encrypted.',
      'Profile Data: Bio, display name, avatar — retained until account deletion.',
      'Usage Data: Device info, IP address, analytics — retained for 90 days (anonymized).',
      'We do NOT collect: location data (GPS), contact lists, biometric data, advertising identifiers, or health data.',
    ],
  },
  {
    title: '2. End-to-End Encryption',
    content: [
      'All direct messages are end-to-end encrypted using the X3DH key agreement protocol with AES-256-GCM encryption.',
      'Only you and your conversation partner can read messages. We cannot decrypt or access message content.',
      'Encryption keys never leave your device.',
      'Metadata we can see: sender/recipient IDs, timestamps, delivery status, file sizes (not content).',
    ],
  },
  {
    title: '3. How We Use Your Information',
    content: [
      'We use collected information to: provide the service, ensure security, improve the service, send opted-in notifications, and comply with legal obligations.',
      'We do NOT sell your personal data, use it for targeted advertising, or share it with advertisers.',
    ],
  },
  {
    title: '4. Data Sharing',
    content: [
      'We share data only in limited circumstances: with service providers who assist operations (under strict data processing agreements), when required by law, or to prevent harm or fraud.',
      'We never share your encrypted message content — we cannot access it.',
    ],
  },
  {
    title: '5. Your Rights',
    content: [
      'Access: Request a copy of all data we hold about you.',
      'Correction: Update or correct your personal information.',
      'Deletion: Request complete deletion of your account and associated data.',
      'Portability: Export your data in a machine-readable format.',
      'Objection: Opt out of analytics and non-essential data processing.',
    ],
  },
  {
    title: '6. Data Retention & Security',
    content: [
      'We retain data only as long as necessary. Account data is deleted upon account deletion. Usage data is anonymized after 90 days.',
      'We use industry-standard security measures including encryption in transit (TLS 1.3), encryption at rest, regular security audits, and role-based access controls.',
    ],
  },
  {
    title: '7. Contact Us',
    content: [
      'For privacy-related questions, contact us at: privacy@cgraph.app',
      'You may also reach our Data Protection Officer for GDPR-related inquiries.',
    ],
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <LegalScreen
      title="Privacy Policy"
      lastUpdated="January 2025"
      icon="shield-checkmark"
      sections={sections}
    />
  );
}

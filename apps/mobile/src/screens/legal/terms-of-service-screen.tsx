/**
 * TermsOfServiceScreen - Mobile Terms of Service page
 */
import React from 'react';
import LegalScreen, { type LegalSection } from './legal-screen';

const sections: LegalSection[] = [
  {
    title: '1. Acceptance of Terms',
    content: [
      'By creating an account or using CGraph, you agree to be bound by these Terms of Service. If you do not agree, do not use the service.',
      'You must be at least 13 years of age to use CGraph. If you are under 18, you must have parental/guardian consent.',
    ],
  },
  {
    title: '2. Your Account',
    content: [
      'You are responsible for maintaining the security of your account credentials.',
      'One account per person. Automated account creation is prohibited.',
      'You agree to provide accurate information and keep it current.',
    ],
  },
  {
    title: '3. Acceptable Use',
    content: [
      'You agree not to: post illegal content, harass other users, spam or send unsolicited messages, impersonate others, attempt to access other users\' accounts, reverse engineer the service, or use the service for any unlawful purpose.',
      'Violation of these rules may result in account suspension or permanent ban.',
    ],
  },
  {
    title: '4. Content Ownership',
    content: [
      'You retain ownership of content you create. By posting content, you grant CGraph a limited license to display and distribute it within the service.',
      'CGraph does not claim ownership of your messages, posts, or profile content.',
      'You are responsible for the content you share and must have the right to share it.',
    ],
  },
  {
    title: '5. Intellectual Property',
    content: [
      'CGraph\'s name, logos, and service design are protected intellectual property.',
      'You may not use CGraph branding without written permission.',
    ],
  },
  {
    title: '6. Termination',
    content: [
      'You may delete your account at any time through Settings.',
      'We may suspend or terminate accounts that violate these terms, with or without prior notice.',
      'Upon termination, your right to use the service ceases immediately.',
    ],
  },
  {
    title: '7. Disclaimers & Limitation of Liability',
    content: [
      'CGraph is provided "as is" without warranties of any kind. We do not guarantee uninterrupted or error-free service.',
      'To the maximum extent permitted by law, CGraph shall not be liable for indirect, incidental, or consequential damages.',
    ],
  },
  {
    title: '8. Changes to Terms',
    content: [
      'We may update these terms from time to time. Significant changes will be communicated via in-app notification or email.',
      'Continued use after changes constitutes acceptance of the updated terms.',
    ],
  },
];

export default function TermsOfServiceScreen() {
  return (
    <LegalScreen
      title="Terms of Service"
      lastUpdated="January 2025"
      icon="document-text"
      sections={sections}
    />
  );
}

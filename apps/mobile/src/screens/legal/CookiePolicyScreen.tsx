/**
 * CookiePolicyScreen - Mobile Cookie Policy page
 */
import React from 'react';
import LegalScreen, { type LegalSection } from './LegalScreen';

const sections: LegalSection[] = [
  {
    title: '1. What Are Cookies',
    content: [
      'Cookies are small text files stored on your device when you use our service. On mobile, we use equivalent local storage mechanisms.',
      'They help us provide essential functionality, remember your preferences, and improve your experience.',
    ],
  },
  {
    title: '2. Essential Cookies',
    content: [
      'Session management: Keep you logged in across app sessions.',
      'Security tokens: Protect against unauthorized access and CSRF attacks.',
      'User preferences: Store your theme, language, and notification settings.',
      'These cookies are strictly necessary and cannot be disabled.',
    ],
  },
  {
    title: '3. Analytics Cookies',
    content: [
      'We use anonymized analytics to understand how the app is used and identify areas for improvement.',
      'Analytics data is aggregated and never linked to individual users.',
      'You can opt out of analytics in Settings > Privacy.',
    ],
  },
  {
    title: '4. What We Do NOT Use',
    content: [
      'We do not use advertising cookies, tracking pixels, or third-party marketing cookies.',
      'We do not share cookie data with advertisers or data brokers.',
    ],
  },
  {
    title: '5. Managing Your Preferences',
    content: [
      'You can manage cookie preferences through your device settings or within CGraph Settings > Privacy.',
      'Disabling essential cookies may affect app functionality.',
    ],
  },
];

export default function CookiePolicyScreen() {
  return (
    <LegalScreen
      title="Cookie Policy"
      lastUpdated="January 2025"
      icon="information-circle"
      sections={sections}
    />
  );
}

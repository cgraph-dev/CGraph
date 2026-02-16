/**
 * Landing Page Data
 *
 * All static content for the landing page extracted into a data module.
 * This keeps components lean and data easily editable.
 *
 * @since v2.1.0
 */

export interface FeatureData {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}

export interface ShowcaseCardData {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
}

export interface SecurityFeatureData {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}

export interface FooterLinkData {
  readonly label: string;
  readonly href: string;
}

export interface ValuePropData {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
  readonly highlight?: string;
}

export const WEB_APP_URL = 'https://web.cgraph.org';

export const features: readonly FeatureData[] = [
  {
    icon: '🛡️',
    title: 'Actually Encrypted',
    description:
      'PQXDH + Triple Ratchet E2EE with zero-knowledge architecture. We literally cannot read your messages.',
  },
  {
    icon: '⚡',
    title: 'Real-Time Forums',
    description:
      'Forum threads with sub-200ms message delivery. Chat and long-form discussions in the same place.',
  },
  {
    icon: '⛓️',
    title: 'Web3 Login',
    description: 'Connect your wallet and build reputation through participation. No middle-men.',
  },
  {
    icon: '👑',
    title: 'Gamified Communities',
    description:
      'XP, levels, custom titles, animated borders. Active members get recognized, not just counted.',
  },
  {
    icon: '📂',
    title: 'Encrypted File Sharing',
    description: 'Share files with E2EE. Your uploads are encrypted before they leave your device.',
  },
  {
    icon: '🌟',
    title: 'Chat + Forums in One',
    description:
      'Stop switching between Discord for chat and Reddit for discussions. Both live here.',
  },
] as const;

export const showcaseCards: readonly ShowcaseCardData[] = [
  { id: 'avatar', label: 'Avatar Borders', icon: '👤' },
  { id: 'chat', label: 'Chat Styles', icon: '💬' },
  { id: 'profile', label: 'Profile Themes', icon: '✨' },
  { id: 'title', label: 'Animated Titles', icon: '🏆' },
] as const;

export const securityFeatures: readonly SecurityFeatureData[] = [
  { icon: '🔒', title: 'End-to-End Encrypted', description: 'Messages encrypted with AES-256-GCM' },
  { icon: '🛡️', title: 'Zero-Knowledge', description: 'We cannot read your messages' },
  { icon: '🔑', title: 'Argon2 Passwords', description: 'OWASP-recommended password hashing' },
  { icon: '📱', title: 'Multi-Device Sync', description: 'Secure sync across all devices' },
  { icon: '🔐', title: '2FA Protection', description: 'TOTP-based two-factor authentication' },
  { icon: '🌐', title: 'Web3 Authentication', description: 'Sign in with your crypto wallet' },
  { icon: '⚡', title: 'Real-Time Secure', description: 'Encrypted WebSocket connections' },
  { icon: '🔏', title: 'TLS Everywhere', description: 'All data encrypted in transit' },
  { icon: '✅', title: 'GDPR Compliant', description: 'Full data export & deletion rights' },
] as const;

export const footerLinks = {
  product: [
    { label: 'Features', href: '/#features' },
    { label: 'Security', href: '/#security' },
    { label: 'Download', href: '/download' },
  ],
  resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'Blog', href: '/blog' },
    { label: 'Status', href: '/status' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
  ],
  legal: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'GDPR', href: '/gdpr' },
  ],
} as const;

/** "Why CGraph?" value propositions — replaces the old pricing section */
export const valueProps: readonly ValuePropData[] = [
  {
    icon: '🔐',
    title: 'Post-Quantum Encryption',
    description:
      "AES-256-GCM with PQXDH + Triple Ratchet (ML-KEM-768). We store encrypted blobs. That's it.",
    highlight: 'ML-KEM-768',
  },
  {
    icon: '🏛️',
    title: 'Forums Built In',
    description:
      "Threads, voting, moderation — no plugins, no third-party bolt-ons. It's part of the platform.",
    highlight: 'All-in-One',
  },
  {
    icon: '🎮',
    title: 'Gamification That Works',
    description: 'XP, achievements, quests, and leaderboards. People actually come back.',
    highlight: '50+ Rewards',
  },
  {
    icon: '⚡',
    title: 'Sub-200ms Messages',
    description: 'Elixir on BEAM. Messages arrive before you finish switching tabs.',
    highlight: '<200ms',
  },
] as const;

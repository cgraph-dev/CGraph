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
    title: 'Unbreakable Security',
    description:
      'PQXDH + Triple Ratchet E2EE with Zero-Knowledge architecture and Argon2id hashing. Your privacy is non-negotiable.',
  },
  {
    icon: '⚡',
    title: 'Lightning Discourse',
    description:
      'Real-time forum threads with sub-200ms message delivery. Experience the fastest community engine.',
  },
  {
    icon: '⛓️',
    title: 'Web3 Reputation',
    description:
      'Seamless wallet authentication and reputation-based rewards. Truly own your digital identity.',
  },
  {
    icon: '👑',
    title: 'Gamified Communities',
    description:
      'Level up with XP, custom titles, and unique animated borders. Engagement that feels like a game.',
  },
  {
    icon: '📂',
    title: 'Decentralized Vaults',
    description:
      'Peer-to-peer file sharing with permanent encrypted backups. Your data, your control.',
  },
  {
    icon: '🌟',
    title: 'Unified Hub',
    description:
      'A single platform bridging the gap between fast-paced chat and long-form community interaction.',
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
      'AES-256-GCM with PQXDH + Triple Ratchet (ML-KEM-768). Not even we can read your messages.',
    highlight: 'ML-KEM-768',
  },
  {
    icon: '🏛️',
    title: 'Built-In Community',
    description:
      'Forums, threads, and moderation tools baked in. No third-party integrations needed.',
    highlight: 'All-in-One',
  },
  {
    icon: '🎮',
    title: 'Gamification Engine',
    description: 'XP, achievements, quests, and leaderboards that drive real engagement.',
    highlight: '50+ Rewards',
  },
  {
    icon: '⚡',
    title: 'Sub-200ms Latency',
    description: 'Elixir-powered real-time engine delivering messages faster than you can blink.',
    highlight: '<200ms',
  },
] as const;

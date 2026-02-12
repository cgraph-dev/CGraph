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
    icon: '🔐',
    title: 'End-to-End Encryption',
    description:
      'Signal Protocol with X3DH key agreement and Double Ratchet algorithm. Your messages stay private.',
  },
  {
    icon: '💬',
    title: 'Real-Time Messaging',
    description:
      'Sub-200ms delivery with WebSocket channels. Feel the speed of instant communication.',
  },
  {
    icon: '🏛️',
    title: 'Forums & Communities',
    description: 'Reddit-style communities with voting, threads, and powerful moderation tools.',
  },
  {
    icon: '👥',
    title: 'Groups & Channels',
    description: 'Powerful servers with roles, permissions, and organized channel structures.',
  },
  {
    icon: '📞',
    title: 'Voice & Video Calls',
    description: 'Crystal-clear WebRTC calling with screen sharing and recording capabilities.',
  },
  {
    icon: '🎮',
    title: 'Gamification',
    description: 'Earn XP, unlock achievements, complete quests, and climb the leaderboards.',
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
    title: 'Military-Grade Encryption',
    description: 'AES-256-GCM encryption with Signal Protocol. Not even we can read your messages.',
    highlight: 'AES-256',
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

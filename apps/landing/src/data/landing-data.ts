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
  readonly details?: string;
}

export interface FooterLinkData {
  readonly label: string;
  readonly to?: string;
  readonly href?: string;
}

export interface ValuePropData {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
  readonly highlight?: string;
}

export { WEB_APP_URL } from '@/constants';

export const features: readonly FeatureData[] = [
  {
    icon: '🛡️',
    title: 'End-to-End Encrypted',
    description:
      'PQXDH + Triple Ratchet E2EE with ML-KEM-768 post-quantum security. We literally cannot read your messages.',
  },
  {
    icon: '⚡',
    title: 'Real-Time Forums',
    description:
      'Forum threads with sub-200ms delivery, 50+ customization options — chat and long-form discussions in one place.',
  },
  {
    icon: '⛓️',
    title: 'Web3 / Wallet Login',
    description:
      'SIWE (EIP-4361) standard auth with WalletConnect v2. MetaMask, Coinbase, Rainbow — 100+ wallets supported.',
  },
  {
    icon: '👑',
    title: 'Gamified Communities',
    description:
      'XP, levels, achievements, quests, battle pass, and a cosmetic shop. Active members get recognized.',
  },
  {
    icon: '📂',
    title: 'Encrypted File Sharing',
    description:
      'Share files within E2EE conversations. Attachments encrypted with AES-256-GCM at rest and in transit.',
  },
  {
    icon: '📞',
    title: 'Voice & Video Calls',
    description:
      'Group calls with screen sharing, E2EE indicators, and voice channels — powered by LiveKit SFU.',
  },
  {
    icon: '💰',
    title: 'Creator Monetization',
    description:
      'Stripe Connect integration lets creators earn from paid forum subscriptions. 85% revenue share.',
  },
  {
    icon: '⭐',
    title: 'Premium Subscriptions',
    description:
      'Free, Premium ($14.99/mo), and Enterprise ($29.99/mo) tiers with tiered features and limits.',
  },
  {
    icon: '⏰',
    title: 'Scheduled Messages & Rich Media',
    description:
      'Schedule messages, send GIFs via Tenor, record voice messages, and embed rich media previews.',
  },
  {
    icon: '🤖',
    title: 'AI-Powered Moderation',
    description:
      'Automated content moderation pipeline with configurable actions, audit logging, and human escalation.',
  },
  {
    icon: '📱',
    title: 'Mobile-First',
    description:
      'Native iOS and Android apps built with React Native + Expo. Full parity with the web experience.',
  },
  {
    icon: '🔍',
    title: 'Real-Time Search',
    description:
      'Meilisearch for instant full-text search across messages, users, forums, and threads.',
  },
] as const;

export const showcaseCards: readonly ShowcaseCardData[] = [
  { id: 'avatar', label: 'Avatar Borders', icon: '👤' },
  { id: 'chat', label: 'Chat Styles', icon: '💬' },
  { id: 'profile', label: 'Profile Themes', icon: '✨' },
  { id: 'title', label: 'Animated Titles', icon: '🏆' },
] as const;

export const securityFeatures: readonly SecurityFeatureData[] = [
  {
    icon: '🔒',
    title: 'End-to-End Encrypted',
    description:
      'Every message is encrypted on-device before transport, so plaintext never traverses the network.',
    details: 'AES-256-GCM payloads with authenticated encryption and tamper detection.',
  },
  {
    icon: '🛡️',
    title: 'Zero-Knowledge',
    description:
      'CGraph servers operate on encrypted blobs and metadata controls, not your readable conversation content.',
    details:
      'Key material stays client-side, and message access is enforced by cryptographic ownership.',
  },
  {
    icon: '🔑',
    title: 'Argon2 Passwords',
    description:
      'Credential storage follows OWASP-aligned hashing strategy with memory-hard parameters to resist brute force.',
    details:
      'Argon2id with tuned cost factors and hardened auth endpoints against credential stuffing.',
  },
  {
    icon: '📱',
    title: 'Multi-Device Sync',
    description:
      'You can securely sync across web and mobile clients while preserving encryption boundaries per device.',
    details:
      'Device-aware key flows keep cross-platform parity without exposing raw message content.',
  },
  {
    icon: '🔐',
    title: '2FA Protection',
    description:
      'Optional TOTP-based second factor adds a strong layer of account protection beyond passwords.',
    details:
      'Authentication gates can enforce second-factor verification for sensitive account operations.',
  },
  {
    icon: '🌐',
    title: 'Web3 Authentication',
    description:
      'SIWE (EIP-4361) wallet sign-in with WalletConnect v2 supports decentralized identity flows.',
    details:
      'Challenge/response with SIWE standard verification confirms wallet ownership without exposing private keys.',
  },
  {
    icon: '⚡',
    title: 'Real-Time Secure',
    description:
      'Realtime channels are designed for low-latency messaging without weakening transport security.',
    details: 'Secure WebSocket flows with backpressure handling for 15K+ concurrent connections.',
  },
  {
    icon: '🔏',
    title: 'TLS Everywhere',
    description:
      'All client-server traffic is encrypted in transit to prevent interception on hostile networks.',
    details: 'Strict HTTPS/TLS handling protects API, media, and session communication paths.',
  },
  {
    icon: '🤖',
    title: 'AI Content Moderation',
    description:
      'Automated moderation pipeline with configurable actions, real-time audit logging, and human escalation.',
    details:
      'Per-tier rate limiting, auto-action rules, and comprehensive audit trail for compliance.',
  },
  {
    icon: '✅',
    title: 'GDPR Compliant',
    description:
      'Users get clear controls for export, retention, and account deletion in privacy-sensitive workflows.',
    details:
      'Data rights flows are built into product operations rather than external afterthoughts.',
  },
] as const;

/** Footer navigation links — single source of truth shared with Footer.tsx */
export const footerLinks = {
  product: [
    { label: 'Features', to: '/#features' },
    { label: 'Security', to: '/#security' },
    { label: 'Download', to: '/download' },
  ],
  resources: [
    { label: 'Documentation', to: '/docs' },
    { label: 'API Reference', to: '/docs' },
    { label: 'Status', to: '/status' },
    { label: 'Blog', to: '/blog' },
  ],
  company: [
    { label: 'About', to: '/about' },
    { label: 'Careers', to: '/careers' },
    { label: 'Contact', to: '/contact' },
    { label: 'Press', to: '/press' },
  ],
  legal: [
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms of Service', to: '/terms' },
    { label: 'Cookie Policy', to: '/cookies' },
    { label: 'GDPR', to: '/gdpr' },
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

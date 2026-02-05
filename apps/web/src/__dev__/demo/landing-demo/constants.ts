/**
 * LandingDemo Constants & Data
 */

import type { Feature, Stat, PricingTier, FooterLinks, SecurityFeature } from './types';

export const features: Feature[] = [
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
];

export const stats: Stat[] = [
  { value: '10K+', label: 'Active Creators', icon: '🎨' },
  { value: '50K+', label: 'Communities', icon: '🌐' },
  { value: '1M+', label: 'Daily Messages', icon: '💬' },
  { value: '∞', label: 'Possibilities', icon: '✨' },
];

export const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Everything to get started',
    features: [
      'End-to-end encrypted messaging',
      'Join unlimited forums',
      'Create 1 forum',
      '1-on-1 voice & video calls',
      'Web3 wallet authentication',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Premium',
    price: '$9',
    period: '/month',
    description: 'For power users',
    features: [
      'Everything in Free',
      'Create up to 5 forums',
      'Group calls up to 25 people',
      'Priority customer support',
      'Advanced profile customization',
    ],
    cta: 'Start Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For organizations',
    features: [
      'Everything in Premium',
      'Custom domain & branding',
      'SSO/SAML integration',
      'Admin dashboard & controls',
      'Dedicated account manager',
      'Custom SLA & uptime guarantee',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export const footerLinks: FooterLinks = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'Security', href: '#security' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Download', href: '/login' },
  ],
  resources: [
    { label: 'Documentation', href: 'https://docs.cgraph.org', external: true },
    { label: 'API Reference', href: 'https://docs.cgraph.org/api', external: true },
    { label: 'Status', href: '/status' },
    { label: 'Blog', href: 'https://blog.cgraph.org', external: true },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
    { label: 'Press', href: '/press' },
  ],
  legal: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'GDPR', href: '/gdpr' },
  ],
};

export const securityFeatures: SecurityFeature[] = [
  { icon: '🔒', title: 'End-to-End Encrypted', description: 'Messages encrypted with AES-256-GCM' },
  { icon: '🛡️', title: 'Zero-Knowledge', description: 'We cannot read your messages' },
  { icon: '🔑', title: 'Argon2 Passwords', description: 'OWASP-recommended password hashing' },
  { icon: '📱', title: 'Multi-Device Sync', description: 'Secure sync across all devices' },
  { icon: '🔐', title: '2FA Protection', description: 'TOTP-based two-factor authentication' },
  { icon: '🌐', title: 'Web3 Authentication', description: 'Sign in with your crypto wallet' },
  { icon: '⚡', title: 'Real-Time Secure', description: 'Encrypted WebSocket connections' },
  { icon: '🔏', title: 'TLS Everywhere', description: 'All data encrypted in transit' },
  { icon: '✅', title: 'GDPR Compliant', description: 'Full data export & deletion rights' },
];

/**
 * LandingDemoWorkshop - Constants & Data
 */

import type { Feature, Stat, PricingTier, FooterLinks, SecurityFeature } from './types';

// =============================================================================
// FEATURES DATA
// =============================================================================

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
    description: 'Discord-style servers with roles, permissions, and organized channel structures.',
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

// =============================================================================
// STATS DATA
// =============================================================================

export const stats: Stat[] = [
  { value: '99.9%', label: 'Uptime' },
  { value: '<200', label: 'ms Latency' },
  { value: '256-bit', label: 'Encryption' },
  { value: '50+', label: 'Features' },
];

// =============================================================================
// PRICING DATA
// =============================================================================

export const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Everything to get started',
    features: [
      'Unlimited messaging',
      'Join 10 forums',
      'Create 3 groups',
      '1-on-1 calls',
      '100MB storage',
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
      'Unlimited forums',
      'Group calls (25)',
      '10GB storage',
      'Priority support',
    ],
    cta: 'Start Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For organizations',
    features: ['Everything in Premium', 'Custom branding', 'SSO/SAML', 'Admin controls', 'SLA'],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

// =============================================================================
// FOOTER LINKS
// =============================================================================

export const footerLinks: FooterLinks = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'Security', href: '#security' },
    { label: 'Pricing', href: '#pricing' },
  ],
  resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'API', href: '/api' },
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
    { label: 'GDPR', href: '/gdpr' },
  ],
};

// =============================================================================
// SECURITY FEATURES
// =============================================================================

export const securityFeatures: SecurityFeature[] = [
  { icon: '🔒', title: 'Zero-Knowledge', description: 'We cannot read your messages' },
  { icon: '🛡️', title: 'X3DH Protocol', description: 'Industry-standard key exchange' },
  { icon: '🔑', title: 'Double Ratchet', description: 'Forward secrecy per message' },
  { icon: '📱', title: 'Multi-Device', description: 'Seamless sync everywhere' },
  { icon: '🔏', title: 'HTTP-Only', description: 'XSS-resistant sessions' },
  { icon: '✅', title: 'Open Source', description: 'Transparent & auditable' },
  { icon: '⚡', title: 'Zero Latency', description: 'Real-time message delivery' },
  { icon: '🌐', title: 'Global CDN', description: 'Fast anywhere in the world' },
  { icon: '🧩', title: 'Modular Design', description: 'Extensible architecture' },
];

// =============================================================================
// ANIMATION CONSTANTS
// =============================================================================

export const STAR_COUNT = 50;
export const ENERGY_PARTICLE_COUNT = 30;
export const BRAND_PARTICLE_COUNT = 12;
export const ORB_COUNT = 5;

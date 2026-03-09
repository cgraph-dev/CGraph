/**
 * Chat Customization Constants
 * Mock data and constants for chat customization
 */

import type { BubbleStyle, MessageEffect } from './types';

// ==================== BUBBLE STYLES ====================

export const BUBBLE_STYLES: BubbleStyle[] = [
  {
    id: 'bubble-default',
    name: 'Default Rounded',
    description: 'Classic rounded corners',
    borderRadius: '1rem',
    shadow: '0 2px 8px rgba(0,0,0,0.1)',
    unlocked: true,
  },
  {
    id: 'bubble-pill',
    name: 'Pill Shape',
    description: 'Fully rounded pill style',
    borderRadius: '9999px',
    shadow: '0 2px 8px rgba(0,0,0,0.1)',
    unlocked: true,
  },
  {
    id: 'bubble-sharp',
    name: 'Sharp Corners',
    description: 'No border radius',
    borderRadius: '0',
    shadow: '0 2px 8px rgba(0,0,0,0.1)',
    unlocked: true,
  },
  {
    id: 'bubble-asymmetric',
    name: 'Asymmetric',
    description: 'Offset corner bubbles',
    borderRadius: '0.75rem 0.75rem 0.75rem 0',
    shadow: '0 1px 3px rgba(0,0,0,0.1)',
    unlocked: true,
  },
  {
    id: 'bubble-aero',
    name: 'Aero',
    description: 'Smooth rounded bubbles',
    borderRadius: '1.25rem',
    shadow: '0 1px 2px rgba(0,0,0,0.1)',
    unlocked: true,
  },
  {
    id: 'bubble-compact',
    name: 'Compact',
    description: 'Tight corner bubbles',
    borderRadius: '0.5rem 0.5rem 0.5rem 0',
    shadow: '0 1px 4px rgba(0,0,0,0.12)',
    unlocked: true,
  },
  {
    id: 'bubble-glass',
    name: 'Glassmorphic',
    description: 'Frosted glass effect',
    borderRadius: '1rem',
    shadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    unlocked: false,
    unlockRequirement: 'Reach Level 15',
  },
  {
    id: 'bubble-neon',
    name: 'Neon Glow',
    description: 'Glowing neon borders',
    borderRadius: '1rem',
    shadow: '0 0 20px rgba(139, 92, 246, 0.5)',
    unlocked: false,
    unlockRequirement: 'Send 1000 Messages',
    isPremium: true,
  },
  {
    id: 'bubble-comic',
    name: 'Comic Book',
    description: 'Comic-style speech bubble',
    borderRadius: '2rem 2rem 2rem 0.2rem',
    shadow: '4px 4px 0 rgba(0,0,0,0.2)',
    unlocked: false,
    unlockRequirement: 'Premium Tier',
    isPremium: true,
  },
];

// ==================== MESSAGE EFFECTS ====================

export const MESSAGE_EFFECTS: MessageEffect[] = [
  {
    id: 'effect-none',
    name: 'No Animation',
    description: 'Instant appearance',
    animation: 'none',
    unlocked: true,
  },
  {
    id: 'effect-fade',
    name: 'Fade In',
    description: 'Smooth fade entrance',
    animation: 'fade',
    unlocked: true,
  },
  {
    id: 'effect-slide',
    name: 'Slide In',
    description: 'Slide from side',
    animation: 'slide',
    unlocked: true,
  },
  {
    id: 'effect-bounce',
    name: 'Bounce',
    description: 'Bouncy entrance',
    animation: 'bounce',
    unlocked: true,
  },
  {
    id: 'effect-scale',
    name: 'Scale Pop',
    description: 'Pop in with scale',
    animation: 'scale',
    unlocked: false,
    unlockRequirement: 'Reach Level 10',
  },
  {
    id: 'effect-rotate',
    name: 'Rotate In',
    description: 'Spinning entrance',
    animation: 'rotate',
    unlocked: false,
    unlockRequirement: 'Send 500 Messages',
  },
  {
    id: 'effect-typewriter',
    name: 'Typewriter',
    description: 'Letter-by-letter reveal',
    animation: 'typewriter',
    unlocked: false,
    unlockRequirement: 'Premium Tier',
  },
  {
    id: 'effect-glitch',
    name: 'Glitch Effect',
    description: 'Digital glitch entrance',
    animation: 'glitch',
    unlocked: false,
    unlockRequirement: 'Reach Level 25',
  },
];

// ==================== ENTRANCE ANIMATIONS ====================

export const ENTRANCE_ANIMATIONS = ['slide', 'fade', 'scale', 'bounce', 'flip', 'none'] as const;

export type EntranceAnimationType = (typeof ENTRANCE_ANIMATIONS)[number];

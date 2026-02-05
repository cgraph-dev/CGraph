/**
 * Constants and mock data for IdentityCustomization module
 */

import type { Border, Title, Badge, ProfileLayout, RarityOption, Rarity } from './types';
import type { AvatarBorderType } from '@/stores/customization';

export const RARITIES: RarityOption[] = [
  { value: 'common', label: 'Common', color: 'text-gray-400' },
  { value: 'rare', label: 'Rare', color: 'text-blue-400' },
  { value: 'epic', label: 'Epic', color: 'text-purple-400' },
  { value: 'legendary', label: 'Legendary', color: 'text-yellow-400' },
  { value: 'mythic', label: 'Mythic', color: 'text-pink-400' },
];

export const MOCK_BORDERS: Border[] = [
  // Common borders
  {
    id: 'b1',
    name: 'Classic Silver',
    rarity: 'common',
    animation: 'none',
    colors: ['#C0C0C0'],
    unlocked: true,
  },
  {
    id: 'b2',
    name: 'Basic Gold',
    rarity: 'common',
    animation: 'none',
    colors: ['#FFD700'],
    unlocked: true,
  },
  {
    id: 'b3',
    name: 'Simple Blue',
    rarity: 'common',
    animation: 'none',
    colors: ['#4169E1'],
    unlocked: true,
  },
  {
    id: 'b4',
    name: 'Forest Green',
    rarity: 'common',
    animation: 'none',
    colors: ['#228B22'],
    unlocked: true,
  },
  // Rare borders
  {
    id: 'b5',
    name: 'Pulsing Cyan',
    rarity: 'rare',
    animation: 'pulse',
    colors: ['#00FFFF', '#0080FF'],
    unlocked: true,
  },
  {
    id: 'b6',
    name: 'Rotating Purple',
    rarity: 'rare',
    animation: 'rotate',
    colors: ['#9B59B6', '#E74C3C'],
    unlocked: true,
  },
  {
    id: 'b7',
    name: 'Neon Pink',
    rarity: 'rare',
    animation: 'glow',
    colors: ['#FF1493', '#FF69B4'],
    unlocked: false,
    unlockRequirement: 'Reach Level 10',
  },
  {
    id: 'b8',
    name: 'Electric Yellow',
    rarity: 'rare',
    animation: 'spark',
    colors: ['#FFFF00', '#FFD700'],
    unlocked: true,
  },
  // Epic borders
  {
    id: 'b9',
    name: 'Cosmic Gradient',
    rarity: 'epic',
    animation: 'gradient-rotate',
    colors: ['#667eea', '#764ba2', '#f093fb'],
    unlocked: true,
  },
  {
    id: 'b10',
    name: 'Fire Blaze',
    rarity: 'epic',
    animation: 'flame',
    colors: ['#FF4500', '#FF6347', '#FFD700'],
    unlocked: false,
    unlockRequirement: 'Complete 50 Quests',
  },
  {
    id: 'b11',
    name: 'Ice Crystal',
    rarity: 'epic',
    animation: 'shimmer',
    colors: ['#00CED1', '#4682B4', '#FFFFFF'],
    unlocked: true,
  },
  {
    id: 'b12',
    name: 'Toxic Waste',
    rarity: 'epic',
    animation: 'drip',
    colors: ['#39FF14', '#00FF00', '#7FFF00'],
    unlocked: false,
    unlockRequirement: 'Win 25 PvP Matches',
  },
  // Legendary borders
  {
    id: 'b13',
    name: 'Dragon Soul',
    rarity: 'legendary',
    animation: 'particles',
    colors: ['#DC143C', '#FF4500', '#FFD700'],
    unlocked: false,
    unlockRequirement: 'Reach Level 50',
  },
  {
    id: 'b14',
    name: 'Celestial Aurora',
    rarity: 'legendary',
    animation: 'aurora',
    colors: ['#9B30FF', '#00BFFF', '#00FF7F'],
    unlocked: false,
    unlockRequirement: 'Collect 100 Achievements',
  },
  {
    id: 'b15',
    name: 'Shadow Void',
    rarity: 'legendary',
    animation: 'void',
    colors: ['#000000', '#4B0082', '#8B00FF'],
    unlocked: true,
  },
  {
    id: 'b16',
    name: 'Golden Phoenix',
    rarity: 'legendary',
    animation: 'fire',
    colors: ['#FFD700', '#FF8C00', '#FF4500'],
    unlocked: false,
    unlockRequirement: 'Complete all achievements',
  },
  // Mythic borders
  {
    id: 'b17',
    name: 'Void Walker',
    rarity: 'mythic',
    animation: 'void',
    colors: ['#000000', '#1a0033', '#3d0066', '#5c0099'],
    unlocked: false,
    unlockRequirement: 'Exclusive Season 1 Reward',
  },
  {
    id: 'b18',
    name: 'Cosmic Deity',
    rarity: 'mythic',
    animation: 'aurora',
    colors: ['#FFD700', '#FF00FF', '#00FFFF', '#7FFF00'],
    unlocked: false,
    unlockRequirement: 'Reach Top 10 Leaderboard',
  },
];

export const MOCK_TITLES: Title[] = [
  // Static titles
  {
    id: 't1',
    name: 'Newcomer',
    animationType: 'none',
    gradient: 'text-gray-400',
    unlocked: true,
  },
  {
    id: 't2',
    name: 'Explorer',
    animationType: 'none',
    gradient: 'text-blue-400',
    unlocked: true,
  },
  // Animated titles
  {
    id: 't3',
    name: 'Rising Star',
    animationType: 'pulse',
    gradient: 'bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent',
    unlocked: true,
  },
  {
    id: 't4',
    name: 'Flame Keeper',
    animationType: 'glow',
    gradient: 'bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent',
    unlocked: true,
  },
  {
    id: 't5',
    name: 'Shadow Master',
    animationType: 'fade',
    gradient: 'bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent',
    unlocked: false,
    unlockRequirement: 'Reach Level 25',
  },
  {
    id: 't6',
    name: 'Ice Queen',
    animationType: 'shimmer',
    gradient: 'bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent',
    unlocked: false,
    unlockRequirement: 'Complete Winter Event',
  },
  {
    id: 't7',
    name: 'Digital Phantom',
    animationType: 'glitch',
    gradient: 'bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent',
    unlocked: true,
  },
  {
    id: 't8',
    name: 'Rainbow Champion',
    animationType: 'rainbow',
    gradient:
      'bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 bg-clip-text text-transparent',
    unlocked: false,
    unlockRequirement: 'Win 100 Matches',
  },
  {
    id: 't9',
    name: 'Typing Master',
    animationType: 'typing',
    gradient: 'text-white',
    unlocked: true,
  },
  {
    id: 't10',
    name: 'Ocean Wave',
    animationType: 'wave',
    gradient: 'bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent',
    unlocked: true,
  },
  {
    id: 't11',
    name: 'Spring Hopper',
    animationType: 'bounce',
    gradient: 'bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent',
    unlocked: true,
  },
  {
    id: 't12',
    name: 'Neon Dreamer',
    animationType: 'neon-flicker',
    gradient: 'bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent',
    unlocked: false,
    unlockRequirement: 'Purchase Premium',
  },
];

export const MOCK_BADGES: Badge[] = [
  // Community badges
  {
    id: 'badge1',
    name: 'First Steps',
    description: 'Created your first post',
    icon: '🎉',
    rarity: 'common',
    unlocked: true,
  },
  {
    id: 'badge2',
    name: 'Helpful Hand',
    description: 'Helped 10 community members',
    icon: '🤝',
    rarity: 'common',
    unlocked: true,
  },
  {
    id: 'badge3',
    name: 'Social Butterfly',
    description: 'Made 50 friends',
    icon: '🦋',
    rarity: 'rare',
    unlocked: true,
  },
  {
    id: 'badge4',
    name: 'Forum Legend',
    description: 'Created 100 popular posts',
    icon: '📜',
    rarity: 'epic',
    unlocked: false,
    unlockRequirement: 'Create 100 posts with 10+ likes',
  },
  // Achievement badges
  {
    id: 'badge5',
    name: 'Speed Demon',
    description: 'Completed a challenge in record time',
    icon: '⚡',
    rarity: 'rare',
    unlocked: true,
  },
  {
    id: 'badge6',
    name: 'Perfectionist',
    description: 'Achieved 100% completion',
    icon: '✨',
    rarity: 'epic',
    unlocked: false,
    unlockRequirement: 'Complete all quests at 100%',
  },
  {
    id: 'badge7',
    name: 'Champion',
    description: 'Won a community tournament',
    icon: '🏆',
    rarity: 'legendary',
    unlocked: false,
    unlockRequirement: 'Win a community tournament',
  },
  {
    id: 'badge8',
    name: 'Undefeated',
    description: '50 win streak',
    icon: '🔥',
    rarity: 'legendary',
    unlocked: false,
    unlockRequirement: 'Achieve 50 consecutive wins',
  },
  // Special badges
  {
    id: 'badge9',
    name: 'Beta Tester',
    description: 'Joined during beta',
    icon: '🧪',
    rarity: 'epic',
    unlocked: true,
  },
  {
    id: 'badge10',
    name: 'Founder',
    description: 'Original community founder',
    icon: '👑',
    rarity: 'mythic',
    unlocked: false,
    unlockRequirement: 'Founder exclusive',
  },
  {
    id: 'badge11',
    name: 'Night Owl',
    description: 'Active during late hours',
    icon: '🦉',
    rarity: 'common',
    unlocked: true,
  },
  {
    id: 'badge12',
    name: 'Early Bird',
    description: 'Active during early hours',
    icon: '🐦',
    rarity: 'common',
    unlocked: true,
  },
];

export const PROFILE_LAYOUTS: ProfileLayout[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional centered layout with avatar on top',
    preview: 'classic',
    unlocked: true,
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Split panel design with side avatar',
    preview: 'modern',
    unlocked: true,
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Space-efficient single row layout',
    preview: 'compact',
    unlocked: true,
  },
  {
    id: 'showcase',
    name: 'Showcase',
    description: 'Emphasizes badges and achievements',
    preview: 'showcase',
    unlocked: true,
  },
  {
    id: 'gaming',
    name: 'Gaming',
    description: 'Stats-focused with progress bars',
    preview: 'gaming',
    unlocked: true,
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clean business-style layout',
    preview: 'professional',
    unlocked: false,
  },
  {
    id: 'artistic',
    name: 'Artistic',
    description: 'Creative asymmetric design',
    preview: 'artistic',
    unlocked: false,
  },
];

/**
 * Get rarity color class
 */
export function getRarityColor(rarity: Rarity): string {
  const colors: Record<Rarity, string> = {
    common: 'text-gray-400',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-yellow-400',
    mythic: 'text-pink-400',
  };
  return colors[rarity];
}

/**
 * Map legacy border animation types to store AvatarBorderType
 */
export function getV2BorderType(animation: string): AvatarBorderType {
  const animationToV2: Record<string, AvatarBorderType> = {
    none: 'none',
    pulse: 'pulse',
    rotate: 'rotate',
    glow: 'glow',
    spark: 'electric',
    'gradient-rotate': 'rotate',
    flame: 'fire',
    fire: 'fire',
    shimmer: 'ice',
    drip: 'ice',
    particles: 'legendary',
    aurora: 'legendary',
    void: 'mythic',
    electric: 'electric',
  };
  return animationToV2[animation] || 'none';
}

/**
 * Legacy border ID to V2 type mapping for mock borders
 */
export const LEGACY_BORDER_ID_TO_V2_TYPE: Record<string, AvatarBorderType> = {
  b1: 'none',
  b2: 'none',
  b3: 'none',
  b4: 'none',
  b5: 'pulse',
  b6: 'rotate',
  b7: 'glow',
  b8: 'electric',
  b9: 'rotate',
  b10: 'fire',
  b11: 'ice',
  b12: 'glow',
  b13: 'fire',
  b14: 'legendary',
  b15: 'mythic',
  b16: 'fire',
  b17: 'mythic',
  b18: 'legendary',
};

/**
 * Titles Collection Data
 *
 * 30+ animated titles with various effects and unlock requirements.
 * Each title has animation type, gradient styling, and rarity.
 */

export type TitleRarity = 'free' | 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type TitleAnimationType =
  | 'none'
  | 'fade'
  | 'glow'
  | 'pulse'
  | 'shimmer'
  | 'rainbow'
  | 'typing'
  | 'glitch'
  | 'wave'
  | 'bounce'
  | 'neon-flicker';

export interface TitleDefinition {
  id: string;
  name: string;
  displayName: string; // The actual title text shown to users
  rarity: TitleRarity;
  animationType: TitleAnimationType;
  gradient: string; // Tailwind gradient classes
  colors: string[]; // Primary colors for animation effects
  isPremium: boolean;
  unlocked: boolean;
  unlockRequirement?: string;
  unlockLevel?: number;
  description: string;
}

export interface TitleCategory {
  id: string;
  name: string;
  icon: string;
  titles: TitleDefinition[];
}

// Rarity colors for titles
export const TITLE_RARITY_COLORS: Record<TitleRarity, { bg: string; text: string; glow: string }> =
  {
    free: { bg: 'bg-gray-600/50', text: 'text-gray-300', glow: '#9ca3af' },
    common: { bg: 'bg-gray-500/50', text: 'text-gray-200', glow: '#d1d5db' },
    rare: { bg: 'bg-blue-600/50', text: 'text-blue-300', glow: '#60a5fa' },
    epic: { bg: 'bg-purple-600/50', text: 'text-purple-300', glow: '#a78bfa' },
    legendary: { bg: 'bg-yellow-600/50', text: 'text-yellow-300', glow: '#fbbf24' },
    mythic: {
      bg: 'bg-gradient-to-r from-pink-500 to-purple-500',
      text: 'text-white',
      glow: '#ec4899',
    },
  };

// ==================== STARTER TITLES ====================
const STARTER_TITLES: TitleDefinition[] = [
  {
    id: 'title-newbie',
    name: 'Newbie',
    displayName: 'Newbie',
    rarity: 'free',
    animationType: 'none',
    gradient: 'text-gray-400',
    colors: ['#9ca3af'],
    isPremium: false,
    unlocked: true,
    description: 'Everyone starts somewhere',
  },
  {
    id: 'title-member',
    name: 'Member',
    displayName: 'Member',
    rarity: 'free',
    animationType: 'none',
    gradient: 'text-gray-300',
    colors: ['#d1d5db'],
    isPremium: false,
    unlocked: true,
    description: 'Official community member',
  },
  {
    id: 'title-adventurer',
    name: 'Adventurer',
    displayName: 'Adventurer',
    rarity: 'common',
    animationType: 'fade',
    gradient: 'text-blue-400',
    colors: ['#60a5fa'],
    isPremium: false,
    unlocked: true,
    description: 'Ready to explore',
  },
];

// ==================== ACHIEVEMENT TITLES ====================
const ACHIEVEMENT_TITLES: TitleDefinition[] = [
  {
    id: 'title-veteran',
    name: 'Veteran',
    displayName: 'Veteran',
    rarity: 'rare',
    animationType: 'glow',
    gradient: 'bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent',
    colors: ['#a78bfa', '#f472b6'],
    isPremium: false,
    unlocked: true,
    description: 'A seasoned community member',
  },
  {
    id: 'title-elite',
    name: 'Elite',
    displayName: 'Elite',
    rarity: 'epic',
    animationType: 'pulse',
    gradient: 'bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent',
    colors: ['#fbbf24', '#fb923c'],
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Reach Level 25',
    description: 'Top-tier player status',
  },
  {
    id: 'title-champion',
    name: 'Champion',
    displayName: 'Champion',
    rarity: 'epic',
    animationType: 'shimmer',
    gradient: 'bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent',
    colors: ['#fbbf24', '#fde047'],
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Win 50 matches',
    description: 'Proven combat excellence',
  },
  {
    id: 'title-legend',
    name: 'Legend',
    displayName: 'Legend',
    rarity: 'legendary',
    animationType: 'rainbow',
    gradient:
      'bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 bg-clip-text text-transparent',
    colors: ['#ef4444', '#eab308', '#22c55e'],
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Complete 100 Quests',
    description: 'Stories will be told of your deeds',
  },
  {
    id: 'title-mythic-hero',
    name: 'Mythic Hero',
    displayName: 'Mythic Hero',
    rarity: 'mythic',
    animationType: 'rainbow',
    gradient:
      'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent',
    colors: ['#a855f7', '#ec4899', '#ef4444'],
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Prestige 5',
    description: 'Transcended mortal limits',
  },
];

// ==================== ACTIVITY TITLES ====================
const ACTIVITY_TITLES: TitleDefinition[] = [
  {
    id: 'title-chatterbox',
    name: 'Chatterbox',
    displayName: 'Chatterbox',
    rarity: 'common',
    animationType: 'typing',
    gradient: 'text-green-400',
    colors: ['#4ade80'],
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Send 1,000 messages',
    description: 'Never runs out of things to say',
  },
  {
    id: 'title-forum-master',
    name: 'Forum Master',
    displayName: 'Forum Master',
    rarity: 'rare',
    animationType: 'glow',
    gradient: 'bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent',
    colors: ['#60a5fa', '#22d3ee'],
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Create 100 forum posts',
    description: 'Knowledge sharer extraordinaire',
  },
  {
    id: 'title-social-butterfly',
    name: 'Social Butterfly',
    displayName: 'Social Butterfly',
    rarity: 'rare',
    animationType: 'wave',
    gradient: 'bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent',
    colors: ['#f472b6', '#a78bfa'],
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Add 100 friends',
    description: 'Everyone knows your name',
  },
  {
    id: 'title-night-owl',
    name: 'Night Owl',
    displayName: 'Night Owl',
    rarity: 'common',
    animationType: 'fade',
    gradient: 'text-indigo-400',
    colors: ['#818cf8'],
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Active after midnight 30 times',
    description: 'Burns the midnight oil',
  },
  {
    id: 'title-early-bird',
    name: 'Early Bird',
    displayName: 'Early Bird',
    rarity: 'common',
    animationType: 'fade',
    gradient: 'text-orange-400',
    colors: ['#fb923c'],
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Active before 6 AM 30 times',
    description: 'Catches the worm',
  },
];

// ==================== SPECIAL TITLES ====================
const SPECIAL_TITLES: TitleDefinition[] = [
  {
    id: 'title-founder',
    name: 'Founder',
    displayName: 'Founder',
    rarity: 'legendary',
    animationType: 'shimmer',
    gradient:
      'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent',
    colors: ['#fcd34d', '#fbbf24'],
    isPremium: true,
    unlocked: false,
    unlockRequirement: 'Founding member badge',
    description: 'Original community founder',
  },
  {
    id: 'title-beta-tester',
    name: 'Beta Tester',
    displayName: 'Beta Tester',
    rarity: 'epic',
    animationType: 'glitch',
    gradient: 'bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent',
    colors: ['#4ade80', '#34d399'],
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Join beta program',
    description: 'Helped shape the future',
  },
  {
    id: 'title-vip',
    name: 'VIP',
    displayName: 'VIP',
    rarity: 'epic',
    animationType: 'glow',
    gradient: 'bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent',
    colors: ['#fbbf24', '#f59e0b'],
    isPremium: true,
    unlocked: false,
    unlockRequirement: 'Premium subscription',
    description: 'Very Important Player',
  },
  {
    id: 'title-moderator',
    name: 'Moderator',
    displayName: 'Moderator',
    rarity: 'rare',
    animationType: 'pulse',
    gradient: 'text-green-500',
    colors: ['#22c55e'],
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Staff appointment',
    description: 'Community guardian',
  },
  {
    id: 'title-admin',
    name: 'Admin',
    displayName: 'Administrator',
    rarity: 'legendary',
    animationType: 'neon-flicker',
    gradient: 'bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent',
    colors: ['#ef4444', '#f97316'],
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Staff appointment',
    description: 'Supreme authority',
  },
];

// ==================== GAMING TITLES ====================
const GAMING_TITLES: TitleDefinition[] = [
  {
    id: 'title-speedrunner',
    name: 'Speedrunner',
    displayName: 'Speedrunner',
    rarity: 'epic',
    animationType: 'wave',
    gradient: 'bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent',
    colors: ['#22d3ee', '#3b82f6'],
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Complete speedrun challenge',
    description: 'Gotta go fast',
  },
  {
    id: 'title-completionist',
    name: 'Completionist',
    displayName: 'Completionist',
    rarity: 'legendary',
    animationType: 'shimmer',
    gradient:
      'bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent',
    colors: ['#a78bfa', '#f472b6', '#f87171'],
    isPremium: false,
    unlocked: false,
    unlockRequirement: '100% all achievements',
    description: 'Leaves nothing undone',
  },
  {
    id: 'title-pvp-master',
    name: 'PvP Master',
    displayName: 'PvP Master',
    rarity: 'epic',
    animationType: 'pulse',
    gradient: 'bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent',
    colors: ['#ef4444', '#f97316'],
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Win 500 PvP matches',
    description: 'Fear the arena',
  },
  {
    id: 'title-collector',
    name: 'Collector',
    displayName: 'Collector',
    rarity: 'rare',
    animationType: 'glow',
    gradient: 'bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent',
    colors: ['#fbbf24', '#eab308'],
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Collect 50 unique items',
    description: 'Treasure hunter',
  },
  {
    id: 'title-no-lifer',
    name: 'No-Lifer',
    displayName: 'No-Lifer',
    rarity: 'legendary',
    animationType: 'glitch',
    gradient:
      'bg-gradient-to-r from-gray-400 via-purple-500 to-gray-400 bg-clip-text text-transparent',
    colors: ['#9ca3af', '#a855f7'],
    isPremium: false,
    unlocked: false,
    unlockRequirement: '1,000 hours playtime',
    description: "Touch grass? What's that?",
  },
];

// ==================== MYTHIC TITLES ====================
const MYTHIC_TITLES: TitleDefinition[] = [
  {
    id: 'title-god',
    name: 'God',
    displayName: 'God',
    rarity: 'mythic',
    animationType: 'rainbow',
    gradient:
      'bg-gradient-to-r from-yellow-300 via-white to-yellow-300 bg-clip-text text-transparent',
    colors: ['#fde047', '#ffffff', '#fde047'],
    isPremium: true,
    unlocked: false,
    unlockRequirement: 'Reach max prestige',
    description: 'Ascended beyond mortal comprehension',
  },
  {
    id: 'title-immortal',
    name: 'Immortal',
    displayName: 'Immortal',
    rarity: 'mythic',
    animationType: 'shimmer',
    gradient:
      'bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-500 bg-clip-text text-transparent',
    colors: ['#67e8f9', '#60a5fa', '#a855f7'],
    isPremium: true,
    unlocked: false,
    unlockRequirement: 'Top 10 global ranking',
    description: 'Your legend will never die',
  },
  {
    id: 'title-cosmic-entity',
    name: 'Cosmic Entity',
    displayName: 'Cosmic Entity',
    rarity: 'mythic',
    animationType: 'rainbow',
    gradient:
      'bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 bg-clip-text text-transparent',
    colors: ['#9333ea', '#ec4899', '#2563eb'],
    isPremium: true,
    unlocked: false,
    unlockRequirement: 'Complete impossible challenge',
    description: 'One with the universe',
  },
];

// ==================== ALL TITLES ====================
export const ALL_TITLES: TitleDefinition[] = [
  ...STARTER_TITLES,
  ...ACHIEVEMENT_TITLES,
  ...ACTIVITY_TITLES,
  ...SPECIAL_TITLES,
  ...GAMING_TITLES,
  ...MYTHIC_TITLES,
];

// ==================== TITLE CATEGORIES ====================
export const TITLE_CATEGORIES: TitleCategory[] = [
  {
    id: 'starter',
    name: 'Starter',
    icon: '🌱',
    titles: STARTER_TITLES,
  },
  {
    id: 'achievement',
    name: 'Achievement',
    icon: '🏆',
    titles: ACHIEVEMENT_TITLES,
  },
  {
    id: 'activity',
    name: 'Activity',
    icon: '💬',
    titles: ACTIVITY_TITLES,
  },
  {
    id: 'special',
    name: 'Special',
    icon: '⭐',
    titles: SPECIAL_TITLES,
  },
  {
    id: 'gaming',
    name: 'Gaming',
    icon: '🎮',
    titles: GAMING_TITLES,
  },
  {
    id: 'mythic',
    name: 'Mythic',
    icon: '✨',
    titles: MYTHIC_TITLES,
  },
];

// Helper functions
/**
 * unknown.
 */
/**
 * Retrieves title by id.
 *
 * @param id - Unique identifier.
 * @returns The title by id.
 */
export function getTitleById(id: string): TitleDefinition | undefined {
  return ALL_TITLES.find((t) => t.id === id);
}

/**
 * unknown.
 */
/**
 * Retrieves titles by rarity.
 *
 * @param rarity - The rarity.
 * @returns The titles by rarity.
 */
export function getTitlesByRarity(rarity: TitleRarity): TitleDefinition[] {
  return ALL_TITLES.filter((t) => t.rarity === rarity);
}

/**
 * unknown.
 */
/**
 * Retrieves unlocked titles.
 * @returns The unlocked titles.
 */
export function getUnlockedTitles(): TitleDefinition[] {
  return ALL_TITLES.filter((t) => t.unlocked);
}

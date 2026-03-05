/**
 * Badge Collections Data
 *
 * 40+ equippable badges organized by rarity.
 * Each badge has rarity, icon, unlock requirements, and equip status.
 */

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  unlocked: boolean;
  unlockRequirement?: string;
  unlockLevel?: number;
  isPremium: boolean;
}

// ==================== COMMON BADGES ====================
const COMMON_BADGES: BadgeDefinition[] = [
  {
    id: 'badge-newcomer',
    name: 'Newcomer',
    description: 'Welcome to CGraph!',
    icon: '👋',
    rarity: 'common',
    unlocked: true,
    isPremium: false,
  },
  {
    id: 'badge-first-message',
    name: 'First Message',
    description: 'Sent your first message',
    icon: '💬',
    rarity: 'common',
    unlocked: true,
    isPremium: false,
  },
  {
    id: 'badge-profile-complete',
    name: 'Profile Complete',
    description: 'Filled out your entire profile',
    icon: '📝',
    rarity: 'common',
    unlocked: true,
    isPremium: false,
  },
  {
    id: 'badge-first-friend',
    name: 'First Friend',
    description: 'Made your first friend',
    icon: '🤝',
    rarity: 'common',
    unlocked: true,
    isPremium: false,
  },
  {
    id: 'badge-group-joiner',
    name: 'Group Joiner',
    description: 'Joined your first group',
    icon: '👥',
    rarity: 'common',
    unlocked: true,
    isPremium: false,
  },
  {
    id: 'badge-forum-poster',
    name: 'Forum Poster',
    description: 'Created your first forum post',
    icon: '📰',
    rarity: 'common',
    unlocked: true,
    isPremium: false,
  },
  {
    id: 'badge-early-adopter',
    name: 'Early Adopter',
    description: 'Joined during early access',
    icon: '🌱',
    rarity: 'common',
    unlocked: true,
    isPremium: false,
  },
  {
    id: 'badge-night-owl',
    name: 'Night Owl',
    description: 'Active after midnight',
    icon: '🦉',
    rarity: 'common',
    unlocked: false,
    unlockRequirement: 'Be active after midnight 10 times',
    isPremium: false,
  },
];

// ==================== RARE BADGES ====================
const RARE_BADGES: BadgeDefinition[] = [
  {
    id: 'badge-social-butterfly',
    name: 'Social Butterfly',
    description: 'Connected with 50 people',
    icon: '🦋',
    rarity: 'rare',
    unlocked: false,
    unlockRequirement: 'Add 50 friends',
    isPremium: false,
  },
  {
    id: 'badge-chatterbox',
    name: 'Chatterbox',
    description: 'Sent 1,000 messages',
    icon: '🗣️',
    rarity: 'rare',
    unlocked: false,
    unlockRequirement: 'Send 1,000 messages',
    isPremium: false,
  },
  {
    id: 'badge-forum-contributor',
    name: 'Forum Contributor',
    description: 'Created 50 forum posts',
    icon: '✍️',
    rarity: 'rare',
    unlocked: false,
    unlockRequirement: 'Create 50 forum posts',
    isPremium: false,
  },
  {
    id: 'badge-group-leader',
    name: 'Group Leader',
    description: 'Created and manage a group',
    icon: '👑',
    rarity: 'rare',
    unlocked: false,
    unlockRequirement: 'Create a group with 10+ members',
    isPremium: false,
  },
  {
    id: 'badge-streak-7',
    name: 'Week Warrior',
    description: '7-day login streak',
    icon: '🔥',
    rarity: 'rare',
    unlocked: false,
    unlockRequirement: 'Login 7 days in a row',
    isPremium: false,
  },
  {
    id: 'badge-helper',
    name: 'Helpful Hand',
    description: 'Received 50 upvotes on forum posts',
    icon: '🙌',
    rarity: 'rare',
    unlocked: false,
    unlockRequirement: 'Get 50 upvotes on forum posts',
    isPremium: false,
  },
  {
    id: 'badge-collector',
    name: 'Collector',
    description: 'Collected 25 unique items',
    icon: '🎒',
    rarity: 'rare',
    unlocked: false,
    unlockRequirement: 'Collect 25 unique items',
    isPremium: false,
  },
  {
    id: 'badge-voice-user',
    name: 'Voice Chat Regular',
    description: 'Spent 10 hours in voice channels',
    icon: '🎤',
    rarity: 'rare',
    unlocked: false,
    unlockRequirement: 'Spend 10 hours in voice chat',
    isPremium: false,
  },
];

// ==================== EPIC BADGES ====================
const EPIC_BADGES: BadgeDefinition[] = [
  {
    id: 'badge-streak-30',
    name: 'Monthly Devotion',
    description: '30-day login streak',
    icon: '⚡',
    rarity: 'epic',
    unlocked: false,
    unlockRequirement: 'Login 30 days in a row',
    isPremium: false,
  },
  {
    id: 'badge-10k-messages',
    name: 'Message Master',
    description: 'Sent 10,000 messages',
    icon: '📨',
    rarity: 'epic',
    unlocked: false,
    unlockRequirement: 'Send 10,000 messages',
    isPremium: false,
  },
  {
    id: 'badge-community-star',
    name: 'Community Star',
    description: 'Recognized community contributor',
    icon: '⭐',
    rarity: 'epic',
    unlocked: false,
    unlockRequirement: 'Reach Level 25',
    unlockLevel: 25,
    isPremium: false,
  },
  {
    id: 'badge-quest-hunter',
    name: 'Quest Hunter',
    description: 'Completed 50 quests',
    icon: '🏹',
    rarity: 'epic',
    unlocked: false,
    unlockRequirement: 'Complete 50 quests',
    isPremium: false,
  },
  {
    id: 'badge-beta-tester',
    name: 'Beta Tester',
    description: 'Participated in beta testing',
    icon: '🧪',
    rarity: 'epic',
    unlocked: false,
    unlockRequirement: 'Join beta program',
    isPremium: false,
  },
  {
    id: 'badge-event-champion',
    name: 'Event Champion',
    description: 'Won a seasonal event',
    icon: '🏆',
    rarity: 'epic',
    unlocked: false,
    unlockRequirement: 'Win a seasonal event',
    isPremium: false,
  },
  {
    id: 'badge-moderator',
    name: 'Moderator',
    description: 'Community moderator',
    icon: '🛡️',
    rarity: 'epic',
    unlocked: false,
    unlockRequirement: 'Staff appointment',
    isPremium: false,
  },
  {
    id: 'badge-vip',
    name: 'VIP',
    description: 'Premium member',
    icon: '💎',
    rarity: 'epic',
    unlocked: false,
    unlockRequirement: 'Premium subscription',
    isPremium: true,
  },
];

// ==================== LEGENDARY BADGES ====================
const LEGENDARY_BADGES: BadgeDefinition[] = [
  {
    id: 'badge-streak-365',
    name: 'Year-Long Devotion',
    description: '365-day login streak',
    icon: '🌟',
    rarity: 'legendary',
    unlocked: false,
    unlockRequirement: 'Login 365 days in a row',
    isPremium: false,
  },
  {
    id: 'badge-100k-messages',
    name: 'Legendary Chatter',
    description: 'Sent 100,000 messages',
    icon: '💬',
    rarity: 'legendary',
    unlocked: false,
    unlockRequirement: 'Send 100,000 messages',
    isPremium: false,
  },
  {
    id: 'badge-founder',
    name: 'Founder',
    description: 'Original community founder',
    icon: '🏛️',
    rarity: 'legendary',
    unlocked: false,
    unlockRequirement: 'Founding member',
    isPremium: true,
  },
  {
    id: 'badge-completionist',
    name: 'Completionist',
    description: 'Unlocked all achievements',
    icon: '🎯',
    rarity: 'legendary',
    unlocked: false,
    unlockRequirement: '100% all achievements',
    isPremium: false,
  },
  {
    id: 'badge-top-contributor',
    name: 'Top Contributor',
    description: 'Top 10 community contributor',
    icon: '🥇',
    rarity: 'legendary',
    unlocked: false,
    unlockRequirement: 'Reach top 10 on leaderboard',
    isPremium: false,
  },
  {
    id: 'badge-prestige',
    name: 'Prestige',
    description: 'Achieved prestige status',
    icon: '✨',
    rarity: 'legendary',
    unlocked: false,
    unlockRequirement: 'Reach Prestige 1',
    isPremium: false,
  },
  {
    id: 'badge-master-collector',
    name: 'Master Collector',
    description: 'Collected 100 unique items',
    icon: '🗝️',
    rarity: 'legendary',
    unlocked: false,
    unlockRequirement: 'Collect 100 unique items',
    isPremium: false,
  },
  {
    id: 'badge-server-booster',
    name: 'Server Booster',
    description: 'Boosted a server for 6 months',
    icon: '🚀',
    rarity: 'legendary',
    unlocked: false,
    unlockRequirement: 'Boost a server for 6 months',
    isPremium: true,
  },
];

// ==================== MYTHIC BADGES ====================
const MYTHIC_BADGES: BadgeDefinition[] = [
  {
    id: 'badge-immortal',
    name: 'Immortal',
    description: 'Achieved the impossible',
    icon: '♾️',
    rarity: 'mythic',
    unlocked: false,
    unlockRequirement: 'Top 10 global ranking',
    isPremium: true,
  },
  {
    id: 'badge-cosmic',
    name: 'Cosmic Entity',
    description: 'Transcended beyond mortal limits',
    icon: '🌌',
    rarity: 'mythic',
    unlocked: false,
    unlockRequirement: 'Complete impossible challenge',
    isPremium: true,
  },
  {
    id: 'badge-god-tier',
    name: 'God Tier',
    description: 'Reached max prestige',
    icon: '⚜️',
    rarity: 'mythic',
    unlocked: false,
    unlockRequirement: 'Reach max prestige',
    isPremium: true,
  },
  {
    id: 'badge-zodiac-master',
    name: 'Zodiac Master',
    description: 'Collected all zodiac items',
    icon: '♈',
    rarity: 'mythic',
    unlocked: false,
    unlockRequirement: 'Collect all zodiac badges',
    isPremium: true,
  },
];

// ==================== ALL BADGES ====================
export const ALL_BADGES: BadgeDefinition[] = [
  ...COMMON_BADGES,
  ...RARE_BADGES,
  ...EPIC_BADGES,
  ...LEGENDARY_BADGES,
  ...MYTHIC_BADGES,
];

// ==================== HELPER FUNCTIONS ====================

export function getBadgeById(id: string): BadgeDefinition | undefined {
  return ALL_BADGES.find((b) => b.id === id);
}

export function getBadgesByRarity(rarity: BadgeRarity): BadgeDefinition[] {
  return ALL_BADGES.filter((b) => b.rarity === rarity);
}

export function getUnlockedBadges(): BadgeDefinition[] {
  return ALL_BADGES.filter((b) => b.unlocked);
}

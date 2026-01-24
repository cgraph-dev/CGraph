/**
 * Badges Collection Data
 *
 * 40+ badges organized by category with unlock requirements.
 * Each badge has rarity, icon, and detailed descriptions.
 */

export type BadgeRarity = 'free' | 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  category: string;
  isPremium: boolean;
  unlocked: boolean;
  unlockRequirement?: string;
  progress?: {
    current: number;
    target: number;
  };
  earnedDate?: string;
}

export interface BadgeCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  badges: BadgeDefinition[];
}

// Rarity colors for badges
export const BADGE_RARITY_COLORS: Record<
  BadgeRarity,
  { bg: string; text: string; border: string; glow: string }
> = {
  free: { bg: 'bg-gray-600/50', text: 'text-gray-300', border: 'border-gray-500', glow: '#6b7280' },
  common: {
    bg: 'bg-gray-500/50',
    text: 'text-gray-200',
    border: 'border-gray-400',
    glow: '#9ca3af',
  },
  rare: { bg: 'bg-blue-600/50', text: 'text-blue-300', border: 'border-blue-500', glow: '#3b82f6' },
  epic: {
    bg: 'bg-purple-600/50',
    text: 'text-purple-300',
    border: 'border-purple-500',
    glow: '#8b5cf6',
  },
  legendary: {
    bg: 'bg-yellow-600/50',
    text: 'text-yellow-300',
    border: 'border-yellow-500',
    glow: '#eab308',
  },
  mythic: {
    bg: 'bg-gradient-to-r from-pink-500 to-purple-500',
    text: 'text-white',
    border: 'border-pink-400',
    glow: '#ec4899',
  },
};

// ==================== EARLY ADOPTER BADGES ====================
const EARLY_ADOPTER_BADGES: BadgeDefinition[] = [
  {
    id: 'badge-early-adopter',
    name: 'Early Adopter',
    description: 'Joined in the first month of launch',
    icon: '🌟',
    rarity: 'rare',
    category: 'special',
    isPremium: false,
    unlocked: true,
    earnedDate: '2026-01-01',
  },
  {
    id: 'badge-founder',
    name: 'Founding Member',
    description: 'One of the first 1000 members',
    icon: '👑',
    rarity: 'legendary',
    category: 'special',
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'First 1000 members',
  },
  {
    id: 'badge-beta-tester',
    name: 'Beta Tester',
    description: 'Helped test new features before release',
    icon: '🧪',
    rarity: 'epic',
    category: 'special',
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Join beta program',
  },
  {
    id: 'badge-alpha-pioneer',
    name: 'Alpha Pioneer',
    description: 'Tested during alpha stage',
    icon: '🚀',
    rarity: 'legendary',
    category: 'special',
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Alpha tester',
  },
];

// ==================== ACTIVITY BADGES ====================
const ACTIVITY_BADGES: BadgeDefinition[] = [
  {
    id: 'badge-chatterbox',
    name: 'Chatterbox',
    description: 'Sent 1,000 messages',
    icon: '💬',
    rarity: 'common',
    category: 'activity',
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Send 1,000 messages',
    progress: { current: 0, target: 1000 },
  },
  {
    id: 'badge-forum-master',
    name: 'Forum Master',
    description: 'Created 100 forum posts',
    icon: '📝',
    rarity: 'epic',
    category: 'activity',
    isPremium: false,
    unlocked: true,
  },
  {
    id: 'badge-friend-magnet',
    name: 'Friend Magnet',
    description: 'Have 50 friends',
    icon: '👥',
    rarity: 'rare',
    category: 'activity',
    isPremium: false,
    unlocked: true,
    progress: { current: 50, target: 50 },
  },
  {
    id: 'badge-streak-master',
    name: 'Streak Master',
    description: '30 day login streak',
    icon: '🔥',
    rarity: 'legendary',
    category: 'activity',
    isPremium: false,
    unlocked: false,
    unlockRequirement: '30 day streak',
    progress: { current: 0, target: 30 },
  },
  {
    id: 'badge-daily-devotee',
    name: 'Daily Devotee',
    description: '7 day login streak',
    icon: '📅',
    rarity: 'common',
    category: 'activity',
    isPremium: false,
    unlocked: true,
  },
  {
    id: 'badge-night-owl',
    name: 'Night Owl',
    description: 'Active after midnight 30 times',
    icon: '🦉',
    rarity: 'rare',
    category: 'activity',
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Night activity',
    progress: { current: 0, target: 30 },
  },
  {
    id: 'badge-early-bird',
    name: 'Early Bird',
    description: 'Active before 6 AM 30 times',
    icon: '🐦',
    rarity: 'rare',
    category: 'activity',
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Morning activity',
    progress: { current: 0, target: 30 },
  },
];

// ==================== ACHIEVEMENT BADGES ====================
const ACHIEVEMENT_BADGES: BadgeDefinition[] = [
  {
    id: 'badge-achievement-hunter',
    name: 'Achievement Hunter',
    description: 'Unlock 50 achievements',
    icon: '🏆',
    rarity: 'epic',
    category: 'achievement',
    isPremium: false,
    unlocked: false,
    unlockRequirement: '50 achievements',
    progress: { current: 0, target: 50 },
  },
  {
    id: 'badge-completionist',
    name: 'Completionist',
    description: 'Unlock all achievements',
    icon: '💯',
    rarity: 'mythic',
    category: 'achievement',
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'All achievements',
  },
  {
    id: 'badge-first-steps',
    name: 'First Steps',
    description: 'Complete the tutorial',
    icon: '👣',
    rarity: 'free',
    category: 'achievement',
    isPremium: false,
    unlocked: true,
  },
  {
    id: 'badge-level-10',
    name: 'Rising Star',
    description: 'Reach level 10',
    icon: '⭐',
    rarity: 'common',
    category: 'achievement',
    isPremium: false,
    unlocked: true,
  },
  {
    id: 'badge-level-25',
    name: 'Veteran',
    description: 'Reach level 25',
    icon: '🌟',
    rarity: 'rare',
    category: 'achievement',
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Reach level 25',
  },
  {
    id: 'badge-level-50',
    name: 'Elite',
    description: 'Reach level 50',
    icon: '💫',
    rarity: 'epic',
    category: 'achievement',
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Reach level 50',
  },
  {
    id: 'badge-level-100',
    name: 'Legend',
    description: 'Reach level 100',
    icon: '✨',
    rarity: 'legendary',
    category: 'achievement',
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Reach level 100',
  },
];

// ==================== COMMUNITY BADGES ====================
const COMMUNITY_BADGES: BadgeDefinition[] = [
  {
    id: 'badge-helpful-hero',
    name: 'Helpful Hero',
    description: 'Receive 100 upvotes on your posts',
    icon: '💖',
    rarity: 'rare',
    category: 'community',
    isPremium: false,
    unlocked: true,
    progress: { current: 100, target: 100 },
  },
  {
    id: 'badge-bug-squasher',
    name: 'Bug Squasher',
    description: 'Report 10 bugs that get fixed',
    icon: '🐛',
    rarity: 'rare',
    category: 'community',
    isPremium: false,
    unlocked: true,
  },
  {
    id: 'badge-mentor',
    name: 'Mentor',
    description: 'Help 25 new members',
    icon: '🎓',
    rarity: 'epic',
    category: 'community',
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Help new members',
    progress: { current: 0, target: 25 },
  },
  {
    id: 'badge-ambassador',
    name: 'Ambassador',
    description: 'Refer 10 new members',
    icon: '🤝',
    rarity: 'epic',
    category: 'community',
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Refer 10 members',
    progress: { current: 0, target: 10 },
  },
  {
    id: 'badge-supporter',
    name: 'Supporter',
    description: 'Subscribe to premium',
    icon: '💎',
    rarity: 'rare',
    category: 'community',
    isPremium: true,
    unlocked: false,
    unlockRequirement: 'Premium subscription',
  },
];

// ==================== GAMING BADGES ====================
const GAMING_BADGES: BadgeDefinition[] = [
  {
    id: 'badge-first-win',
    name: 'First Victory',
    description: 'Win your first match',
    icon: '🥇',
    rarity: 'common',
    category: 'gaming',
    isPremium: false,
    unlocked: true,
  },
  {
    id: 'badge-pvp-warrior',
    name: 'PvP Warrior',
    description: 'Win 100 PvP matches',
    icon: '⚔️',
    rarity: 'epic',
    category: 'gaming',
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Win 100 PvP matches',
    progress: { current: 0, target: 100 },
  },
  {
    id: 'badge-undefeated',
    name: 'Undefeated',
    description: '10 win streak in PvP',
    icon: '🏅',
    rarity: 'legendary',
    category: 'gaming',
    isPremium: false,
    unlocked: false,
    unlockRequirement: '10 win streak',
  },
  {
    id: 'badge-collector',
    name: 'Collector',
    description: 'Collect 100 unique items',
    icon: '🎒',
    rarity: 'rare',
    category: 'gaming',
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Collect items',
    progress: { current: 0, target: 100 },
  },
  {
    id: 'badge-speedrunner',
    name: 'Speedrunner',
    description: 'Complete a challenge in record time',
    icon: '⏱️',
    rarity: 'epic',
    category: 'gaming',
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Beat time records',
  },
];

// ==================== SEASONAL BADGES ====================
const SEASONAL_BADGES: BadgeDefinition[] = [
  {
    id: 'badge-winter-2026',
    name: 'Winter 2026',
    description: 'Participated in Winter 2026 event',
    icon: '❄️',
    rarity: 'rare',
    category: 'seasonal',
    isPremium: false,
    unlocked: true,
    earnedDate: '2026-01-15',
  },
  {
    id: 'badge-valentines-2026',
    name: 'Valentine 2026',
    description: "Participated in Valentine's Day event",
    icon: '💕',
    rarity: 'rare',
    category: 'seasonal',
    isPremium: false,
    unlocked: false,
    unlockRequirement: "Valentine's event",
  },
  {
    id: 'badge-anniversary',
    name: '1 Year Anniversary',
    description: 'Been a member for 1 year',
    icon: '🎂',
    rarity: 'legendary',
    category: 'seasonal',
    isPremium: false,
    unlocked: false,
    unlockRequirement: '1 year membership',
  },
  {
    id: 'badge-halloween-2025',
    name: 'Halloween 2025',
    description: 'Participated in Halloween event',
    icon: '🎃',
    rarity: 'rare',
    category: 'seasonal',
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Halloween event',
  },
];

// ==================== SPECIAL BADGES ====================
const SPECIAL_BADGES: BadgeDefinition[] = [
  {
    id: 'badge-verified',
    name: 'Verified',
    description: 'Verified email and phone',
    icon: '✅',
    rarity: 'common',
    category: 'special',
    isPremium: false,
    unlocked: true,
  },
  {
    id: 'badge-og',
    name: 'OG Member',
    description: 'Member since day one',
    icon: '🏛️',
    rarity: 'mythic',
    category: 'special',
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Day one member',
  },
  {
    id: 'badge-moderator',
    name: 'Moderator',
    description: 'Community moderator',
    icon: '🛡️',
    rarity: 'epic',
    category: 'special',
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Staff appointment',
  },
  {
    id: 'badge-developer',
    name: 'Developer',
    description: 'CGraph development team',
    icon: '💻',
    rarity: 'legendary',
    category: 'special',
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Developer team',
  },
  {
    id: 'badge-content-creator',
    name: 'Content Creator',
    description: 'Official content creator',
    icon: '🎬',
    rarity: 'epic',
    category: 'special',
    isPremium: false,
    unlocked: false,
    unlockRequirement: 'Creator program',
  },
];

// ==================== ALL BADGES ====================
export const ALL_BADGES: BadgeDefinition[] = [
  ...EARLY_ADOPTER_BADGES,
  ...ACTIVITY_BADGES,
  ...ACHIEVEMENT_BADGES,
  ...COMMUNITY_BADGES,
  ...GAMING_BADGES,
  ...SEASONAL_BADGES,
  ...SPECIAL_BADGES,
];

// ==================== BADGE CATEGORIES ====================
export const BADGE_CATEGORIES: BadgeCategory[] = [
  {
    id: 'special',
    name: 'Special',
    description: 'Exclusive limited-time badges',
    icon: '⭐',
    badges: [...EARLY_ADOPTER_BADGES, ...SPECIAL_BADGES],
  },
  {
    id: 'activity',
    name: 'Activity',
    description: 'Earned through platform activity',
    icon: '💬',
    badges: ACTIVITY_BADGES,
  },
  {
    id: 'achievement',
    name: 'Achievement',
    description: 'Milestone accomplishments',
    icon: '🏆',
    badges: ACHIEVEMENT_BADGES,
  },
  {
    id: 'community',
    name: 'Community',
    description: 'Community contribution badges',
    icon: '🤝',
    badges: COMMUNITY_BADGES,
  },
  {
    id: 'gaming',
    name: 'Gaming',
    description: 'Gaming achievements',
    icon: '🎮',
    badges: GAMING_BADGES,
  },
  {
    id: 'seasonal',
    name: 'Seasonal',
    description: 'Limited-time event badges',
    icon: '🎄',
    badges: SEASONAL_BADGES,
  },
];

// Helper functions
export function getBadgeById(id: string): BadgeDefinition | undefined {
  return ALL_BADGES.find((b) => b.id === id);
}

export function getBadgesByRarity(rarity: BadgeRarity): BadgeDefinition[] {
  return ALL_BADGES.filter((b) => b.rarity === rarity);
}

export function getBadgesByCategory(categoryId: string): BadgeDefinition[] {
  return ALL_BADGES.filter((b) => b.category === categoryId);
}

export function getUnlockedBadges(): BadgeDefinition[] {
  return ALL_BADGES.filter((b) => b.unlocked);
}

export function getEquippableBadges(): BadgeDefinition[] {
  return ALL_BADGES.filter((b) => b.unlocked);
}

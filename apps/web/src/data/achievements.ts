import type { Achievement, AchievementCategory, AchievementRarity } from '@/stores/gamificationStore';

/**
 * Achievement Definitions for CGraph
 *
 * Achievements are designed to encourage organic platform engagement
 * without creating grind or FOMO. Categories balance social interaction,
 * content creation, exploration, and mastery of platform features.
 *
 * Rarity tiers create prestige without gatekeeping - even common achievements
 * feel rewarding to unlock. Legendary and mythic achievements are designed
 * to be aspirational but achievable with consistent engagement.
 */

export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'progress' | 'unlocked' | 'unlockedAt'>[] = [
  // ==================== SOCIAL CATEGORY ====================
  {
    id: 'first_message',
    title: 'First Contact',
    description: 'Send your first message on CGraph',
    category: 'social' as AchievementCategory,
    rarity: 'common' as AchievementRarity,
    icon: '💬',
    xpReward: 50,
    maxProgress: 1,
    isHidden: false,
    loreFragment: 'lore_1_2',
  },
  {
    id: 'networking_novice',
    title: 'Networking Novice',
    description: 'Make 5 friends on the platform',
    category: 'social' as AchievementCategory,
    rarity: 'common' as AchievementRarity,
    icon: '🤝',
    xpReward: 100,
    maxProgress: 5,
    isHidden: false,
    loreFragment: 'lore_1_3',
  },
  {
    id: 'social_butterfly',
    title: 'Social Butterfly',
    description: 'Have 25 active conversations in a single week',
    category: 'social' as AchievementCategory,
    rarity: 'uncommon' as AchievementRarity,
    icon: '🦋',
    xpReward: 250,
    maxProgress: 25,
    isHidden: false,
  },
  {
    id: 'friend_circle',
    title: 'Friend Circle',
    description: 'Build a network of 50 connections',
    category: 'social' as AchievementCategory,
    rarity: 'rare' as AchievementRarity,
    icon: '🔗',
    xpReward: 500,
    maxProgress: 50,
    isHidden: false,
    titleReward: 'The Connected',
  },
  {
    id: 'social_nexus',
    title: 'Social Nexus',
    description: 'Become a connection point for 100+ users',
    category: 'social' as AchievementCategory,
    rarity: 'epic' as AchievementRarity,
    icon: '🌐',
    xpReward: 1000,
    maxProgress: 100,
    isHidden: false,
    titleReward: 'Network Hub',
  },
  {
    id: 'voice_of_reason',
    title: 'Voice of Reason',
    description: 'Send 100 voice messages',
    category: 'social' as AchievementCategory,
    rarity: 'uncommon' as AchievementRarity,
    icon: '🎤',
    xpReward: 300,
    maxProgress: 100,
    isHidden: false,
  },

  // ==================== CONTENT CATEGORY ====================
  {
    id: 'first_post',
    title: 'Breaking the Ice',
    description: 'Create your first forum post',
    category: 'content' as AchievementCategory,
    rarity: 'common' as AchievementRarity,
    icon: '📝',
    xpReward: 75,
    maxProgress: 1,
    isHidden: false,
  },
  {
    id: 'community_builder',
    title: 'Community Builder',
    description: 'Found your own forum',
    category: 'content' as AchievementCategory,
    rarity: 'rare' as AchievementRarity,
    icon: '🏗️',
    xpReward: 500,
    maxProgress: 1,
    isHidden: false,
    loreFragment: 'lore_1_4_branch',
    titleReward: 'Forum Founder',
  },
  {
    id: 'prolific_poster',
    title: 'Prolific Poster',
    description: 'Create 50 high-quality forum posts',
    category: 'content' as AchievementCategory,
    rarity: 'uncommon' as AchievementRarity,
    icon: '✍️',
    xpReward: 400,
    maxProgress: 50,
    isHidden: false,
  },
  {
    id: 'forum_master',
    title: 'Forum Master',
    description: 'Earn 1000 total upvotes across all posts',
    category: 'content' as AchievementCategory,
    rarity: 'epic' as AchievementRarity,
    icon: '👑',
    xpReward: 1500,
    maxProgress: 1000,
    isHidden: false,
    loreFragment: 'lore_2_2_branch',
    titleReward: 'Master of Discourse',
  },
  {
    id: 'helpful_hand',
    title: 'Helpful Hand',
    description: 'Have 10 of your answers marked as "Best Answer"',
    category: 'content' as AchievementCategory,
    rarity: 'rare' as AchievementRarity,
    icon: '🌟',
    xpReward: 750,
    maxProgress: 10,
    isHidden: false,
  },
  {
    id: 'knowledge_keeper',
    title: 'Knowledge Keeper',
    description: 'Write comprehensive guides totaling 10,000+ words',
    category: 'content' as AchievementCategory,
    rarity: 'legendary' as AchievementRarity,
    icon: '📚',
    xpReward: 3000,
    maxProgress: 10000,
    isHidden: false,
    titleReward: 'The Archivist',
  },

  // ==================== EXPLORATION CATEGORY ====================
  {
    id: 'curious_mind',
    title: 'Curious Mind',
    description: 'Visit 10 different forums',
    category: 'exploration' as AchievementCategory,
    rarity: 'common' as AchievementRarity,
    icon: '🔍',
    xpReward: 100,
    maxProgress: 10,
    isHidden: false,
  },
  {
    id: 'digital_nomad',
    title: 'Digital Nomad',
    description: 'Participate in 25 different communities',
    category: 'exploration' as AchievementCategory,
    rarity: 'uncommon' as AchievementRarity,
    icon: '🌍',
    xpReward: 300,
    maxProgress: 25,
    isHidden: false,
  },
  {
    id: 'omnipresent',
    title: 'Omnipresent',
    description: 'Be active in 50+ communities simultaneously',
    category: 'exploration' as AchievementCategory,
    rarity: 'rare' as AchievementRarity,
    icon: '👁️',
    xpReward: 600,
    maxProgress: 50,
    isHidden: false,
    titleReward: 'The Ubiquitous',
  },
  {
    id: 'early_adopter',
    title: 'Early Adopter',
    description: 'Join a forum within its first week of creation',
    category: 'exploration' as AchievementCategory,
    rarity: 'uncommon' as AchievementRarity,
    icon: '🚀',
    xpReward: 200,
    maxProgress: 1,
    isHidden: false,
  },
  {
    id: 'trendsetter',
    title: 'Trendsetter',
    description: 'Be among the first 10 members of 5 different forums',
    category: 'exploration' as AchievementCategory,
    rarity: 'epic' as AchievementRarity,
    icon: '🎯',
    xpReward: 1000,
    maxProgress: 5,
    isHidden: false,
  },

  // ==================== MASTERY CATEGORY ====================
  {
    id: 'encryption_enthusiast',
    title: 'Encryption Enthusiast',
    description: 'Enable end-to-end encryption on 10 conversations',
    category: 'mastery' as AchievementCategory,
    rarity: 'uncommon' as AchievementRarity,
    icon: '🔐',
    xpReward: 250,
    maxProgress: 10,
    isHidden: false,
  },
  {
    id: 'privacy_advocate',
    title: 'Privacy Advocate',
    description: 'Verify encryption keys with 5 different contacts',
    category: 'mastery' as AchievementCategory,
    rarity: 'rare' as AchievementRarity,
    icon: '🛡️',
    xpReward: 500,
    maxProgress: 5,
    isHidden: false,
    titleReward: 'Guardian of Privacy',
  },
  {
    id: 'protocol_pioneer',
    title: 'Protocol Pioneer',
    description: 'Contribute to CGraph open source development',
    category: 'mastery' as AchievementCategory,
    rarity: 'legendary' as AchievementRarity,
    icon: '⚙️',
    xpReward: 5000,
    maxProgress: 1,
    isHidden: false,
    loreFragment: 'lore_3_2',
    titleReward: 'Code Contributor',
  },
  {
    id: 'node_runner',
    title: 'Node Runner',
    description: 'Host a CGraph node for 30 consecutive days',
    category: 'mastery' as AchievementCategory,
    rarity: 'epic' as AchievementRarity,
    icon: '🖥️',
    xpReward: 2000,
    maxProgress: 30,
    isHidden: false,
    titleReward: 'Infrastructure Supporter',
  },
  {
    id: 'moderator_excellence',
    title: 'Moderator Excellence',
    description: 'Successfully moderate a forum for 90 days',
    category: 'mastery' as AchievementCategory,
    rarity: 'epic' as AchievementRarity,
    icon: '⚖️',
    xpReward: 1500,
    maxProgress: 90,
    isHidden: false,
    titleReward: 'Keeper of Order',
  },

  // ==================== LEGENDARY CATEGORY ====================
  {
    id: 'decade_veteran',
    title: 'Decade Veteran',
    description: 'Be an active member for 10 years',
    category: 'legendary' as AchievementCategory,
    rarity: 'mythic' as AchievementRarity,
    icon: '💎',
    xpReward: 10000,
    maxProgress: 3650,
    isHidden: false,
    titleReward: 'Ancient One',
  },
  {
    id: 'thousand_friends',
    title: 'Network of Thousands',
    description: 'Maintain 1000 active connections',
    category: 'legendary' as AchievementCategory,
    rarity: 'mythic' as AchievementRarity,
    icon: '🌟',
    xpReward: 10000,
    maxProgress: 1000,
    isHidden: false,
    titleReward: 'Social Architect',
  },
  {
    id: 'legend_maker',
    title: 'Legend Maker',
    description: 'Create content that receives 10,000 upvotes',
    category: 'legendary' as AchievementCategory,
    rarity: 'mythic' as AchievementRarity,
    icon: '🏆',
    xpReward: 15000,
    maxProgress: 10000,
    isHidden: false,
    titleReward: 'Living Legend',
  },

  // ==================== SECRET CATEGORY ====================
  {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Send 100 messages between 2 AM and 4 AM',
    category: 'secret' as AchievementCategory,
    rarity: 'uncommon' as AchievementRarity,
    icon: '🦉',
    xpReward: 200,
    maxProgress: 100,
    isHidden: true,
  },
  {
    id: 'emoji_enthusiast',
    title: 'Emoji Enthusiast',
    description: 'Use 50 different emoji types in messages',
    category: 'secret' as AchievementCategory,
    rarity: 'rare' as AchievementRarity,
    icon: '😄',
    xpReward: 300,
    maxProgress: 50,
    isHidden: true,
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Send 100 messages in under 5 minutes',
    category: 'secret' as AchievementCategory,
    rarity: 'rare' as AchievementRarity,
    icon: '⚡',
    xpReward: 400,
    maxProgress: 100,
    isHidden: true,
  },
  {
    id: 'easter_egg_hunter',
    title: 'Easter Egg Hunter',
    description: 'Find 10 hidden features in CGraph',
    category: 'secret' as AchievementCategory,
    rarity: 'epic' as AchievementRarity,
    icon: '🥚',
    xpReward: 1000,
    maxProgress: 10,
    isHidden: true,
    titleReward: 'Seeker of Secrets',
  },
  {
    id: 'konami_code',
    title: 'Old School',
    description: 'Enter the Konami code in the UI',
    category: 'secret' as AchievementCategory,
    rarity: 'legendary' as AchievementRarity,
    icon: '🎮',
    xpReward: 2000,
    maxProgress: 1,
    isHidden: true,
    titleReward: 'Retro Gamer',
  },
];

/**
 * Get achievement by ID
 */
export function getAchievement(id: string): typeof ACHIEVEMENT_DEFINITIONS[0] | null {
  return ACHIEVEMENT_DEFINITIONS.find(a => a.id === id) || null;
}

/**
 * Get achievements by category
 */
export function getAchievementsByCategory(category: AchievementCategory) {
  return ACHIEVEMENT_DEFINITIONS.filter(a => a.category === category);
}

/**
 * Get achievements by rarity
 */
export function getAchievementsByRarity(rarity: AchievementRarity) {
  return ACHIEVEMENT_DEFINITIONS.filter(a => a.rarity === rarity);
}

/**
 * Calculate total possible XP from all achievements
 */
export function getTotalPossibleAchievementXP(): number {
  return ACHIEVEMENT_DEFINITIONS.reduce((sum, achievement) => sum + achievement.xpReward, 0);
}

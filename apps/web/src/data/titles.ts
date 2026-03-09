/**
 * User Titles System
 *
 * Titles are displayed alongside usernames and can be earned through
 * achievements, purchases, or special events. Each title has unique
 * animations and styling based on rarity.
 */

export type TitleRarity = 'free' | 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type TitleCategory = 'achievement' | 'premium' | 'event' | 'leaderboard' | 'special';

export interface Title {
  id: string;
  name: string;
  displayName: string;
  rarity: TitleRarity;
  category: TitleCategory;
  description: string;
  color: string;
  gradientColors?: string[];
  animation: TitleAnimation;
  unlockRequirement?: string;
  coinPrice?: number;
  isLimited?: boolean;
}

/**
 * Title Animation Types - 25 unique animation effects
 * Organized by complexity: Basic → Advanced → Elemental → Cosmic
 */
export type TitleAnimationType =
  // No animation
  | 'none'
  // Basic animations (free tier)
  | 'shimmer'
  | 'glow'
  | 'pulse'
  | 'float'
  | 'bounce'
  // Advanced animations (common+)
  | 'rainbow'
  | 'wave'
  | 'sparkle'
  | 'holographic'
  | 'matrix'
  | 'glitch'
  | 'neon_flicker'
  // Elemental animations (rare+)
  | 'fire'
  | 'ice'
  | 'electric'
  | 'nature'
  | 'storm'
  // Cosmic animations (epic+)
  | 'plasma'
  | 'crystalline'
  | 'ethereal'
  | 'cosmic'
  | 'void'
  | 'aurora'
  // Divine animations (legendary+)
  | 'divine'
  | 'shadow'
  | 'inferno'
  | 'blizzard';

export interface TitleAnimation {
  type: TitleAnimationType;
  speed: number; // seconds (0.5 - 5)
  intensity: number; // 0-100
  /** Optional particle effects for advanced animations */
  particles?: boolean;
  /** Optional glow color override */
  glowColor?: string;
}

// Rarity color schemes
export const RARITY_COLORS: Record<TitleRarity, { primary: string; secondary: string; glow: string }> = {
  free: { primary: '#6b7280', secondary: '#4b5563', glow: 'rgba(107, 114, 128, 0.2)' },
  common: { primary: '#9ca3af', secondary: '#6b7280', glow: 'rgba(156, 163, 175, 0.3)' },
  rare: { primary: '#3b82f6', secondary: '#2563eb', glow: 'rgba(59, 130, 246, 0.4)' },
  epic: { primary: '#a855f7', secondary: '#9333ea', glow: 'rgba(168, 85, 247, 0.4)' },
  legendary: { primary: '#f59e0b', secondary: '#d97706', glow: 'rgba(245, 158, 11, 0.5)' },
  mythic: { primary: '#ef4444', secondary: '#dc2626', glow: 'rgba(239, 68, 68, 0.5)' },
};

export const TITLES: Title[] = [
  // ==================== ACHIEVEMENT TITLES ====================
  {
    id: 'newcomer',
    name: 'Newcomer',
    displayName: 'Newcomer',
    rarity: 'common',
    category: 'achievement',
    description: 'Just getting started on CGraph',
    color: '#9ca3af',
    animation: { type: 'none', speed: 0, intensity: 0 },
    unlockRequirement: 'Create an account',
  },
  {
    id: 'chatterbox',
    name: 'Chatterbox',
    displayName: 'Chatterbox',
    rarity: 'common',
    category: 'achievement',
    description: 'Send 100 messages',
    color: '#9ca3af',
    animation: { type: 'pulse', speed: 3, intensity: 20 },
    unlockRequirement: 'Send 100 messages',
  },
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    displayName: 'Social Butterfly',
    rarity: 'common',
    category: 'achievement',
    description: 'Make 25 friends',
    color: '#22c55e',
    animation: { type: 'shimmer', speed: 2, intensity: 40 },
    unlockRequirement: 'Make 25 friends',
  },
  {
    id: 'the_connected',
    name: 'The Connected',
    displayName: 'The Connected',
    rarity: 'rare',
    category: 'achievement',
    description: 'Build a network of 50 connections',
    color: '#3b82f6',
    animation: { type: 'glow', speed: 2.5, intensity: 50 },
    unlockRequirement: 'Friend Circle achievement',
  },
  {
    id: 'network_hub',
    name: 'Network Hub',
    displayName: 'Network Hub',
    rarity: 'epic',
    category: 'achievement',
    description: 'Become a connection point for 100+ users',
    color: '#a855f7',
    animation: { type: 'pulse', speed: 2, intensity: 60 },
    unlockRequirement: 'Social Nexus achievement',
  },
  {
    id: 'forum_founder',
    name: 'Forum Founder',
    displayName: 'Forum Founder',
    rarity: 'rare',
    category: 'achievement',
    description: 'Create your own forum community',
    color: '#3b82f6',
    animation: { type: 'wave', speed: 3, intensity: 40 },
    unlockRequirement: 'Community Builder achievement',
  },
  {
    id: 'master_of_discourse',
    name: 'Master of Discourse',
    displayName: 'Master of Discourse',
    rarity: 'epic',
    category: 'achievement',
    description: 'Earn 1000 upvotes across all posts',
    color: '#a855f7',
    gradientColors: ['#a855f7', '#ec4899'],
    animation: { type: 'shimmer', speed: 2, intensity: 60 },
    unlockRequirement: 'Forum Master achievement',
  },
  {
    id: 'the_archivist',
    name: 'The Archivist',
    displayName: 'The Archivist',
    rarity: 'legendary',
    category: 'achievement',
    description: 'Write comprehensive guides totaling 10,000+ words',
    color: '#f59e0b',
    gradientColors: ['#f59e0b', '#fcd34d'],
    animation: { type: 'glow', speed: 3, intensity: 70 },
    unlockRequirement: 'Knowledge Keeper achievement',
  },
  {
    id: 'guardian_of_privacy',
    name: 'Guardian of Privacy',
    displayName: 'Guardian of Privacy',
    rarity: 'rare',
    category: 'achievement',
    description: 'Champion of secure communication',
    color: '#3b82f6',
    animation: { type: 'pulse', speed: 2.5, intensity: 50 },
    unlockRequirement: 'Privacy Advocate achievement',
  },
  {
    id: 'code_contributor',
    name: 'Code Contributor',
    displayName: 'Code Contributor',
    rarity: 'legendary',
    category: 'achievement',
    description: 'Contributed to CGraph open source',
    color: '#f59e0b',
    gradientColors: ['#f59e0b', '#22c55e'],
    animation: { type: 'rainbow', speed: 4, intensity: 70 },
    unlockRequirement: 'Protocol Pioneer achievement',
  },
  {
    id: 'infrastructure_supporter',
    name: 'Infrastructure Supporter',
    displayName: 'Infra Hero',
    rarity: 'epic',
    category: 'achievement',
    description: 'Host a CGraph node for 30 days',
    color: '#a855f7',
    animation: { type: 'electric', speed: 1.5, intensity: 60 },
    unlockRequirement: 'Node Runner achievement',
  },
  {
    id: 'keeper_of_order',
    name: 'Keeper of Order',
    displayName: 'Keeper of Order',
    rarity: 'epic',
    category: 'achievement',
    description: 'Successfully moderated for 90 days',
    color: '#a855f7',
    animation: { type: 'glow', speed: 3, intensity: 55 },
    unlockRequirement: 'Moderator Excellence achievement',
  },
  {
    id: 'ancient_one',
    name: 'Ancient One',
    displayName: 'Ancient One',
    rarity: 'mythic',
    category: 'achievement',
    description: 'Active member for 10 years',
    color: '#ef4444',
    gradientColors: ['#ef4444', '#f59e0b', '#fcd34d'],
    animation: { type: 'fire', speed: 2, intensity: 90 },
    unlockRequirement: 'Decade Veteran achievement',
  },
  {
    id: 'social_architect',
    name: 'Social Architect',
    displayName: 'Social Architect',
    rarity: 'mythic',
    category: 'achievement',
    description: 'Maintain 1000 active connections',
    color: '#ef4444',
    gradientColors: ['#ef4444', '#ec4899'],
    animation: { type: 'rainbow', speed: 3, intensity: 85 },
    unlockRequirement: 'Network of Thousands achievement',
  },
  {
    id: 'living_legend',
    name: 'Living Legend',
    displayName: 'Living Legend',
    rarity: 'mythic',
    category: 'achievement',
    description: 'Create content with 10,000 upvotes',
    color: '#ef4444',
    gradientColors: ['#fcd34d', '#f59e0b', '#ef4444'],
    animation: { type: 'sparkle', speed: 2, intensity: 100 },
    unlockRequirement: 'Legend Maker achievement',
  },
  {
    id: 'seeker_of_secrets',
    name: 'Seeker of Secrets',
    displayName: 'Seeker of Secrets',
    rarity: 'epic',
    category: 'achievement',
    description: 'Found hidden features in CGraph',
    color: '#a855f7',
    animation: { type: 'shimmer', speed: 1.5, intensity: 65 },
    unlockRequirement: 'Easter Egg Hunter achievement',
  },
  {
    id: 'retro_gamer',
    name: 'Retro Gamer',
    displayName: 'Retro Gamer',
    rarity: 'legendary',
    category: 'achievement',
    description: 'Old school secrets unlocked',
    color: '#f59e0b',
    animation: { type: 'pulse', speed: 1, intensity: 70 },
    unlockRequirement: 'Konami Code achievement',
  },
  {
    id: 'the_ubiquitous',
    name: 'The Ubiquitous',
    displayName: 'The Ubiquitous',
    rarity: 'rare',
    category: 'achievement',
    description: 'Active in 50+ communities simultaneously',
    color: '#3b82f6',
    animation: { type: 'wave', speed: 2.5, intensity: 50 },
    unlockRequirement: 'Omnipresent achievement',
  },
  {
    id: 'master_communicator',
    name: 'Master Communicator',
    displayName: 'Master Communicator',
    rarity: 'epic',
    category: 'achievement',
    description: 'Sent over 10,000 messages',
    color: '#a855f7',
    animation: { type: 'glow', speed: 2, intensity: 55 },
    unlockRequirement: 'Message Master achievement',
  },
  {
    id: 'the_viral_one',
    name: 'The Viral One',
    displayName: 'The Viral One',
    rarity: 'epic',
    category: 'achievement',
    description: 'Received 1,000 reactions on messages',
    color: '#a855f7',
    gradientColors: ['#a855f7', '#ef4444'],
    animation: { type: 'sparkle', speed: 1.5, intensity: 65 },
    unlockRequirement: 'Viral Sensation achievement',
  },
  {
    id: 'community_leader',
    name: 'Community Leader',
    displayName: 'Community Leader',
    rarity: 'rare',
    category: 'achievement',
    description: 'Led a group with 50+ members',
    color: '#3b82f6',
    animation: { type: 'pulse', speed: 2.5, intensity: 45 },
    unlockRequirement: 'Mega Group Leader achievement',
  },
  {
    id: 'the_devoted',
    name: 'The Devoted',
    displayName: 'The Devoted',
    rarity: 'epic',
    category: 'achievement',
    description: 'Maintained a 30-day login streak',
    color: '#a855f7',
    animation: { type: 'shimmer', speed: 2, intensity: 50 },
    unlockRequirement: 'Monthly Master achievement',
  },
  {
    id: 'the_unwavering',
    name: 'The Unwavering',
    displayName: 'The Unwavering',
    rarity: 'legendary',
    category: 'achievement',
    description: 'Maintained a 90-day login streak',
    color: '#f59e0b',
    gradientColors: ['#f59e0b', '#fcd34d'],
    animation: { type: 'glow', speed: 2, intensity: 65 },
    unlockRequirement: 'Quarterly Champion achievement',
  },
  {
    id: 'eternal_presence',
    name: 'Eternal Presence',
    displayName: 'Eternal Presence',
    rarity: 'mythic',
    category: 'achievement',
    description: 'Maintained a 365-day login streak',
    color: '#ef4444',
    gradientColors: ['#ef4444', '#f59e0b', '#fcd34d'],
    animation: { type: 'fire', speed: 2, intensity: 85 },
    unlockRequirement: 'Yearly Legend achievement',
  },
  {
    id: 'trendsetter',
    name: 'Trendsetter',
    displayName: 'Trendsetter',
    rarity: 'epic',
    category: 'achievement',
    description: 'Created a post with 500+ upvotes',
    color: '#a855f7',
    animation: { type: 'sparkle', speed: 2, intensity: 55 },
    unlockRequirement: 'Viral Post achievement',
  },
  {
    id: 'voice_of_the_people',
    name: 'Voice of the People',
    displayName: 'Voice of the People',
    rarity: 'epic',
    category: 'achievement',
    description: 'Started a discussion with 100+ replies',
    color: '#a855f7',
    gradientColors: ['#a855f7', '#3b82f6'],
    animation: { type: 'wave', speed: 2, intensity: 60 },
    unlockRequirement: 'Debate Champion achievement',
  },
  {
    id: 'world_citizen',
    name: 'World Citizen',
    displayName: 'World Citizen',
    rarity: 'rare',
    category: 'achievement',
    description: 'Interacted with users from 10 countries',
    color: '#3b82f6',
    animation: { type: 'shimmer', speed: 3, intensity: 45 },
    unlockRequirement: 'Globe Trotter achievement',
  },
  {
    id: 'year_one',
    name: 'Year One',
    displayName: 'Year One',
    rarity: 'epic',
    category: 'achievement',
    description: 'Been a member for 365 days',
    color: '#a855f7',
    animation: { type: 'glow', speed: 2.5, intensity: 55 },
    unlockRequirement: 'Annual Advocate achievement',
  },
  {
    id: 'veteran',
    name: 'Veteran',
    displayName: 'Veteran',
    rarity: 'legendary',
    category: 'achievement',
    description: 'Been a member for 730 days',
    color: '#f59e0b',
    gradientColors: ['#f59e0b', '#fcd34d'],
    animation: { type: 'shimmer', speed: 2, intensity: 65 },
    unlockRequirement: 'Two Year Titan achievement',
  },
  {
    id: 'the_timeless',
    name: 'The Timeless',
    displayName: 'The Timeless',
    rarity: 'mythic',
    category: 'achievement',
    description: 'Been a member for 5 years',
    color: '#ef4444',
    gradientColors: ['#ef4444', '#f59e0b'],
    animation: { type: 'sparkle', speed: 2, intensity: 90 },
    unlockRequirement: 'Five Year Legend achievement',
  },
  {
    id: 'rising_star',
    name: 'Rising Star',
    displayName: 'Rising Star',
    rarity: 'rare',
    category: 'achievement',
    description: 'Reached top 100 on any leaderboard',
    color: '#3b82f6',
    animation: { type: 'glow', speed: 2.5, intensity: 45 },
    unlockRequirement: 'Top 100 achievement',
  },
  {
    id: 'champion',
    name: 'Champion',
    displayName: 'Champion',
    rarity: 'mythic',
    category: 'achievement',
    description: 'Reached #1 on any leaderboard',
    color: '#ef4444',
    gradientColors: ['#ffd700', '#ef4444'],
    animation: { type: 'fire', speed: 1.5, intensity: 80 },
    unlockRequirement: 'Number One achievement',
  },

  // ==================== PREMIUM TITLES ====================
  {
    id: 'vip',
    name: 'VIP',
    displayName: 'VIP',
    rarity: 'rare',
    category: 'premium',
    description: 'Premium subscriber',
    color: '#3b82f6',
    gradientColors: ['#3b82f6', '#8b5cf6'],
    animation: { type: 'shimmer', speed: 2, intensity: 50 },
    coinPrice: 0,
  },
  {
    id: 'elite',
    name: 'Elite',
    displayName: 'Elite',
    rarity: 'epic',
    category: 'premium',
    description: 'Premium+ subscriber',
    color: '#a855f7',
    gradientColors: ['#a855f7', '#ec4899'],
    animation: { type: 'glow', speed: 2, intensity: 60 },
    coinPrice: 0,
  },
  {
    id: 'cyber_punk',
    name: 'Cyber Punk',
    displayName: 'Cyber Punk',
    rarity: 'rare',
    category: 'premium',
    description: 'Neon-lit digital rebel',
    color: '#00ffff',
    gradientColors: ['#00ffff', '#ff00ff'],
    animation: { type: 'electric', speed: 1.5, intensity: 55 },
    coinPrice: 1500,
  },
  {
    id: 'shadow_walker',
    name: 'Shadow Walker',
    displayName: 'Shadow Walker',
    rarity: 'epic',
    category: 'premium',
    description: 'Moves unseen through the digital realm',
    color: '#1a1a2e',
    gradientColors: ['#1a1a2e', '#4a148c'],
    animation: { type: 'pulse', speed: 3, intensity: 40 },
    coinPrice: 2000,
  },
  {
    id: 'cosmic_traveler',
    name: 'Cosmic Traveler',
    displayName: 'Cosmic Traveler',
    rarity: 'epic',
    category: 'premium',
    description: 'Explorer of digital galaxies',
    color: '#8b5cf6',
    gradientColors: ['#8b5cf6', '#3b82f6', '#06b6d4'],
    animation: { type: 'sparkle', speed: 2.5, intensity: 60 },
    coinPrice: 2500,
  },
  {
    id: 'flame_bearer',
    name: 'Flame Bearer',
    displayName: 'Flame Bearer',
    rarity: 'legendary',
    category: 'premium',
    description: 'Carrier of the eternal flame',
    color: '#ff4400',
    gradientColors: ['#ff4400', '#ff8800', '#ffcc00'],
    animation: { type: 'fire', speed: 1.5, intensity: 80 },
    coinPrice: 3500,
  },
  {
    id: 'frost_monarch',
    name: 'Frost Monarch',
    displayName: 'Frost Monarch',
    rarity: 'legendary',
    category: 'premium',
    description: 'Ruler of the frozen digital tundra',
    color: '#00ffff',
    gradientColors: ['#00ffff', '#87ceeb', '#ffffff'],
    animation: { type: 'ice', speed: 2, intensity: 75 },
    coinPrice: 3500,
  },
  {
    id: 'void_lord',
    name: 'Void Lord',
    displayName: 'Void Lord',
    rarity: 'mythic',
    category: 'premium',
    description: 'Master of the digital void',
    color: '#0d0015',
    gradientColors: ['#0d0015', '#1a0033', '#4a0e4e'],
    animation: { type: 'pulse', speed: 4, intensity: 90 },
    coinPrice: 5000,
  },
  {
    id: 'celestial_being',
    name: 'Celestial Being',
    displayName: 'Celestial Being',
    rarity: 'mythic',
    category: 'premium',
    description: 'Ascended beyond mortal limits',
    color: '#ffd700',
    gradientColors: ['#ffd700', '#ffffff', '#ffd700'],
    animation: { type: 'sparkle', speed: 2, intensity: 100 },
    coinPrice: 6000,
  },

  // ==================== EVENT TITLES ====================
  {
    id: 'beta_tester',
    name: 'Beta Tester',
    displayName: 'Beta Tester',
    rarity: 'rare',
    category: 'event',
    description: 'Helped test CGraph in beta',
    color: '#3b82f6',
    animation: { type: 'shimmer', speed: 3, intensity: 40 },
    isLimited: true,
  },
  {
    id: 'founding_member',
    name: 'Founding Member',
    displayName: 'Founder',
    rarity: 'legendary',
    category: 'event',
    description: 'Among the first 1000 users',
    color: '#f59e0b',
    gradientColors: ['#f59e0b', '#22c55e'],
    animation: { type: 'glow', speed: 2.5, intensity: 70 },
    isLimited: true,
  },
  {
    id: 'anniversary_2024',
    name: '2024 Anniversary',
    displayName: '2024 Veteran',
    rarity: 'epic',
    category: 'event',
    description: 'Celebrated CGraph anniversary 2024',
    color: '#a855f7',
    gradientColors: ['#a855f7', '#ec4899'],
    animation: { type: 'sparkle', speed: 2, intensity: 55 },
    isLimited: true,
  },
  {
    id: 'summer_festival',
    name: 'Summer Festival',
    displayName: 'Summer Star',
    rarity: 'common',
    category: 'event',
    description: 'Participated in Summer Festival event',
    color: '#f59e0b',
    animation: { type: 'wave', speed: 3, intensity: 40 },
    isLimited: true,
  },
  {
    id: 'winter_champion',
    name: 'Winter Champion',
    displayName: 'Frost Champion',
    rarity: 'rare',
    category: 'event',
    description: 'Winner of Winter Games event',
    color: '#00ffff',
    gradientColors: ['#00ffff', '#ffffff'],
    animation: { type: 'ice', speed: 2.5, intensity: 50 },
    isLimited: true,
  },
  {
    id: 'bug_hunter',
    name: 'Bug Hunter',
    displayName: 'Bug Hunter',
    rarity: 'epic',
    category: 'event',
    description: 'Reported critical bugs',
    color: '#22c55e',
    animation: { type: 'pulse', speed: 2, intensity: 50 },
    isLimited: true,
  },

  // ==================== LEADERBOARD TITLES ====================
  {
    id: 'top_10_weekly',
    name: 'Weekly Top 10',
    displayName: 'Weekly Elite',
    rarity: 'rare',
    category: 'leaderboard',
    description: 'Reached top 10 in weekly leaderboard',
    color: '#3b82f6',
    animation: { type: 'shimmer', speed: 2, intensity: 45 },
  },
  {
    id: 'top_3_weekly',
    name: 'Weekly Podium',
    displayName: 'Weekly Champion',
    rarity: 'epic',
    category: 'leaderboard',
    description: 'Reached top 3 in weekly leaderboard',
    color: '#a855f7',
    gradientColors: ['#ffd700', '#c0c0c0', '#cd7f32'],
    animation: { type: 'glow', speed: 2, intensity: 60 },
  },
  {
    id: 'top_1_weekly',
    name: 'Weekly Champion',
    displayName: '#1 Weekly',
    rarity: 'legendary',
    category: 'leaderboard',
    description: 'Reached #1 in weekly leaderboard',
    color: '#ffd700',
    gradientColors: ['#ffd700', '#ffed4a'],
    animation: { type: 'sparkle', speed: 1.5, intensity: 75 },
  },
  {
    id: 'top_10_monthly',
    name: 'Monthly Top 10',
    displayName: 'Monthly Elite',
    rarity: 'epic',
    category: 'leaderboard',
    description: 'Reached top 10 in monthly leaderboard',
    color: '#a855f7',
    animation: { type: 'wave', speed: 2.5, intensity: 55 },
  },
  {
    id: 'top_3_monthly',
    name: 'Monthly Podium',
    displayName: 'Monthly Star',
    rarity: 'legendary',
    category: 'leaderboard',
    description: 'Reached top 3 in monthly leaderboard',
    color: '#f59e0b',
    gradientColors: ['#f59e0b', '#fcd34d'],
    animation: { type: 'glow', speed: 2, intensity: 70 },
  },
  {
    id: 'top_1_monthly',
    name: 'Monthly Champion',
    displayName: '#1 Monthly',
    rarity: 'mythic',
    category: 'leaderboard',
    description: 'Reached #1 in monthly leaderboard',
    color: '#ef4444',
    gradientColors: ['#ffd700', '#ef4444'],
    animation: { type: 'fire', speed: 1.5, intensity: 85 },
  },
  {
    id: 'all_time_legend',
    name: 'All-Time Legend',
    displayName: 'All-Time Legend',
    rarity: 'mythic',
    category: 'leaderboard',
    description: 'Top 10 in all-time leaderboard',
    color: '#ef4444',
    gradientColors: ['#ef4444', '#f59e0b', '#fcd34d'],
    animation: { type: 'rainbow', speed: 3, intensity: 100 },
  },

  // ==================== SPECIAL TITLES ====================
  {
    id: 'developer',
    name: 'Developer',
    displayName: 'Developer',
    rarity: 'mythic',
    category: 'special',
    description: 'CGraph development team member',
    color: '#ec4899',
    gradientColors: ['#ec4899', '#8b5cf6'],
    animation: { type: 'rainbow', speed: 3, intensity: 80 },
  },
  {
    id: 'community_manager',
    name: 'Community Manager',
    displayName: 'CM',
    rarity: 'mythic',
    category: 'special',
    description: 'Official community manager',
    color: '#06b6d4',
    gradientColors: ['#06b6d4', '#3b82f6'],
    animation: { type: 'glow', speed: 2, intensity: 60 },
  },
  {
    id: 'moderator',
    name: 'Moderator',
    displayName: 'Mod',
    rarity: 'epic',
    category: 'special',
    description: 'Trusted forum moderator',
    color: '#22c55e',
    animation: { type: 'pulse', speed: 3, intensity: 40 },
  },
  {
    id: 'partner',
    name: 'Partner',
    displayName: 'Partner',
    rarity: 'legendary',
    category: 'special',
    description: 'Official CGraph partner',
    color: '#f59e0b',
    gradientColors: ['#f59e0b', '#8b5cf6'],
    animation: { type: 'shimmer', speed: 2, intensity: 65 },
  },
  {
    id: 'verified_creator',
    name: 'Verified Creator',
    displayName: 'Creator',
    rarity: 'rare',
    category: 'special',
    description: 'Verified content creator',
    color: '#3b82f6',
    animation: { type: 'glow', speed: 2.5, intensity: 50 },
  },
];

/**
 * Get title by ID
 */
export function getTitleById(id: string): Title | undefined {
  return TITLES.find(t => t.id === id);
}

/**
 * Get titles by category
 */
export function getTitlesByCategory(category: TitleCategory): Title[] {
  return TITLES.filter(t => t.category === category);
}

/**
 * Get titles by rarity
 */
export function getTitlesByRarity(rarity: TitleRarity): Title[] {
  return TITLES.filter(t => t.rarity === rarity);
}

/**
 * Get purchasable titles
 */
export function getPurchasableTitles(): Title[] {
  return TITLES.filter(t => t.coinPrice !== undefined && t.coinPrice > 0);
}

/**
 * Get achievement-unlocked titles
 */
export function getAchievementTitles(): Title[] {
  return TITLES.filter(t => t.category === 'achievement');
}

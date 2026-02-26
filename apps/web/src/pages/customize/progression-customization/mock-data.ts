/**
 * Mock data for progression customization features.
 * @module pages/customize/progression-customization/mock-data
 */
import type { Achievement, LeaderboardEntry, Quest, DailyReward } from './types';

/**
 * Mock Data for Gamification Features
 *
 * NOTE: These are placeholder data. In production, these should come from the backend API. * @todo(api) Create achievements API endpoints and replace this mock data in Phase 3+.
 */

export const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach1',
    name: 'Early Adopter',
    description: 'Join CGraph in the first month',
    icon: '🌟',
    rarity: 'legendary',
    progress: 1,
    maxProgress: 1,
    unlocked: true,
    reward: { xp: 500, item: 'Golden Border' },
  },
  {
    id: 'ach2',
    name: 'Social Butterfly',
    description: 'Make 10 friends',
    icon: '👥',
    rarity: 'common',
    progress: 7,
    maxProgress: 10,
    unlocked: false,
    reward: { xp: 100, coins: 50 },
  },
  {
    id: 'ach3',
    name: 'Message Master',
    description: 'Send 1000 messages',
    icon: '💬',
    rarity: 'rare',
    progress: 847,
    maxProgress: 1000,
    unlocked: false,
    reward: { xp: 250, coins: 100 },
  },
  {
    id: 'ach4',
    name: 'Forum Legend',
    description: 'Create 100 forum posts',
    icon: '📝',
    rarity: 'epic',
    progress: 42,
    maxProgress: 100,
    unlocked: false,
    reward: { xp: 350, item: 'Forum Master Title' },
  },
  {
    id: 'ach5',
    name: 'Streak King',
    description: '30 day login streak',
    icon: '🔥',
    rarity: 'legendary',
    progress: 12,
    maxProgress: 30,
    unlocked: false,
    reward: { xp: 500, item: 'Flame Border' },
  },
  {
    id: 'ach6',
    name: 'Reaction Expert',
    description: 'React to 500 messages',
    icon: '❤️',
    rarity: 'common',
    progress: 312,
    maxProgress: 500,
    unlocked: false,
    reward: { xp: 150, coins: 75 },
  },
];

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: '1',
    username: 'GamingLegend',
    displayName: 'Gaming Legend',
    level: 42,
    xp: 125430,
  },
  {
    rank: 2,
    userId: '2',
    username: 'ProGamer',
    displayName: 'Pro Gamer',
    level: 40,
    xp: 118240,
  },
  {
    rank: 3,
    userId: '3',
    username: 'ElitePlayer',
    displayName: 'Elite Player',
    level: 38,
    xp: 112850,
  },
  {
    rank: 4,
    userId: 'current',
    username: 'You',
    displayName: 'You',
    level: 25,
    xp: 67500,
    isCurrentUser: true,
  },
  {
    rank: 5,
    userId: '5',
    username: 'CasualUser',
    displayName: 'Casual User',
    level: 22,
    xp: 58320,
  },
];

export const MOCK_QUESTS: Quest[] = [
  {
    id: 'quest1',
    name: 'Daily Chatter',
    description: 'Send 20 messages today',
    type: 'daily',
    progress: 14,
    maxProgress: 20,
    completed: false,
    reward: { xp: 50, coins: 25 },
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
  },
  {
    id: 'quest2',
    name: 'Social Hour',
    description: 'React to 10 messages',
    type: 'daily',
    progress: 10,
    maxProgress: 10,
    completed: true,
    reward: { xp: 30, coins: 15 },
  },
  {
    id: 'quest3',
    name: 'Weekly Warrior',
    description: 'Login 5 days this week',
    type: 'weekly',
    progress: 3,
    maxProgress: 5,
    completed: false,
    reward: { xp: 200, coins: 100 },
    expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'quest4',
    name: 'Forum Explorer',
    description: 'Visit 3 different forums',
    type: 'daily',
    progress: 2,
    maxProgress: 3,
    completed: false,
    reward: { xp: 40, coins: 20 },
  },
  {
    id: 'quest5',
    name: 'Community Builder',
    description: 'Help 5 new users',
    type: 'special',
    progress: 1,
    maxProgress: 5,
    completed: false,
    reward: { xp: 500, coins: 250 },
  },
];

export const MOCK_DAILY_REWARDS: DailyReward[] = [
  { day: 1, claimed: true, reward: { xp: 50, coins: 25 } },
  { day: 2, claimed: true, reward: { xp: 60, coins: 30 } },
  { day: 3, claimed: true, reward: { xp: 70, coins: 35 } },
  { day: 4, claimed: true, reward: { xp: 80, coins: 40 } },
  { day: 5, claimed: false, reward: { xp: 100, coins: 50, item: 'Mystery Box' } },
  { day: 6, claimed: false, reward: { xp: 120, coins: 60 } },
  { day: 7, claimed: false, reward: { xp: 200, coins: 100, item: 'Premium Border' } },
];

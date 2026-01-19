/**
 * Gamification Services
 * 
 * API and business logic services for gamification.
 */

// API endpoints for gamification
export const gamificationApi = {
  // XP & Levels (gamification routes)
  getProgress: () => '/api/v1/gamification/stats',
  getLeaderboard: (type: 'weekly' | 'monthly' | 'allTime') => `/api/v1/gamification/leaderboard/${type}`,
  getLevelInfo: () => '/api/v1/gamification/level-info',
  getXpHistory: () => '/api/v1/gamification/xp/history',
  
  // Achievements
  getAchievements: () => '/api/v1/gamification/achievements',
  getAchievement: (id: string) => `/api/v1/gamification/achievements/${id}`,
  unlockAchievement: (id: string) => `/api/v1/gamification/achievements/${id}/unlock`,
  
  // Quests (separate /quests routes)
  getQuests: () => '/api/v1/quests',
  getActiveQuests: () => '/api/v1/quests/active',
  getDailyQuests: () => '/api/v1/quests/daily',
  getWeeklyQuests: () => '/api/v1/quests/weekly',
  getQuest: (id: string) => `/api/v1/quests/${id}`,
  acceptQuest: (id: string) => `/api/v1/quests/${id}/accept`,
  claimQuestReward: (id: string) => `/api/v1/quests/${id}/claim`,
  
  // Titles (separate /titles routes)
  getTitles: () => '/api/v1/titles',
  getOwnedTitles: () => '/api/v1/titles/owned',
  equipTitle: (id: string) => `/api/v1/titles/${id}/equip`,
  unequipTitle: () => '/api/v1/titles/unequip',
  purchaseTitle: (id: string) => `/api/v1/titles/${id}/purchase`,
  
  // Shop (separate /shop routes)
  getShopItems: () => '/api/v1/shop',
  getShopCategories: () => '/api/v1/shop/categories',
  getShopPurchases: () => '/api/v1/shop/purchases',
  getShopItem: (id: string) => `/api/v1/shop/${id}`,
  purchaseItem: (id: string) => `/api/v1/shop/${id}/purchase`,
  
  // Streaks
  claimStreak: () => '/api/v1/gamification/streak/claim',
};

// XP reward values for different actions
export const XP_REWARDS = {
  // Messaging
  SEND_MESSAGE: 1,
  SEND_FIRST_MESSAGE_OF_DAY: 5,
  RECEIVE_REACTION: 2,
  USE_VOICE_MESSAGE: 3,
  
  // Forums
  CREATE_THREAD: 10,
  REPLY_TO_THREAD: 5,
  RECEIVE_UPVOTE: 3,
  THREAD_VIEWED_100: 25,
  THREAD_PINNED: 50,
  
  // Social
  ADD_FRIEND: 5,
  JOIN_GROUP: 10,
  INVITE_ACCEPTED: 25,
  REFERRAL_SIGNUP: 100,
  
  // Engagement
  DAILY_LOGIN: 10,
  WEEKLY_STREAK: 50,
  MONTHLY_STREAK: 200,
  
  // Premium
  FIRST_PURCHASE: 100,
  PREMIUM_SUBSCRIPTION: 500,
} as const;

// Achievement categories
export const ACHIEVEMENT_CATEGORIES = [
  'messaging',
  'forums',
  'social',
  'engagement',
  'premium',
  'special',
] as const;

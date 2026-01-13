/**
 * Gamification Services
 * 
 * API and business logic services for gamification.
 */

// API endpoints for gamification
export const gamificationApi = {
  // XP & Levels
  getProgress: () => '/api/v1/gamification/progress',
  getLeaderboard: (type: 'weekly' | 'monthly' | 'allTime') => `/api/v1/gamification/leaderboard?type=${type}`,
  
  // Achievements
  getAchievements: () => '/api/v1/gamification/achievements',
  getAchievement: (id: string) => `/api/v1/gamification/achievements/${id}`,
  unlockAchievement: (id: string) => `/api/v1/gamification/achievements/${id}/unlock`,
  
  // Quests
  getQuests: () => '/api/v1/gamification/quests',
  getActiveQuests: () => '/api/v1/gamification/quests/active',
  completeQuest: (id: string) => `/api/v1/gamification/quests/${id}/complete`,
  claimQuestReward: (id: string) => `/api/v1/gamification/quests/${id}/claim`,
  
  // Titles
  getTitles: () => '/api/v1/gamification/titles',
  equipTitle: (id: string) => `/api/v1/gamification/titles/${id}/equip`,
  unequipTitle: () => '/api/v1/gamification/titles/unequip',
  
  // Shop
  getShopItems: () => '/api/v1/gamification/shop',
  purchaseItem: (id: string) => `/api/v1/gamification/shop/${id}/purchase`,
  
  // Streaks
  getStreak: () => '/api/v1/gamification/streak',
  checkIn: () => '/api/v1/gamification/streak/checkin',
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

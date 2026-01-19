/**
 * Gamification Services (Mobile)
 */

import { API_URL } from '@/services/api';

export const gamificationApi = {
  // Stats & Progress
  getProgress: () => `${API_URL}/api/v1/gamification/stats`,
  getLevelInfo: () => `${API_URL}/api/v1/gamification/level-info`,
  getLeaderboard: (type: string) => `${API_URL}/api/v1/gamification/leaderboard/${type}`,
  getXpHistory: () => `${API_URL}/api/v1/gamification/xp/history`,
  
  // Achievements
  getAchievements: () => `${API_URL}/api/v1/gamification/achievements`,
  getAchievement: (id: string) => `${API_URL}/api/v1/gamification/achievements/${id}`,
  unlockAchievement: (id: string) => `${API_URL}/api/v1/gamification/achievements/${id}/unlock`,
  
  // Quests (separate /quests routes)
  getQuests: () => `${API_URL}/api/v1/quests`,
  getActiveQuests: () => `${API_URL}/api/v1/quests/active`,
  getDailyQuests: () => `${API_URL}/api/v1/quests/daily`,
  getWeeklyQuests: () => `${API_URL}/api/v1/quests/weekly`,
  getQuest: (id: string) => `${API_URL}/api/v1/quests/${id}`,
  acceptQuest: (id: string) => `${API_URL}/api/v1/quests/${id}/accept`,
  claimQuestReward: (id: string) => `${API_URL}/api/v1/quests/${id}/claim`,
  
  // Titles (separate /titles routes)
  getTitles: () => `${API_URL}/api/v1/titles`,
  getOwnedTitles: () => `${API_URL}/api/v1/titles/owned`,
  equipTitle: (id: string) => `${API_URL}/api/v1/titles/${id}/equip`,
  unequipTitle: () => `${API_URL}/api/v1/titles/unequip`,
  purchaseTitle: (id: string) => `${API_URL}/api/v1/titles/${id}/purchase`,
  
  // Shop (separate /shop routes)
  getShopItems: () => `${API_URL}/api/v1/shop`,
  getShopItem: (id: string) => `${API_URL}/api/v1/shop/${id}`,
  purchaseItem: (id: string) => `${API_URL}/api/v1/shop/${id}/purchase`,
  
  // Streaks
  claimStreak: () => `${API_URL}/api/v1/gamification/streak/claim`,
};

export const XP_REWARDS = {
  SEND_MESSAGE: 1,
  SEND_FIRST_MESSAGE_OF_DAY: 5,
  RECEIVE_REACTION: 2,
  USE_VOICE_MESSAGE: 3,
  CREATE_THREAD: 10,
  REPLY_TO_THREAD: 5,
  RECEIVE_UPVOTE: 3,
  ADD_FRIEND: 5,
  JOIN_GROUP: 10,
  DAILY_LOGIN: 10,
} as const;

/**
 * Gamification Services (Mobile)
 */

import { API_URL } from '@/services/api';

export const gamificationApi = {
  getProgress: () => `${API_URL}/api/v1/gamification/progress`,
  getLeaderboard: (type: string) => `${API_URL}/api/v1/gamification/leaderboard?type=${type}`,
  getAchievements: () => `${API_URL}/api/v1/gamification/achievements`,
  getQuests: () => `${API_URL}/api/v1/gamification/quests`,
  getActiveQuests: () => `${API_URL}/api/v1/gamification/quests/active`,
  completeQuest: (id: string) => `${API_URL}/api/v1/gamification/quests/${id}/complete`,
  claimQuestReward: (id: string) => `${API_URL}/api/v1/gamification/quests/${id}/claim`,
  getTitles: () => `${API_URL}/api/v1/gamification/titles`,
  equipTitle: (id: string) => `${API_URL}/api/v1/gamification/titles/${id}/equip`,
  getShopItems: () => `${API_URL}/api/v1/gamification/shop`,
  purchaseItem: (id: string) => `${API_URL}/api/v1/gamification/shop/${id}/purchase`,
  checkIn: () => `${API_URL}/api/v1/gamification/streak/checkin`,
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

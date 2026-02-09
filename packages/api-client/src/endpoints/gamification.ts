/**
 * Gamification endpoints — leaderboard, achievements, XP, quests, rewards.
 */
import type { HttpHelpers, ApiResponse, PaginatedResponse, PaginationParams } from '../client';

export interface LeaderboardEntry {
  readonly rank: number;
  readonly user_id: string;
  readonly username: string;
  readonly display_name: string | null;
  readonly avatar_url: string | null;
  readonly xp: number;
  readonly level: number;
}

export interface Achievement {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly xp_reward: number;
  readonly unlocked_at: string | null;
  readonly progress: number;
  readonly required: number;
}

export interface Quest {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly xp_reward: number;
  readonly coin_reward: number;
  readonly progress: number;
  readonly required: number;
  readonly expires_at: string | null;
}

export interface GamificationEndpoints {
  getLeaderboard(params?: PaginationParams & { period?: 'daily' | 'weekly' | 'monthly' | 'all_time' }): Promise<PaginatedResponse<LeaderboardEntry>>;
  getMyRank(): Promise<ApiResponse<{ rank: number; xp: number; level: number }>>;
  getAchievements(params?: PaginationParams): Promise<PaginatedResponse<Achievement>>;
  claimAchievement(id: string): Promise<ApiResponse<{ xp_gained: number }>>;
  getQuests(): Promise<ApiResponse<Quest[]>>;
  claimQuestReward(id: string): Promise<ApiResponse<{ xp_gained: number; coins_gained: number }>>;
}

export function createGamificationEndpoints(http: HttpHelpers): GamificationEndpoints {
  return {
    getLeaderboard: (params) =>
      http.get('/api/v1/gamification/leaderboard', { cursor: params?.cursor, limit: params?.limit, period: params?.period }),
    getMyRank: () =>
      http.get('/api/v1/gamification/me/rank'),
    getAchievements: (params) =>
      http.get('/api/v1/gamification/achievements', { cursor: params?.cursor, limit: params?.limit }),
    claimAchievement: (id) =>
      http.post(`/api/v1/gamification/achievements/${id}/claim`),
    getQuests: () =>
      http.get('/api/v1/gamification/quests'),
    claimQuestReward: (id) =>
      http.post(`/api/v1/gamification/quests/${id}/claim`),
  };
}

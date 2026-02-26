/**
 * Seasonal Event Actions
 *
 * Store action implementations for the seasonal event system,
 * including API calls for events, progress, rewards, and leaderboards.
 */

import { createLogger } from '@/lib/logger';
import { api } from '@/lib/api';
import type { SeasonalEventState, EventReward } from './seasonal-types';
import type { StoreApi } from 'zustand';

const logger = createLogger('SeasonalEventStore');

type SetFn = StoreApi<SeasonalEventState>['setState'];
type GetFn = StoreApi<SeasonalEventState>['getState'];

/**
 * unknown for the gamification module.
 */
/**
 * Creates a new seasonal actions.
 *
 * @param set - The set.
 * @param get - The get.
 * @returns The newly created instance.
 */
export function createSeasonalActions(set: SetFn, get: GetFn) {
  return {
    fetchEvents: async (includeEnded = false) => {
      set({ isLoading: true });
      try {
        const response = await api.get('/api/v1/events', {
          params: { include_ended: includeEnded },
        });
        if (response.data) {
          set({
            activeEvents: response.data.active || [],
            upcomingEvents: response.data.upcoming || [],
            endedEvents: response.data.ended || [],
            featuredEvent: response.data.featured || null,
          });
        }
      } catch (error: unknown) {
        logger.error('Failed to fetch events:', error);
      } finally {
        set({ isLoading: false });
      }
    },

    fetchEventDetails: async (eventId: string) => {
      set({ isLoading: true });
      try {
        const response = await api.get(`/api/v1/events/${eventId}`);
        if (response.data?.event) {
          set({
            currentEventId: eventId,
            currentEvent: response.data.event,
          });
        }
      } catch (error: unknown) {
        logger.error('Failed to fetch event details:', error);
      } finally {
        set({ isLoading: false });
      }
    },

    fetchProgress: async (eventId: string) => {
      try {
        const response = await api.get(`/api/v1/events/${eventId}/progress`);
        if (response.data) {
          set({
            currentProgress: response.data.progress,
            nextMilestone: response.data.nextMilestone || null,
            availableRewards: response.data.availableRewards || [],
          });
        }
      } catch (error: unknown) {
        logger.error('Failed to fetch event progress:', error);
        // User hasn't joined yet
        set({
          currentProgress: null,
          nextMilestone: null,
          availableRewards: [],
        });
      }
    },

    joinEvent: async (
      eventId: string
    ): Promise<{ success: boolean; welcomeRewards?: EventReward[] }> => {
      set({ isJoining: true });
      try {
        const response = await api.post(`/api/v1/events/${eventId}/join`);
        if (response.data?.success) {
          set({ currentProgress: response.data.progress });
          return {
            success: true,
            welcomeRewards: response.data.welcomeRewards,
          };
        }
        return { success: false };
      } catch (error: unknown) {
        logger.error('Failed to join event:', error);
        return { success: false };
      } finally {
        set({ isJoining: false });
      }
    },

    claimReward: async (
      eventId: string,
      rewardId: string
    ): Promise<{ success: boolean; reward?: EventReward }> => {
      set({ isClaiming: true });
      try {
        const response = await api.post(`/api/v1/events/${eventId}/claim-reward`, {
          reward_id: rewardId,
        });
        if (response.data?.success) {
          set({ currentProgress: response.data.progress });

          // Update available rewards
          const state = get();
          set({
            availableRewards: state.availableRewards.filter((m) => m.id !== rewardId),
          });

          return {
            success: true,
            reward: response.data.reward,
          };
        }
        return { success: false };
      } catch (error: unknown) {
        logger.error('Failed to claim reward:', error);
        return { success: false };
      } finally {
        set({ isClaiming: false });
      }
    },

    fetchLeaderboard: async (eventId: string, limit = 50, offset = 0) => {
      try {
        const response = await api.get(`/api/v1/events/${eventId}/leaderboard`, {
          params: { limit, offset },
        });
        if (response.data) {
          set({
            leaderboard: response.data.leaderboard || [],
            userRank: response.data.yourRank || null,
          });
        }
      } catch (error: unknown) {
        logger.error('Failed to fetch event leaderboard:', error);
      }
    },

    purchaseBattlePass: async (
      eventId: string
    ): Promise<{ success: boolean; retroactiveRewards?: EventReward[] }> => {
      set({ isPurchasing: true });
      try {
        const response = await api.post(`/api/v1/events/${eventId}/battle-pass/purchase`);
        if (response.data?.success) {
          set({ currentProgress: response.data.progress });
          return {
            success: true,
            retroactiveRewards: response.data.retroactiveRewards,
          };
        }
        return { success: false };
      } catch (error: unknown) {
        logger.error('Failed to purchase battle pass:', error);
        return { success: false };
      } finally {
        set({ isPurchasing: false });
      }
    },

    getTimeRemaining: (eventId: string) => {
      const state = get();
      const event = [...state.activeEvents, ...state.upcomingEvents].find((e) => e.id === eventId);
      if (!event) return null;

      const endDate = new Date(event.endsAt);
      const now = new Date();
      const diff = endDate.getTime() - now.getTime();

      if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      return { days, hours, minutes };
    },

    isEventActive: (eventId: string) => {
      const state = get();
      return state.activeEvents.some((e) => e.id === eventId);
    },

    canClaimMilestone: (milestoneId: string) => {
      const state = get();
      if (!state.currentProgress) return false;
      return state.availableRewards.some((m) => m.id === milestoneId);
    },
  };
}

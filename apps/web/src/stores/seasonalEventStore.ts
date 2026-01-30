// Logger reserved for future debugging
// import { createLogger } from '@/lib/logger';
// const _logger = createLogger('SeasonalEventStore');

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeLocalStorage } from '@/lib/safeStorage';
import { api } from '@/lib/api';

/**
 * Seasonal Event Store
 *
 * Manages seasonal and special events with:
 * - Event discovery and tracking
 * - Progress and milestones
 * - Battle pass integration
 * - Event leaderboards
 */

// ==================== TYPE DEFINITIONS ====================

export type EventType = 'seasonal' | 'holiday' | 'special' | 'anniversary' | 'collab' | 'community';
export type EventStatus = 'upcoming' | 'active' | 'ending' | 'ended';

export interface EventReward {
  id: string;
  type: 'coins' | 'gems' | 'xp' | 'title' | 'border' | 'effect' | 'badge';
  name: string;
  amount?: number;
  rarity?: string;
  previewUrl?: string;
}

export interface EventMilestone {
  id: string;
  pointsRequired: number;
  rewards: EventReward[];
  description?: string;
}

export interface BattlePassTier {
  tier: number;
  xpRequired: number;
  freeRewards: EventReward[];
  premiumRewards: EventReward[];
}

export interface SeasonalEvent {
  id: string;
  slug: string;
  name: string;
  description: string;
  type: EventType;
  status: EventStatus;
  startsAt: string;
  endsAt: string;
  bannerUrl?: string;
  iconUrl?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  hasBattlePass: boolean;
  battlePassCost: number;
  hasLeaderboard: boolean;
  featured: boolean;
  isActive: boolean;
  inGracePeriod: boolean;
  // Detailed info (optional)
  theme?: Record<string, unknown>;
  rewards?: EventReward[];
  milestoneRewards?: EventMilestone[];
  participationRewards?: EventReward[];
  eventCurrency?: string;
  eventCurrencyIcon?: string;
  multipliers?: {
    xp: number;
    coins: number;
    karma: number;
  };
  dailyChallenges?: Array<{
    id: string;
    name: string;
    description: string;
    reward: EventReward;
    progress: number;
    target: number;
  }>;
  battlePassTiers?: BattlePassTier[];
  leaderboardRewards?: EventReward[];
}

export interface EventProgress {
  eventPoints: number;
  currencyEarned: number;
  currencyBalance: number;
  questsCompleted: number;
  milestonesClaimed: string[];
  hasBattlePass: boolean;
  battlePassTier: number;
  battlePassXp: number;
  leaderboardPoints: number;
  bestRank: number | null;
  firstParticipatedAt: string | null;
  lastParticipatedAt: string | null;
  totalSessions: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  points: number;
  eventPoints: number;
  battlePassTier: number;
}

// ==================== STATE INTERFACE ====================

export interface SeasonalEventState {
  // Events
  activeEvents: SeasonalEvent[];
  upcomingEvents: SeasonalEvent[];
  endedEvents: SeasonalEvent[];
  featuredEvent: SeasonalEvent | null;

  // Current event tracking
  currentEventId: string | null;
  currentEvent: SeasonalEvent | null;
  currentProgress: EventProgress | null;
  nextMilestone: EventMilestone | null;
  availableRewards: EventMilestone[];

  // Leaderboard
  leaderboard: LeaderboardEntry[];
  userRank: number | null;

  // Loading states
  isLoading: boolean;
  isJoining: boolean;
  isClaiming: boolean;
  isPurchasing: boolean;

  // Actions
  fetchEvents: (includeEnded?: boolean) => Promise<void>;
  fetchEventDetails: (eventId: string) => Promise<void>;
  fetchProgress: (eventId: string) => Promise<void>;
  joinEvent: (eventId: string) => Promise<{ success: boolean; welcomeRewards?: EventReward[] }>;
  claimReward: (
    eventId: string,
    rewardId: string
  ) => Promise<{ success: boolean; reward?: EventReward }>;
  fetchLeaderboard: (eventId: string, limit?: number, offset?: number) => Promise<void>;
  purchaseBattlePass: (
    eventId: string
  ) => Promise<{ success: boolean; retroactiveRewards?: EventReward[] }>;

  // Computed
  getTimeRemaining: (eventId: string) => { days: number; hours: number; minutes: number } | null;
  isEventActive: (eventId: string) => boolean;
  canClaimMilestone: (milestoneId: string) => boolean;
}

// ==================== STORE IMPLEMENTATION ====================

export const useSeasonalEventStore = create<SeasonalEventState>()(
  persist(
    (set, get) => ({
      activeEvents: [],
      upcomingEvents: [],
      endedEvents: [],
      featuredEvent: null,
      currentEventId: null,
      currentEvent: null,
      currentProgress: null,
      nextMilestone: null,
      availableRewards: [],
      leaderboard: [],
      userRank: null,
      isLoading: false,
      isJoining: false,
      isClaiming: false,
      isPurchasing: false,

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
          console.error('Failed to fetch events:', error);
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
          console.error('Failed to fetch event details:', error);
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
          console.error('Failed to fetch event progress:', error);
          // User hasn't joined yet
          set({
            currentProgress: null,
            nextMilestone: null,
            availableRewards: [],
          });
        }
      },

      joinEvent: async (eventId: string) => {
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
          console.error('Failed to join event:', error);
          return { success: false };
        } finally {
          set({ isJoining: false });
        }
      },

      claimReward: async (eventId: string, rewardId: string) => {
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
          console.error('Failed to claim reward:', error);
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
          console.error('Failed to fetch event leaderboard:', error);
        }
      },

      purchaseBattlePass: async (eventId: string) => {
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
          console.error('Failed to purchase battle pass:', error);
          return { success: false };
        } finally {
          set({ isPurchasing: false });
        }
      },

      getTimeRemaining: (eventId: string) => {
        const state = get();
        const event = [...state.activeEvents, ...state.upcomingEvents].find(
          (e) => e.id === eventId
        );
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
    }),
    {
      name: 'cgraph-seasonal-events',
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        activeEvents: state.activeEvents,
        upcomingEvents: state.upcomingEvents,
        featuredEvent: state.featuredEvent,
        currentEventId: state.currentEventId,
      }),
    }
  )
);

// ==================== SELECTOR HOOKS ====================

export const useActiveEvents = () => useSeasonalEventStore((state) => state.activeEvents);

export const useFeaturedEvent = () => useSeasonalEventStore((state) => state.featuredEvent);

export const useCurrentEventProgress = () =>
  useSeasonalEventStore((state) => ({
    event: state.currentEvent,
    progress: state.currentProgress,
    nextMilestone: state.nextMilestone,
    availableRewards: state.availableRewards,
  }));

export const useEventLeaderboard = () =>
  useSeasonalEventStore((state) => ({
    leaderboard: state.leaderboard,
    userRank: state.userRank,
  }));

export const useHasActiveBattlePass = () =>
  useSeasonalEventStore((state) => state.currentProgress?.hasBattlePass ?? false);

export default useSeasonalEventStore;

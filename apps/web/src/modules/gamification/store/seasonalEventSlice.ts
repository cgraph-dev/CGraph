/**
 * Seasonal Event Store
 *
 * Manages seasonal and special events with:
 * - Event discovery and tracking
 * - Progress and milestones
 * - Battle pass integration
 * - Event leaderboards
 *
 * This is the barrel file that assembles the store from submodules.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeLocalStorage } from '@/lib/safeStorage';

// Re-export all types from the types submodule
export type {
  EventType,
  EventStatus,
  EventReward,
  EventMilestone,
  BattlePassTier,
  SeasonalEvent,
  EventProgress,
  LeaderboardEntry,
  SeasonalEventState,
} from './seasonal-types';

import type { SeasonalEventState } from './seasonal-types';
import { createSeasonalActions } from './seasonal-actions';

// Re-export selector hooks
export {
  useActiveEvents,
  useFeaturedEvent,
  useCurrentEventProgress,
  useEventLeaderboard,
  useHasActiveBattlePass,
} from './seasonal-selectors';

// ==================== STORE IMPLEMENTATION ====================

export const useSeasonalEventStore = create<SeasonalEventState>()(
  persist(
    (set, get) => ({
      // Initial state
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

      // Spread actions from submodule
      ...createSeasonalActions(set, get),
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

export default useSeasonalEventStore;

/**
 * Seasonal Event Selectors
 *
 * Selector hooks for accessing seasonal event store state.
 */

import { useSeasonalEventStore } from './seasonalEventSlice';

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

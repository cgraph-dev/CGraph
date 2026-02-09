/**
 * Seasonal Event Store Unit Tests
 *
 * Covers: initial state, fetchEvents, fetchEventDetails, fetchProgress,
 * joinEvent, claimReward, fetchLeaderboard, purchaseBattlePass,
 * getTimeRemaining, isEventActive, canClaimMilestone,
 * error handling, and edge cases.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSeasonalEventStore } from '../seasonalEventSlice';
import type { SeasonalEvent, EventProgress, EventMilestone } from '../seasonal-types';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

vi.mock('@/lib/safeStorage', () => ({
  safeLocalStorage: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

import { api } from '@/lib/api';

const mockedApi = vi.mocked(api, { deep: true });

// ── Fixtures ──────────────────────────────────────────────────────────

const futureDate = new Date(Date.now() + 86400000 * 10).toISOString(); // +10 days
const pastDate = new Date(Date.now() - 86400000).toISOString();

const mockEvent: SeasonalEvent = {
  id: 'evt-1',
  slug: 'winter-fest',
  name: 'Winter Festival',
  description: 'A snowy celebration',
  type: 'seasonal',
  status: 'active',
  startsAt: '2026-01-01T00:00:00Z',
  endsAt: futureDate,
  colors: { primary: '#fff', secondary: '#ccc', accent: '#00f' },
  hasBattlePass: true,
  battlePassCost: 500,
  hasLeaderboard: true,
  featured: true,
  isActive: true,
  inGracePeriod: false,
};

const mockEvent2: SeasonalEvent = {
  id: 'evt-2',
  slug: 'spring-bloom',
  name: 'Spring Bloom',
  description: 'Flowers!',
  type: 'holiday',
  status: 'upcoming',
  startsAt: futureDate,
  endsAt: futureDate,
  colors: { primary: '#0f0', secondary: '#0a0', accent: '#ff0' },
  hasBattlePass: false,
  battlePassCost: 0,
  hasLeaderboard: false,
  featured: false,
  isActive: false,
  inGracePeriod: false,
};

const mockProgress: EventProgress = {
  eventPoints: 1500,
  currencyEarned: 300,
  currencyBalance: 200,
  questsCompleted: 5,
  milestonesClaimed: ['m1'],
  hasBattlePass: false,
  battlePassTier: 0,
  battlePassXp: 0,
  leaderboardPoints: 1500,
  bestRank: 12,
  firstParticipatedAt: '2026-01-05T00:00:00Z',
  lastParticipatedAt: '2026-01-20T00:00:00Z',
  totalSessions: 10,
};

const mockMilestone: EventMilestone = {
  id: 'm2',
  pointsRequired: 2000,
  rewards: [{ id: 'r1', type: 'coins', name: '500 Coins', amount: 500 }],
};

function resetStore() {
  useSeasonalEventStore.setState({
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
  });
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('seasonalEventStore', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  // ==================== INITIAL STATE ====================

  describe('initial state', () => {
    it('has empty event arrays', () => {
      const s = useSeasonalEventStore.getState();
      expect(s.activeEvents).toEqual([]);
      expect(s.upcomingEvents).toEqual([]);
      expect(s.endedEvents).toEqual([]);
    });

    it('has null current event and progress', () => {
      const s = useSeasonalEventStore.getState();
      expect(s.currentEvent).toBeNull();
      expect(s.currentProgress).toBeNull();
      expect(s.featuredEvent).toBeNull();
    });

    it('has all loading flags false', () => {
      const s = useSeasonalEventStore.getState();
      expect(s.isLoading).toBe(false);
      expect(s.isJoining).toBe(false);
      expect(s.isClaiming).toBe(false);
      expect(s.isPurchasing).toBe(false);
    });
  });

  // ==================== fetchEvents ====================

  describe('fetchEvents', () => {
    it('populates active, upcoming, ended, and featured events', async () => {
      mockedApi.get.mockResolvedValueOnce({
        data: {
          active: [mockEvent],
          upcoming: [mockEvent2],
          ended: [],
          featured: mockEvent,
        },
      });

      await useSeasonalEventStore.getState().fetchEvents();

      const s = useSeasonalEventStore.getState();
      expect(s.activeEvents).toHaveLength(1);
      expect(s.upcomingEvents).toHaveLength(1);
      expect(s.featuredEvent?.id).toBe('evt-1');
      expect(s.isLoading).toBe(false);
    });

    it('passes include_ended param', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: {} });
      await useSeasonalEventStore.getState().fetchEvents(true);
      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/events', {
        params: { include_ended: true },
      });
    });

    it('handles error and clears isLoading', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('err'));
      await useSeasonalEventStore.getState().fetchEvents();
      expect(useSeasonalEventStore.getState().isLoading).toBe(false);
    });
  });

  // ==================== fetchEventDetails ====================

  describe('fetchEventDetails', () => {
    it('sets currentEvent and currentEventId', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: { event: mockEvent } });

      await useSeasonalEventStore.getState().fetchEventDetails('evt-1');

      const s = useSeasonalEventStore.getState();
      expect(s.currentEventId).toBe('evt-1');
      expect(s.currentEvent?.name).toBe('Winter Festival');
    });

    it('handles error', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('not found'));
      await useSeasonalEventStore.getState().fetchEventDetails('bad');
      expect(useSeasonalEventStore.getState().isLoading).toBe(false);
    });
  });

  // ==================== fetchProgress ====================

  describe('fetchProgress', () => {
    it('sets progress, nextMilestone, availableRewards', async () => {
      mockedApi.get.mockResolvedValueOnce({
        data: {
          progress: mockProgress,
          nextMilestone: mockMilestone,
          availableRewards: [mockMilestone],
        },
      });

      await useSeasonalEventStore.getState().fetchProgress('evt-1');

      const s = useSeasonalEventStore.getState();
      expect(s.currentProgress?.eventPoints).toBe(1500);
      expect(s.nextMilestone?.id).toBe('m2');
      expect(s.availableRewards).toHaveLength(1);
    });

    it('clears progress on error (user not joined)', async () => {
      useSeasonalEventStore.setState({ currentProgress: mockProgress });
      mockedApi.get.mockRejectedValueOnce(new Error('404'));

      await useSeasonalEventStore.getState().fetchProgress('evt-1');

      expect(useSeasonalEventStore.getState().currentProgress).toBeNull();
      expect(useSeasonalEventStore.getState().availableRewards).toEqual([]);
    });
  });

  // ==================== joinEvent ====================

  describe('joinEvent', () => {
    it('returns success with welcome rewards', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: {
          success: true,
          progress: mockProgress,
          welcomeRewards: [{ id: 'wr1', type: 'coins', name: '100 Welcome Coins', amount: 100 }],
        },
      });

      const result = await useSeasonalEventStore.getState().joinEvent('evt-1');

      expect(result.success).toBe(true);
      expect(result.welcomeRewards).toHaveLength(1);
      expect(useSeasonalEventStore.getState().isJoining).toBe(false);
    });

    it('returns failure when API returns success=false', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: { success: false } });
      const result = await useSeasonalEventStore.getState().joinEvent('evt-1');
      expect(result.success).toBe(false);
    });

    it('returns failure on error', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('err'));
      const result = await useSeasonalEventStore.getState().joinEvent('evt-1');
      expect(result.success).toBe(false);
      expect(useSeasonalEventStore.getState().isJoining).toBe(false);
    });
  });

  // ==================== claimReward ====================

  describe('claimReward', () => {
    it('updates progress and removes claimed reward from available', async () => {
      const updatedProgress = { ...mockProgress, milestonesClaimed: ['m1', 'm2'] };
      useSeasonalEventStore.setState({ availableRewards: [mockMilestone] });
      mockedApi.post.mockResolvedValueOnce({
        data: {
          success: true,
          progress: updatedProgress,
          reward: { id: 'r1', type: 'coins', name: '500 Coins', amount: 500 },
        },
      });

      const result = await useSeasonalEventStore.getState().claimReward('evt-1', 'm2');

      expect(result.success).toBe(true);
      expect(result.reward?.name).toBe('500 Coins');
      expect(useSeasonalEventStore.getState().availableRewards).toHaveLength(0);
      expect(useSeasonalEventStore.getState().isClaiming).toBe(false);
    });

    it('returns failure on error', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('err'));
      const result = await useSeasonalEventStore.getState().claimReward('evt-1', 'm2');
      expect(result.success).toBe(false);
      expect(useSeasonalEventStore.getState().isClaiming).toBe(false);
    });
  });

  // ==================== fetchLeaderboard ====================

  describe('fetchLeaderboard', () => {
    it('sets leaderboard and userRank', async () => {
      mockedApi.get.mockResolvedValueOnce({
        data: {
          leaderboard: [{ rank: 1, userId: 'u1', username: 'alice', points: 5000 }],
          yourRank: 12,
        },
      });

      await useSeasonalEventStore.getState().fetchLeaderboard('evt-1', 50, 0);

      expect(useSeasonalEventStore.getState().leaderboard).toHaveLength(1);
      expect(useSeasonalEventStore.getState().userRank).toBe(12);
    });
  });

  // ==================== purchaseBattlePass ====================

  describe('purchaseBattlePass', () => {
    it('returns success with retroactive rewards', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: {
          success: true,
          progress: { ...mockProgress, hasBattlePass: true },
          retroactiveRewards: [{ id: 'rr1', type: 'badge', name: 'BP Badge' }],
        },
      });

      const result = await useSeasonalEventStore.getState().purchaseBattlePass('evt-1');

      expect(result.success).toBe(true);
      expect(result.retroactiveRewards).toHaveLength(1);
      expect(useSeasonalEventStore.getState().isPurchasing).toBe(false);
    });

    it('returns failure on error', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('err'));
      const result = await useSeasonalEventStore.getState().purchaseBattlePass('evt-1');
      expect(result.success).toBe(false);
      expect(useSeasonalEventStore.getState().isPurchasing).toBe(false);
    });
  });

  // ==================== Computed ====================

  describe('getTimeRemaining', () => {
    it('returns null for unknown eventId', () => {
      expect(useSeasonalEventStore.getState().getTimeRemaining('unknown')).toBeNull();
    });

    it('returns time object for active event', () => {
      useSeasonalEventStore.setState({ activeEvents: [mockEvent] });
      const time = useSeasonalEventStore.getState().getTimeRemaining('evt-1');
      expect(time).not.toBeNull();
      expect(time!.days).toBeGreaterThanOrEqual(0);
    });

    it('returns zeros for expired event', () => {
      const expiredEvent = { ...mockEvent, endsAt: pastDate };
      useSeasonalEventStore.setState({ activeEvents: [expiredEvent] });
      const time = useSeasonalEventStore.getState().getTimeRemaining('evt-1');
      expect(time).toEqual({ days: 0, hours: 0, minutes: 0 });
    });
  });

  describe('isEventActive', () => {
    it('returns true when event is in activeEvents', () => {
      useSeasonalEventStore.setState({ activeEvents: [mockEvent] });
      expect(useSeasonalEventStore.getState().isEventActive('evt-1')).toBe(true);
    });

    it('returns false when event is not active', () => {
      expect(useSeasonalEventStore.getState().isEventActive('evt-1')).toBe(false);
    });
  });

  describe('canClaimMilestone', () => {
    it('returns true when milestone is in availableRewards', () => {
      useSeasonalEventStore.setState({
        currentProgress: mockProgress,
        availableRewards: [mockMilestone],
      });
      expect(useSeasonalEventStore.getState().canClaimMilestone('m2')).toBe(true);
    });

    it('returns false when no progress', () => {
      expect(useSeasonalEventStore.getState().canClaimMilestone('m2')).toBe(false);
    });

    it('returns false when milestone not in available', () => {
      useSeasonalEventStore.setState({ currentProgress: mockProgress, availableRewards: [] });
      expect(useSeasonalEventStore.getState().canClaimMilestone('m2')).toBe(false);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const { mockConnect, mockDisconnect, mockSubscribe } = vi.hoisted(() => ({
  mockConnect: vi.fn(),
  mockDisconnect: vi.fn(),
  mockSubscribe: vi.fn().mockReturnValue(vi.fn()),
}));

const { storeState } = vi.hoisted(() => {
  const state = {
    socket: null as null,
    channel: null as null,
    state: {
      xp: 0,
      level: 1,
      coins: 0,
      streakDays: 0,
      connected: false,
      lastError: null as string | null,
    },
    listeners: new Map<string, Set<(data: unknown) => void>>(),
    messageQueue: [] as Array<{ event: string; payload: unknown }>,
    connect: undefined as unknown as ReturnType<typeof vi.fn>,
    disconnect: undefined as unknown as ReturnType<typeof vi.fn>,
    subscribe: undefined as unknown as ReturnType<typeof vi.fn>,
    getState: vi.fn(),
    sendHeartbeat: vi.fn(),
  };
  return { storeState: state };
});

vi.mock('../gamificationSocketStore', () => ({
  useGamificationSocketStore: vi.fn((selector?: (s: typeof storeState) => unknown) => {
    // Ensure the mocks are current
    storeState.connect = mockConnect;
    storeState.disconnect = mockDisconnect;
    storeState.subscribe = mockSubscribe;
    if (typeof selector === 'function') {
      return selector(storeState);
    }
    return storeState;
  }),
}));

import {
  useGamificationSocket,
  useGamificationEvent,
  useXPUpdates,
  useLevelUp,
  useAchievementUnlock,
  useCosmeticUnlock,
  usePrestigeUpdate,
  useEventProgress,
  useEventMilestone,
  useMarketplaceNotifications,
  useGamificationToasts,
} from '../useGamificationSocket';

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useGamificationSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSubscribe.mockReturnValue(vi.fn());
    storeState.state = {
      xp: 0,
      level: 1,
      coins: 0,
      streakDays: 0,
      connected: false,
      lastError: null,
    };
  });

  it('connects when token and userId are provided', () => {
    renderHook(() => useGamificationSocket('token-1', 'user-1'));

    expect(mockConnect).toHaveBeenCalledWith('token-1', 'user-1');
  });

  it('does not connect when token is null', () => {
    renderHook(() => useGamificationSocket(null, 'user-1'));

    expect(mockConnect).not.toHaveBeenCalled();
  });

  it('does not connect when userId is null', () => {
    renderHook(() => useGamificationSocket('token-1', null));

    expect(mockConnect).not.toHaveBeenCalled();
  });

  it('disconnects on unmount', () => {
    const { unmount } = renderHook(() => useGamificationSocket('token-1', 'user-1'));

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('returns the gamification state', () => {
    storeState.state = {
      xp: 500,
      level: 5,
      coins: 200,
      streakDays: 3,
      connected: true,
      lastError: null,
    };

    const { result } = renderHook(() => useGamificationSocket('token-1', 'user-1'));

    expect(result.current).toEqual(
      expect.objectContaining({
        xp: 500,
        level: 5,
        coins: 200,
        streakDays: 3,
        connected: true,
      })
    );
  });
});

describe('useGamificationEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('subscribes to the specified event', () => {
    const callback = vi.fn();
    renderHook(() => useGamificationEvent('xp_gained', callback));

    expect(mockSubscribe).toHaveBeenCalledWith('xp_gained', expect.any(Function));
  });

  it('calls the callback when the event fires', () => {
    const callback = vi.fn();
    let subscribedHandler: (data: unknown) => void = () => {};

    mockSubscribe.mockImplementation((_event: string, handler: (data: unknown) => void) => {
      subscribedHandler = handler;
      return vi.fn();
    });

    renderHook(() => useGamificationEvent('xp_gained', callback));

    act(() => {
      subscribedHandler({ amount: 50 });
    });

    expect(callback).toHaveBeenCalledWith({ amount: 50 });
  });

  it('unsubscribes on unmount', () => {
    const unsubscribe = vi.fn();
    mockSubscribe.mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useGamificationEvent('xp_gained', vi.fn()));

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});

describe('useXPUpdates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('subscribes to xp_gained event', () => {
    const callback = vi.fn();
    renderHook(() => useXPUpdates(callback));

    expect(mockSubscribe).toHaveBeenCalledWith('xp_gained', expect.any(Function));
  });
});

describe('useLevelUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('subscribes to level_up event', () => {
    const callback = vi.fn();
    renderHook(() => useLevelUp(callback));

    expect(mockSubscribe).toHaveBeenCalledWith('level_up', expect.any(Function));
  });
});

describe('useAchievementUnlock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('subscribes to achievement_unlocked event', () => {
    const callback = vi.fn();
    renderHook(() => useAchievementUnlock(callback));

    expect(mockSubscribe).toHaveBeenCalledWith('achievement_unlocked', expect.any(Function));
  });
});

describe('useCosmeticUnlock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('subscribes to cosmetic_unlocked event', () => {
    const callback = vi.fn();
    renderHook(() => useCosmeticUnlock(callback));

    expect(mockSubscribe).toHaveBeenCalledWith('cosmetic_unlocked', expect.any(Function));
  });
});

describe('usePrestigeUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('subscribes to prestige_updated event', () => {
    const callback = vi.fn();
    renderHook(() => usePrestigeUpdate(callback));

    expect(mockSubscribe).toHaveBeenCalledWith('prestige_updated', expect.any(Function));
  });
});

describe('useEventProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('subscribes to event_progress event', () => {
    const callback = vi.fn();
    renderHook(() => useEventProgress(callback));

    expect(mockSubscribe).toHaveBeenCalledWith('event_progress', expect.any(Function));
  });
});

describe('useEventMilestone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('subscribes to event_milestone event', () => {
    const callback = vi.fn();
    renderHook(() => useEventMilestone(callback));

    expect(mockSubscribe).toHaveBeenCalledWith('event_milestone', expect.any(Function));
  });
});

describe('useMarketplaceNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('subscribes to listing_sold, item_purchased, and price_alert events', () => {
    const callback = vi.fn();
    renderHook(() => useMarketplaceNotifications(callback));

    const subscribedEvents = mockSubscribe.mock.calls.map((call) => call[0]);
    expect(subscribedEvents).toContain('listing_sold');
    expect(subscribedEvents).toContain('item_purchased');
    expect(subscribedEvents).toContain('price_alert');
  });

  it('wraps listing_sold events with correct type', () => {
    const callback = vi.fn();
    const handlers: Record<string, (data: unknown) => void> = {};

    mockSubscribe.mockImplementation((event: string, handler: (data: unknown) => void) => {
      handlers[event] = handler;
      return vi.fn();
    });

    renderHook(() => useMarketplaceNotifications(callback));

    act(() => {
      handlers['listing_sold']?.({ itemId: 'item-1' });
    });

    expect(callback).toHaveBeenCalledWith({
      type: 'listing_sold',
      data: { itemId: 'item-1' },
    });
  });
});

describe('useGamificationToasts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('subscribes to multiple gamification events for toast display', () => {
    renderHook(() => useGamificationToasts());

    // It should subscribe to at least xp_gained, achievement_unlocked, cosmetic_unlocked, prestige_updated, event_milestone
    expect(mockSubscribe.mock.calls.length).toBeGreaterThanOrEqual(5);
  });

  it('dispatches a gamification:toast event for large XP gains', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    const handlers: Record<string, (data: unknown) => void> = {};

    mockSubscribe.mockImplementation((event: string, handler: (data: unknown) => void) => {
      handlers[event] = handler;
      return vi.fn();
    });

    renderHook(() => useGamificationToasts());

    act(() => {
      handlers['xp_gained']?.({ amount: 150, source: 'quest', newTotal: 500 });
    });

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'gamification:toast',
      })
    );

    dispatchSpy.mockRestore();
  });
});

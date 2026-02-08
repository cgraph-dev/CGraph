import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/setup';

import { useSubscription, useSubscriptions } from '../useSubscription';

// ─── useSubscription ─────────────────────────────────────────────────────────

describe('useSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns not subscribed by default when no initial subscription', () => {
    const { result } = renderHook(() => useSubscription('thread', 'thread-1'));
    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.subscription).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('returns subscribed when initial subscription is provided', () => {
    const initialSub = {
      id: 'sub-1',
      type: 'thread' as const,
      targetId: 'thread-1',
      targetName: 'My Thread',
      notificationMode: 'instant' as const,
      emailNotifications: true,
      pushNotifications: true,
      unreadCount: 3,
    };
    const { result } = renderHook(() => useSubscription('thread', 'thread-1', initialSub));
    expect(result.current.isSubscribed).toBe(true);
    expect(result.current.subscription).toEqual(initialSub);
  });

  it('subscribe sends POST and sets subscription', async () => {
    const newSub = {
      id: 'sub-2',
      type: 'forum',
      targetId: 'forum-1',
      targetName: 'Forum',
      notificationMode: 'daily',
      emailNotifications: true,
      pushNotifications: true,
      unreadCount: 0,
    };
    server.use(
      http.post('/api/forum/subscriptions', () => HttpResponse.json({ subscription: newSub }))
    );

    const { result } = renderHook(() => useSubscription('forum', 'forum-1'));
    await act(async () => {
      await result.current.subscribe({ notificationMode: 'daily' });
    });

    expect(result.current.isSubscribed).toBe(true);
    expect(result.current.subscription).toEqual(newSub);
  });

  it('unsubscribe sends DELETE and clears subscription', async () => {
    const initialSub = {
      id: 'sub-1',
      type: 'thread' as const,
      targetId: 'thread-1',
      targetName: 'Thread',
      notificationMode: 'instant' as const,
      emailNotifications: true,
      pushNotifications: true,
      unreadCount: 0,
    };
    server.use(
      http.delete('/api/forum/subscriptions/sub-1', () => new HttpResponse(null, { status: 200 }))
    );

    const { result } = renderHook(() => useSubscription('thread', 'thread-1', initialSub));
    expect(result.current.isSubscribed).toBe(true);

    await act(async () => {
      await result.current.unsubscribe();
    });

    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.subscription).toBeNull();
  });

  it('unsubscribe does nothing when not subscribed', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { result } = renderHook(() => useSubscription('thread', 'thread-1'));
    await act(async () => {
      await result.current.unsubscribe();
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('toggle subscribes when not subscribed', async () => {
    const newSub = {
      id: 'sub-3',
      type: 'board',
      targetId: 'board-1',
      targetName: 'Board',
      notificationMode: 'instant',
      emailNotifications: true,
      pushNotifications: true,
      unreadCount: 0,
    };
    server.use(
      http.post('/api/forum/subscriptions', () => HttpResponse.json({ subscription: newSub }))
    );

    const { result } = renderHook(() => useSubscription('board', 'board-1'));
    await act(async () => {
      await result.current.toggle();
    });

    expect(result.current.isSubscribed).toBe(true);
  });

  it('toggle unsubscribes when already subscribed', async () => {
    const initialSub = {
      id: 'sub-4',
      type: 'thread' as const,
      targetId: 'thread-2',
      targetName: 'Thread 2',
      notificationMode: 'weekly' as const,
      emailNotifications: false,
      pushNotifications: true,
      unreadCount: 1,
    };
    server.use(
      http.delete('/api/forum/subscriptions/sub-4', () => new HttpResponse(null, { status: 200 }))
    );

    const { result } = renderHook(() => useSubscription('thread', 'thread-2', initialSub));
    await act(async () => {
      await result.current.toggle();
    });

    expect(result.current.isSubscribed).toBe(false);
  });

  it('updateSettings sends PATCH and updates subscription state', async () => {
    const initialSub = {
      id: 'sub-5',
      type: 'forum' as const,
      targetId: 'forum-2',
      targetName: 'Forum 2',
      notificationMode: 'instant' as const,
      emailNotifications: true,
      pushNotifications: true,
      unreadCount: 0,
    };
    server.use(
      http.patch('/api/forum/subscriptions/sub-5', () => new HttpResponse(null, { status: 200 }))
    );

    const { result } = renderHook(() => useSubscription('forum', 'forum-2', initialSub));
    await act(async () => {
      await result.current.updateSettings({
        notificationMode: 'weekly',
        emailNotifications: false,
      });
    });

    expect(result.current.subscription?.notificationMode).toBe('weekly');
    expect(result.current.subscription?.emailNotifications).toBe(false);
  });

  it('updateSettings does nothing when not subscribed', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { result } = renderHook(() => useSubscription('thread', 'thread-1'));
    await act(async () => {
      await result.current.updateSettings({ notificationMode: 'daily' });
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('subscribe throws and resets isLoading on network failure', async () => {
    server.use(
      http.post('/api/forum/subscriptions', () => new HttpResponse(null, { status: 500 }))
    );

    const { result } = renderHook(() => useSubscription('thread', 'thread-1'));

    await expect(
      act(async () => {
        await result.current.subscribe();
      })
    ).rejects.toThrow('Failed to subscribe');

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSubscribed).toBe(false);
  });
});

// ─── useSubscriptions ────────────────────────────────────────────────────────

describe('useSubscriptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty subscriptions initially', () => {
    const { result } = renderHook(() => useSubscriptions());
    expect(result.current.subscriptions).toEqual([]);
    expect(result.current.totalUnread).toBe(0);
  });

  it('refresh fetches and populates subscriptions', async () => {
    const subs = [
      {
        id: 's1',
        type: 'thread',
        targetId: 't1',
        targetName: 'T1',
        notificationMode: 'instant',
        emailNotifications: true,
        pushNotifications: true,
        unreadCount: 5,
      },
      {
        id: 's2',
        type: 'forum',
        targetId: 'f1',
        targetName: 'F1',
        notificationMode: 'daily',
        emailNotifications: false,
        pushNotifications: true,
        unreadCount: 2,
      },
    ];
    server.use(
      http.get('/api/forum/subscriptions', () => HttpResponse.json({ subscriptions: subs }))
    );

    const { result } = renderHook(() => useSubscriptions());
    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.subscriptions).toHaveLength(2);
    expect(result.current.totalUnread).toBe(7);
  });

  it('getByType filters subscriptions by type', async () => {
    const subs = [
      {
        id: 's1',
        type: 'thread',
        targetId: 't1',
        targetName: 'T1',
        notificationMode: 'instant',
        emailNotifications: true,
        pushNotifications: true,
        unreadCount: 1,
      },
      {
        id: 's2',
        type: 'forum',
        targetId: 'f1',
        targetName: 'F1',
        notificationMode: 'daily',
        emailNotifications: true,
        pushNotifications: true,
        unreadCount: 0,
      },
      {
        id: 's3',
        type: 'thread',
        targetId: 't2',
        targetName: 'T2',
        notificationMode: 'weekly',
        emailNotifications: true,
        pushNotifications: false,
        unreadCount: 3,
      },
    ];
    server.use(
      http.get('/api/forum/subscriptions', () => HttpResponse.json({ subscriptions: subs }))
    );

    const { result } = renderHook(() => useSubscriptions());
    await act(async () => {
      await result.current.refresh();
    });

    const threadSubs = result.current.getByType('thread');
    expect(threadSubs).toHaveLength(2);
    const forumSubs = result.current.getByType('forum');
    expect(forumSubs).toHaveLength(1);
  });

  it('handles fetch error gracefully', async () => {
    server.use(http.get('/api/forum/subscriptions', () => HttpResponse.error()));

    const { result } = renderHook(() => useSubscriptions());
    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.subscriptions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});

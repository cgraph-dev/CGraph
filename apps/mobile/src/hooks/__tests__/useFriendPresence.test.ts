/**
 * useFriendPresence Hook Tests
 *
 * Tests for the friend presence hook covering real-time status tracking,
 * subscription management, and presence visibility.
 *
 * @since v0.7.28
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useFriendPresence, useIsFriendOnline, useFriendsPresence } from '../useFriendPresence';
import socketManager from '../../lib/socket';

// Type definition for test assertions
interface FriendPresenceData {
  online: boolean;
  status: string;
  lastSeen?: string;
  lastActive?: string;
  hidden?: boolean;
}

// Mock socket manager
jest.mock('../../lib/socket', () => ({
  getFriendPresence: jest.fn(),
  onGlobalStatusChange: jest.fn(),
  getBulkFriendStatus: jest.fn(),
}));

describe('useFriendPresence', () => {
  let statusChangeCallback: ((userId: string, isOnline: boolean, status?: string) => void) | null =
    null;

  beforeEach(() => {
    jest.clearAllMocks();
    statusChangeCallback = null;

    // Capture the status change callback
    (socketManager.onGlobalStatusChange as jest.Mock).mockImplementation((callback) => {
      statusChangeCallback = callback;
      return () => {
        statusChangeCallback = null;
      };
    });
  });

  describe('initial state', () => {
    it('returns null for undefined userId', () => {
      (socketManager.getFriendPresence as jest.Mock).mockReturnValue(null);

      const { result } = renderHook(() => useFriendPresence(undefined));

      expect(result.current).toBeNull();
      expect(socketManager.getFriendPresence).not.toHaveBeenCalled();
    });

    it('returns null for null userId', () => {
      (socketManager.getFriendPresence as jest.Mock).mockReturnValue(null);

      const { result } = renderHook(() => useFriendPresence(null));

      expect(result.current).toBeNull();
    });

    it('returns initial presence from socket manager', () => {
      const mockPresence = {
        online: true,
        status: 'online',
        lastSeen: '2024-01-01T00:00:00Z',
      };
      (socketManager.getFriendPresence as jest.Mock).mockReturnValue(mockPresence);

      const { result } = renderHook(() => useFriendPresence('user-123'));

      expect(result.current).toEqual(mockPresence);
      expect(socketManager.getFriendPresence).toHaveBeenCalledWith('user-123');
    });

    it('returns null when friend has no presence data', () => {
      (socketManager.getFriendPresence as jest.Mock).mockReturnValue(null);

      const { result } = renderHook(() => useFriendPresence('user-123'));

      expect(result.current).toBeNull();
    });
  });

  describe('status change subscription', () => {
    it('subscribes to status changes on mount', () => {
      (socketManager.getFriendPresence as jest.Mock).mockReturnValue(null);

      renderHook(() => useFriendPresence('user-123'));

      expect(socketManager.onGlobalStatusChange).toHaveBeenCalled();
    });

    it('unsubscribes on unmount', () => {
      (socketManager.getFriendPresence as jest.Mock).mockReturnValue(null);
      const unsubscribe = jest.fn();
      (socketManager.onGlobalStatusChange as jest.Mock).mockReturnValue(unsubscribe);

      const { unmount } = renderHook(() => useFriendPresence('user-123'));

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });

    it('updates presence when status changes for the user', async () => {
      (socketManager.getFriendPresence as jest.Mock).mockReturnValue({
        online: false,
        status: 'offline',
      });

      const { result } = renderHook(() => useFriendPresence('user-123'));

      expect(result.current?.online).toBe(false);

      // Simulate status change
      act(() => {
        statusChangeCallback?.('user-123', true, 'online');
      });

      await waitFor(() => {
        expect(result.current?.online).toBe(true);
        expect(result.current?.status).toBe('online');
      });
    });

    it('ignores status changes for other users', async () => {
      (socketManager.getFriendPresence as jest.Mock).mockReturnValue({
        online: false,
        status: 'offline',
      });

      const { result } = renderHook(() => useFriendPresence('user-123'));

      // Simulate status change for a different user
      act(() => {
        statusChangeCallback?.('user-456', true, 'online');
      });

      // Should not change
      expect(result.current?.online).toBe(false);
    });
  });

  describe('userId changes', () => {
    it('fetches new presence when userId changes', () => {
      const presence1 = { online: true, status: 'online' };
      const presence2 = { online: false, status: 'away' };

      // Reset and set up the mock to return different values based on the userId
      (socketManager.getFriendPresence as jest.Mock).mockImplementation((userId: string) => {
        if (userId === 'user-123') return presence1;
        if (userId === 'user-456') return presence2;
        return null;
      });

      const { result, rerender } = renderHook<
        FriendPresenceData | null,
        { userId: string | undefined }
      >(({ userId }) => useFriendPresence(userId), { initialProps: { userId: 'user-123' } });

      expect(result.current).toEqual(presence1);

      rerender({ userId: 'user-456' });

      expect(result.current).toEqual(presence2);
      expect(socketManager.getFriendPresence).toHaveBeenCalledWith('user-456');
    });

    it('clears presence when userId becomes undefined', () => {
      (socketManager.getFriendPresence as jest.Mock).mockReturnValue({
        online: true,
        status: 'online',
      });

      const { result, rerender } = renderHook<
        FriendPresenceData | null,
        { userId: string | undefined }
      >(({ userId }) => useFriendPresence(userId), {
        initialProps: { userId: 'user-123' as string | undefined },
      });

      expect(result.current?.online).toBe(true);

      rerender({ userId: undefined });

      expect(result.current).toBeNull();
    });
  });
});

describe('useIsFriendOnline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (socketManager.onGlobalStatusChange as jest.Mock).mockReturnValue(() => {});
  });

  it('returns true when friend is online and not hidden', () => {
    (socketManager.getFriendPresence as jest.Mock).mockReturnValue({
      online: true,
      status: 'online',
      hidden: false,
    });

    const { result } = renderHook(() => useIsFriendOnline('user-123'));

    expect(result.current).toBe(true);
  });

  it('returns false when friend is offline', () => {
    (socketManager.getFriendPresence as jest.Mock).mockReturnValue({
      online: false,
      status: 'offline',
    });

    const { result } = renderHook(() => useIsFriendOnline('user-123'));

    expect(result.current).toBe(false);
  });

  it('returns false when friend has hidden presence', () => {
    (socketManager.getFriendPresence as jest.Mock).mockReturnValue({
      online: true,
      status: 'online',
      hidden: true,
    });

    const { result } = renderHook(() => useIsFriendOnline('user-123'));

    expect(result.current).toBe(false);
  });

  it('returns false for null userId', () => {
    const { result } = renderHook(() => useIsFriendOnline(null));

    expect(result.current).toBe(false);
  });

  it('returns false when no presence data', () => {
    (socketManager.getFriendPresence as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => useIsFriendOnline('user-123'));

    expect(result.current).toBe(false);
  });
});

describe('useFriendsPresence', () => {
  let statusChangeCallback: ((userId: string, isOnline: boolean, status?: string) => void) | null =
    null;

  beforeEach(() => {
    jest.clearAllMocks();
    statusChangeCallback = null;

    (socketManager.onGlobalStatusChange as jest.Mock).mockImplementation((callback) => {
      statusChangeCallback = callback;
      return () => {
        statusChangeCallback = null;
      };
    });
    (socketManager.getBulkFriendStatus as jest.Mock).mockResolvedValue({});
  });

  describe('initial state', () => {
    it('returns empty map for empty userIds array', () => {
      const { result } = renderHook(() => useFriendsPresence([]));

      expect(result.current.size).toBe(0);
    });

    it('initializes with cached presence data', () => {
      (socketManager.getFriendPresence as jest.Mock).mockImplementation((id) => {
        if (id === 'user-1') return { online: true, status: 'online' };
        if (id === 'user-2') return { online: false, status: 'offline' };
        return null;
      });

      const { result } = renderHook(() => useFriendsPresence(['user-1', 'user-2']));

      expect(result.current.get('user-1')?.online).toBe(true);
      expect(result.current.get('user-2')?.online).toBe(false);
    });

    it('fetches bulk status on mount', async () => {
      (socketManager.getBulkFriendStatus as jest.Mock).mockResolvedValue({
        'user-1': { online: true, status: 'online' },
        'user-2': { online: false, status: 'away' },
      });

      const { result } = renderHook(() => useFriendsPresence(['user-1', 'user-2']));

      await waitFor(() => {
        expect(socketManager.getBulkFriendStatus).toHaveBeenCalledWith(['user-1', 'user-2']);
        expect(result.current.get('user-1')?.online).toBe(true);
        expect(result.current.get('user-2')?.online).toBe(false);
      });
    });
  });

  describe('real-time updates', () => {
    it('updates presence for tracked users', async () => {
      (socketManager.getBulkFriendStatus as jest.Mock).mockResolvedValue({
        'user-1': { online: false, status: 'offline' },
      });

      const { result } = renderHook(() => useFriendsPresence(['user-1', 'user-2']));

      await waitFor(() => {
        expect(result.current.get('user-1')?.online).toBe(false);
      });

      // Simulate status change
      act(() => {
        statusChangeCallback?.('user-1', true, 'online');
      });

      await waitFor(() => {
        expect(result.current.get('user-1')?.online).toBe(true);
      });
    });

    it('ignores updates for untracked users', async () => {
      (socketManager.getBulkFriendStatus as jest.Mock).mockResolvedValue({
        'user-1': { online: true, status: 'online' },
      });

      const { result } = renderHook(() => useFriendsPresence(['user-1']));

      await waitFor(() => {
        expect(result.current.size).toBe(1);
      });

      // Simulate status change for untracked user
      act(() => {
        statusChangeCallback?.('user-999', true, 'online');
      });

      // Should not add the untracked user
      expect(result.current.has('user-999')).toBe(false);
    });
  });

  describe('hidden users', () => {
    it('excludes users with hidden presence', async () => {
      (socketManager.getBulkFriendStatus as jest.Mock).mockResolvedValue({
        'user-1': { online: true, status: 'online', hidden: false },
        'user-2': { online: true, status: 'online', hidden: true },
      });

      const { result } = renderHook(() => useFriendsPresence(['user-1', 'user-2']));

      await waitFor(() => {
        expect(result.current.has('user-1')).toBe(true);
        expect(result.current.has('user-2')).toBe(false);
      });
    });
  });

  describe('userIds changes', () => {
    it('re-fetches when userIds change', async () => {
      (socketManager.getBulkFriendStatus as jest.Mock)
        .mockResolvedValueOnce({ 'user-1': { online: true, status: 'online' } })
        .mockResolvedValueOnce({ 'user-3': { online: true, status: 'online' } });

      const { rerender } = renderHook<Map<string, FriendPresenceData>, { ids: string[] }>(
        ({ ids }) => useFriendsPresence(ids),
        { initialProps: { ids: ['user-1'] } }
      );

      await waitFor(() => {
        expect(socketManager.getBulkFriendStatus).toHaveBeenCalledWith(['user-1']);
      });

      rerender({ ids: ['user-3'] });

      await waitFor(() => {
        expect(socketManager.getBulkFriendStatus).toHaveBeenCalledWith(['user-3']);
      });
    });
  });
});

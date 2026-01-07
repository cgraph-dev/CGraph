import { useState, useEffect, useCallback } from 'react';
import socketManager from '../lib/socket';

interface FriendPresenceData {
  online: boolean;
  status: string;
  lastSeen?: string;
  lastActive?: string;
  hidden?: boolean;
}

/**
 * Hook to track a single friend's presence status.
 * Returns null if the user is not a friend or presence is hidden.
 */
export function useFriendPresence(userId: string | undefined | null): FriendPresenceData | null {
  const [presence, setPresence] = useState<FriendPresenceData | null>(() => {
    if (!userId) return null;
    return socketManager.getFriendPresence(userId);
  });

  useEffect(() => {
    if (!userId) {
      setPresence(null);
      return;
    }

    // Get initial state
    const initial = socketManager.getFriendPresence(userId);
    setPresence(initial);

    // Subscribe to changes
    const unsubscribe = socketManager.onGlobalStatusChange((changedUserId, isOnline, status) => {
      if (changedUserId === userId) {
        setPresence(prev => ({
          ...prev,
          online: isOnline,
          status: status || (isOnline ? 'online' : 'offline'),
        }));
      }
    });

    return unsubscribe;
  }, [userId]);

  return presence;
}

/**
 * Hook to check if a friend is online.
 * Returns false if user is not a friend or presence is unavailable.
 */
export function useIsFriendOnline(userId: string | undefined | null): boolean {
  const presence = useFriendPresence(userId);
  return presence?.online === true && !presence?.hidden;
}

/**
 * Hook to track multiple friends' presence status.
 */
export function useFriendsPresence(userIds: string[]): Map<string, FriendPresenceData> {
  const [presenceMap, setPresenceMap] = useState<Map<string, FriendPresenceData>>(() => {
    const map = new Map<string, FriendPresenceData>();
    userIds.forEach(id => {
      const presence = socketManager.getFriendPresence(id);
      if (presence) {
        map.set(id, presence);
      }
    });
    return map;
  });

  useEffect(() => {
    // Fetch bulk status on mount and when userIds change
    if (userIds.length > 0) {
      socketManager.getBulkFriendStatus(userIds).then(result => {
        const map = new Map<string, FriendPresenceData>();
        Object.entries(result).forEach(([id, data]) => {
          if (!data.hidden) {
            map.set(id, data);
          }
        });
        setPresenceMap(map);
      });
    }

    // Subscribe to changes
    const unsubscribe = socketManager.onGlobalStatusChange((userId, isOnline, status) => {
      if (userIds.includes(userId)) {
        setPresenceMap(prev => {
          const next = new Map(prev);
          const existing = next.get(userId);
          next.set(userId, {
            ...existing,
            online: isOnline,
            status: status || (isOnline ? 'online' : 'offline'),
          });
          return next;
        });
      }
    });

    return unsubscribe;
  }, [userIds.join(',')]); // Re-run when userIds change

  return presenceMap;
}

/**
 * Hook to get list of all online friends.
 */
export function useOnlineFriends(): string[] {
  const [onlineFriends, setOnlineFriends] = useState<string[]>(() => {
    return socketManager.getOnlineFriends();
  });

  useEffect(() => {
    // Get initial state
    setOnlineFriends(socketManager.getOnlineFriends());

    // Subscribe to changes
    const unsubscribe = socketManager.onGlobalStatusChange(() => {
      setOnlineFriends(socketManager.getOnlineFriends());
    });

    return unsubscribe;
  }, []);

  return onlineFriends;
}

/**
 * Hook to call when friend list changes (add/remove friend).
 */
export function useRefreshFriendPresence(): () => void {
  return useCallback(() => {
    socketManager.refreshFriendPresence();
  }, []);
}

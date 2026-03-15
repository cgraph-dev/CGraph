/**
 * usePresence Hook
 *
 * Provides real-time online status tracking for friends and contacts.
 * Connects to the presence:lobby Phoenix channel for global presence updates.
 *
 * @module hooks/usePresence
 * @version 0.9.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { socketManager } from '@/lib/socket';
import { useAuthStore } from '@/modules/auth/store';

export interface PresenceState {
  /** Whether the presence system is connected */
  isConnected: boolean;
  /** Set of online friend user IDs */
  onlineFriends: Set<string>;
  /** Check if a specific user is online */
  isUserOnline: (userId: string) => boolean;
  /** Get count of online friends */
  onlineCount: number;
  /** Real-time status messages keyed by user ID */
  statusMessages: Map<string, string>;
  /** Get the latest status message for a user (from real-time updates) */
  getStatusMessage: (userId: string) => string | undefined;
}

/**
 * Hook for tracking friend online/offline status.
 *
 * Automatically connects to the presence lobby when the user is authenticated.
 * Updates in real-time as friends come online or go offline.
 *
 * @example
 * ```tsx
 * function FriendList() {
 *   const { isUserOnline, onlineCount } = usePresence();
 *
 *   return (
 *     <div>
 *       <span>{onlineCount} friends online</span>
 *       {friends.map(friend => (
 *         <div key={friend.id}>
 *           {friend.name}
 *           {isUserOnline(friend.id) && <OnlineIndicator />}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePresence(): PresenceState {
  const { isAuthenticated, user } = useAuthStore();
  const [onlineFriends, setOnlineFriends] = useState<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const [statusMessages, setStatusMessages] = useState<Map<string, string>>(new Map());

  // Connect to presence lobby on mount
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsConnected(false);
      setOnlineFriends(new Set());
      setStatusMessages(new Map());
      return;
    }

    // Join presence lobby
    let cleanupChannel: (() => void) | undefined;
    const channel = socketManager.joinPresenceLobby();
    if (channel) {
      setIsConnected(true);
      // Get initial state
      setOnlineFriends(new Set(socketManager.getOnlineFriends()));

      // Listen for real-time status message changes
      const handleStatusChanged = (rawPayload: unknown) => {
         
        const payload = rawPayload as {
          user_id: string;
          status_message?: string;
          custom_status?: string;
        };
        if (payload.user_id && payload.status_message != null) {
          setStatusMessages((prev) => {
            const next = new Map(prev);
            next.set(String(payload.user_id), payload.status_message ?? '');
            return next;
          });
        }
      };
      const statusRef = channel.on('friend_status_changed', handleStatusChanged);

      // Cleanup channel listener on unmount
      cleanupChannel = () => {
        channel.off('friend_status_changed', statusRef);
      };
    }

    // Subscribe to status changes
    const unsubscribe = socketManager.onStatusChange((conversationId, userId, isOnline) => {
      if (conversationId === 'lobby') {
        setOnlineFriends((prev) => {
          const next = new Set(prev);
          if (isOnline) {
            next.add(userId);
          } else {
            next.delete(userId);
          }
          return next;
        });
      }
    });

    return () => {
      unsubscribe();
      cleanupChannel?.();
      // Don't leave presence lobby on unmount - other components may need it
      // socketManager.leavePresenceLobby();
    };
  }, [isAuthenticated, user]);

  const isUserOnline = useCallback(
    (userId: string): boolean => {
      if (!userId) return false;

      // Direct lookup
      if (onlineFriends.has(userId)) return true;

      // String comparison fallback
      const userIdStr = String(userId);
      for (const id of onlineFriends) {
        if (String(id) === userIdStr) return true;
      }

      return false;
    },
    [onlineFriends]
  );

  const onlineCount = useMemo(() => onlineFriends.size, [onlineFriends]);

  const getStatusMessage = useCallback(
    (userId: string): string | undefined => {
      return statusMessages.get(String(userId));
    },
    [statusMessages]
  );

  return {
    isConnected,
    onlineFriends,
    isUserOnline,
    onlineCount,
    statusMessages,
    getStatusMessage,
  };
}

/**
 * Hook for tracking a single user's online status.
 *
 * More efficient than usePresence() when you only need to track one user.
 *
 * @param userId - User ID to track
 * @returns Whether the user is online
 *
 * @example
 * ```tsx
 * function UserAvatar({ userId }) {
 *   const isOnline = useUserOnline(userId);
 *   return (
 *     <Avatar>
 *       {isOnline && <OnlineDot />}
 *     </Avatar>
 *   );
 * }
 * ```
 */
export function useUserOnline(userId: string | undefined): boolean {
  const [isOnline, setIsOnline] = useState(false);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setIsOnline(false);
      return;
    }

    // Get initial state
    setIsOnline(socketManager.isFriendOnline(userId));

    // Subscribe to changes for this specific user
    const unsubscribe = socketManager.onStatusChange((conversationId, changedUserId, online) => {
      if (
        conversationId === 'lobby' &&
        (changedUserId === userId || String(changedUserId) === String(userId))
      ) {
        setIsOnline(online);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, userId]);

  return isOnline;
}

export default usePresence;

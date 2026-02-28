/**
 * useContactsPresence Hook
 *
 * Provides real-time presence tracking for the contacts list.
 * Connects to the presence channel via socketManager and tracks
 * online friends as a Set, plus status messages from friend_status_changed events.
 *
 * @module hooks/useContactsPresence
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import socketManager from '../lib/socket';

export interface ContactsPresenceState {
  /** Set of online friend user IDs */
  onlineFriends: Set<string>;
  /** Check if a specific user is online */
  isOnline: (userId: string) => boolean;
  /** Real-time status messages keyed by user ID */
  statusMessages: Map<string, string>;
}

/**
 * Hook for tracking all friends' online/offline status and status messages.
 *
 * Automatically subscribes to presence events and handles app state changes
 * (foreground/background) for proper presence tracking.
 *
 * @example
 * ```tsx
 * function ContactsList() {
 *   const { onlineFriends, isOnline, statusMessages } = useContactsPresence();
 *   return friends.map(f => (
 *     <ContactRow key={f.id} isOnline={isOnline(f.id)} status={statusMessages.get(f.id)} />
 *   ));
 * }
 * ```
 */
export function useContactsPresence(): ContactsPresenceState {
  const [onlineFriends, setOnlineFriends] = useState<Set<string>>(() => {
    return new Set(socketManager.getOnlineFriends());
  });
  const [statusMessages, setStatusMessages] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    // Get initial state
    setOnlineFriends(new Set(socketManager.getOnlineFriends()));

    // Subscribe to global friend status changes (online/offline + status)
    const unsubscribe = socketManager.onGlobalStatusChange(
      (userId: string, isOnlineNow: boolean, status?: string) => {
        setOnlineFriends((prev) => {
          const next = new Set(prev);
          if (isOnlineNow) {
            next.add(userId);
          } else {
            next.delete(userId);
          }
          return next;
        });

        // Track status messages from status change events
        if (status && status !== 'online' && status !== 'offline') {
          setStatusMessages((prev) => {
            const next = new Map(prev);
            next.set(userId, status);
            return next;
          });
        }
      }
    );

    // Handle app state changes for presence accuracy
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Refresh presence data when returning to foreground
        setOnlineFriends(new Set(socketManager.getOnlineFriends()));
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      unsubscribe();
      appStateSubscription.remove();
    };
  }, []);

  const isOnline = useCallback(
    (userId: string): boolean => {
      if (!userId) return false;
      return onlineFriends.has(String(userId));
    },
    [onlineFriends]
  );

  return {
    onlineFriends,
    isOnline,
    statusMessages,
  };
}

export default useContactsPresence;

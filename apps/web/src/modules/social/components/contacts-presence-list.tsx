/**
 * ContactsPresenceList Component
 *
 * Displays the user's contacts/friends list with real-time presence indicators.
 * Friends are sorted with online users first, then offline.
 * Each contact row shows avatar, display name, username, presence dot,
 * and optional status message.
 *
 * @module social/components/contacts-presence-list
 * @version 1.0.0
 */

import { useMemo } from 'react';
import { usePresence } from '../hooks/usePresence';
import { useFriendStore } from '../store/friendStore';
import type { Friend } from '../store/friend-types';

/** Props for the ContactsPresenceList component. */
export interface ContactsPresenceListProps {
  /** Optional CSS class name for the container */
  className?: string;
  /** Callback when a contact row is clicked */
  onContactClick?: (friend: Friend) => void;
}

/**
 * Presence dot indicator for online/offline status.
 */
function PresenceDot({ isOnline }: { isOnline: boolean }) {
  if (isOnline) {
    return (
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
      </span>
    );
  }

  return <span className="inline-flex h-2 w-2 rounded-full bg-gray-400" />;
}

/**
 * Avatar placeholder with initials fallback.
 */
function ContactAvatar({ friend }: { friend: Friend }) {
  const initials = (friend.displayName || friend.username || '?').charAt(0).toUpperCase();

  return (
    <div className="relative h-8 w-8 flex-shrink-0">
      {friend.avatarUrl ? (
        <img
          src={friend.avatarUrl}
          alt={friend.displayName || friend.username}
          className="h-8 w-8 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
          {initials}
        </div>
      )}
    </div>
  );
}

/**
 * Single contact row in the presence list.
 */
function ContactRow({
  friend,
  isOnline,
  statusMessage,
  onClick,
}: {
  friend: Friend;
  isOnline: boolean;
  statusMessage?: string;
  onClick?: (friend: Friend) => void;
}) {
  const displayStatus = statusMessage || friend.statusMessage;
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
      onClick={() => onClick?.(friend)}
    >
      <ContactAvatar friend={friend} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
            {friend.displayName || friend.username}
          </span>
          <span className="truncate text-xs text-gray-500 dark:text-gray-400">
            @{friend.username}
          </span>
        </div>
        {displayStatus && (
          <p className="truncate text-xs text-gray-400 dark:text-gray-500">
            {displayStatus}
          </p>
        )}
      </div>

      <PresenceDot isOnline={isOnline} />
    </button>
  );
}

/**
 * Contacts presence list showing all friends with real-time online/offline status.
 *
 * @example
 * ```tsx
 * <ContactsPresenceList onContactClick={(f) => navigate(`/profile/${f.id}`)} />
 * ```
 */
export function ContactsPresenceList({
  className = '',
  onContactClick,
}: ContactsPresenceListProps) {
  const { isUserOnline, onlineCount, getStatusMessage } = usePresence();
  const friends = useFriendStore((s) => s.friends);

  // Sort friends: online first, then offline; alphabetical within each group
  const sortedFriends = useMemo(() => {
    return [...friends].sort((a, b) => {
      const aOnline = isUserOnline(a.id);
      const bOnline = isUserOnline(b.id);

      if (aOnline && !bOnline) return -1;
      if (!aOnline && bOnline) return 1;

      // Alphabetical by display name within each group
      const aName = (a.displayName || a.username).toLowerCase();
      const bName = (b.displayName || b.username).toLowerCase();
      return aName.localeCompare(bName);
    });
  }, [friends, isUserOnline]);

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Contacts</h2>
        {onlineCount > 0 && (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
            {onlineCount} online
          </span>
        )}
      </div>

      {/* Contact list */}
      {sortedFriends.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
          <div className="mb-2 text-3xl">👋</div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No contacts yet</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Add friends to see them here
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {sortedFriends.map((friend) => (
            <ContactRow
              key={friend.id}
              friend={friend}
              isOnline={isUserOnline(friend.id)}
              statusMessage={getStatusMessage(friend.id)}
              onClick={onContactClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ContactsPresenceList;

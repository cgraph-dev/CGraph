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
          className="h-8 w-8 rounded-lg object-cover ring-1 ring-white/[0.08]"
        />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500/20 to-purple-500/20 text-xs font-semibold text-white/60 ring-1 ring-white/[0.08]">
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
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-all duration-150 hover:bg-white/[0.04]"
      onClick={() => onClick?.(friend)}
    >
      <ContactAvatar friend={friend} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium text-white/90">
            {friend.displayName || friend.username}
          </span>
        </div>
        {displayStatus ? (
          <p className="truncate text-[11px] text-white/30">{displayStatus}</p>
        ) : (
          <p className="truncate text-[11px] text-white/20">@{friend.username}</p>
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
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40">Contacts</h2>
        {onlineCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/[0.08] px-2 py-0.5 text-[11px] font-medium text-emerald-400 ring-1 ring-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {onlineCount}
          </span>
        )}
      </div>

      {/* Contact list */}
      {sortedFriends.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06]">
            <span className="text-xl">👋</span>
          </div>
          <p className="text-sm font-medium text-white/50">No contacts yet</p>
          <p className="mt-1 text-xs text-white/25">Add friends to see them here</p>
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

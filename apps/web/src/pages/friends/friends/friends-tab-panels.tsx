/**
 * Sub-components for the Friends list content area (tab panels)
 */

import { motion } from 'framer-motion';
import { UserPlusIcon, NoSymbolIcon, ClockIcon } from '@heroicons/react/24/outline';
import type { Friend, FriendRequest } from '@/modules/social/store';

import { FriendListItem } from './friend-list-item';
import { FriendRequestCard } from './friend-request-card';

/* ------------------------------------------------------------------ */
/*  Pending Tab                                                        */
/* ------------------------------------------------------------------ */

interface PendingTabProps {
  pendingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  acceptRequest: (id: string) => void;
  declineRequest: (id: string) => void;
}

export function PendingTab({
  pendingRequests,
  sentRequests,
  acceptRequest,
  declineRequest,
}: PendingTabProps) {
  if (pendingRequests.length === 0 && sentRequests.length === 0) {
    return (
      <div className="py-12 text-center">
        <ClockIcon className="mx-auto mb-3 h-12 w-12 text-gray-600" />
        <p className="text-sm text-gray-400">No pending requests</p>
      </div>
    );
  }

  return (
    <>
      {pendingRequests.length > 0 && (
        <div className="mb-4">
          <motion.h3
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-2 bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text px-1 text-xs font-semibold uppercase tracking-wider text-transparent"
          >
            Incoming — {pendingRequests.length}
          </motion.h3>
          <div className="space-y-2">
            {pendingRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: index * 0.05 }}
              >
                <FriendRequestCard
                  request={request}
                  type="incoming"
                  onAccept={() => acceptRequest(request.id)}
                  onDecline={() => declineRequest(request.id)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {sentRequests.length > 0 && (
        <div>
          <motion.h3
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: pendingRequests.length * 0.05 }}
            className="mb-2 bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text px-1 text-xs font-semibold uppercase tracking-wider text-transparent"
          >
            Sent — {sentRequests.length}
          </motion.h3>
          <div className="space-y-2">
            {sentRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                  delay: (pendingRequests.length + index) * 0.05,
                }}
              >
                <FriendRequestCard
                  request={request}
                  type="outgoing"
                  onDecline={() => declineRequest(request.id)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Friends Tab (all / online)                                         */
/* ------------------------------------------------------------------ */

interface FriendsListTabProps {
  filteredFriends: Friend[];
  searchQuery: string;
  getStatusColor: (status: Friend['status']) => string;
  handleStartChat: (friendId: string) => void;
  removeFriend: (id: string) => void;
  blockUser: (id: string) => void;
  dropdownOpen: string | null;
  setDropdownOpen: (id: string | null) => void;
}

export function FriendsListTab({
  filteredFriends,
  searchQuery,
  getStatusColor,
  handleStartChat,
  removeFriend,
  blockUser,
  dropdownOpen,
  setDropdownOpen,
}: FriendsListTabProps) {
  if (filteredFriends.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <UserPlusIcon className="mx-auto mb-3 h-12 w-12 text-gray-600" />
        <p className="text-sm text-gray-400">
          {searchQuery ? 'No friends found' : 'No friends yet'}
        </p>
      </div>
    );
  }

  return (
    <div>
      {filteredFriends.map((friend, index) => (
        <motion.div
          key={friend.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: index * 0.05 }}
        >
          <FriendListItem
            friend={friend}
            statusColor={getStatusColor(friend.status)}
            onMessage={() => handleStartChat(friend.id)}
            onRemove={() => removeFriend(friend.id)}
            onBlock={() => blockUser(friend.id)}
            dropdownOpen={dropdownOpen === friend.id}
            setDropdownOpen={(open) => setDropdownOpen(open ? friend.id : null)}
          />
        </motion.div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Blocked Tab (placeholder)                                          */
/* ------------------------------------------------------------------ */

export function BlockedTab() {
  return (
    <div className="px-4 py-12 text-center">
      <NoSymbolIcon className="mx-auto mb-3 h-12 w-12 text-gray-600" />
      <p className="text-sm text-gray-400">No blocked users</p>
    </div>
  );
}

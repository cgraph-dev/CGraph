import { useState, useEffect } from 'react';
import { useFriendStore, Friend, FriendRequest } from '@/stores/friendStore';
import {
  UserPlusIcon,
  UserMinusIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  EllipsisVerticalIcon,
  NoSymbolIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

type Tab = 'all' | 'online' | 'pending' | 'blocked';

export default function Friends() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [addFriendInput, setAddFriendInput] = useState('');
  const [addFriendError, setAddFriendError] = useState('');
  const [addFriendSuccess, setAddFriendSuccess] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  const {
    friends,
    pendingRequests,
    sentRequests,
    isLoading,
    error,
    fetchFriends,
    fetchPendingRequests,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    blockUser,
    clearError,
  } = useFriendStore();

  useEffect(() => {
    fetchFriends();
    fetchPendingRequests();
  }, [fetchFriends, fetchPendingRequests]);

  const tabs = [
    { id: 'all' as Tab, label: 'All', count: friends.length },
    { id: 'online' as Tab, label: 'Online', count: friends.filter((f) => f.status === 'online').length },
    { id: 'pending' as Tab, label: 'Pending', count: pendingRequests.length + sentRequests.length },
    { id: 'blocked' as Tab, label: 'Blocked', count: 0 },
  ];

  const filteredFriends = friends.filter((friend) => {
    const matchesSearch =
      friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.displayName?.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'online') {
      return matchesSearch && friend.status === 'online';
    }

    return matchesSearch;
  });

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddFriendError('');
    setAddFriendSuccess(false);

    if (!addFriendInput.trim()) {
      setAddFriendError('Please enter a username');
      return;
    }

    try {
      await sendRequest(addFriendInput.trim());
      setAddFriendSuccess(true);
      setAddFriendInput('');
      setTimeout(() => setAddFriendSuccess(false), 3000);
    } catch {
      setAddFriendError(error || 'Failed to send friend request');
    }
  };

  const handleStartChat = (friendId: string) => {
    // Navigate to or create a conversation with this friend
    navigate(`/messages?userId=${friendId}`);
  };

  const getStatusColor = (status: Friend['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'idle':
        return 'bg-yellow-500';
      case 'dnd':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-dark-700 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Friends</h1>
          <button
            onClick={() => setShowAddFriend(!showAddFriend)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-sm font-medium transition-colors"
          >
            <UserPlusIcon className="h-4 w-4" />
            Add Friend
          </button>
        </div>

        {/* Add Friend Form */}
        {showAddFriend && (
          <form onSubmit={handleAddFriend} className="mb-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={addFriendInput}
                  onChange={(e) => setAddFriendInput(e.target.value)}
                  placeholder="Enter a username to add as friend"
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {addFriendError && (
                  <p className="mt-1 text-sm text-red-400">{addFriendError}</p>
                )}
                {addFriendSuccess && (
                  <p className="mt-1 text-sm text-green-400">Friend request sent!</p>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
              >
                Send Request
              </button>
            </div>
          </form>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-dark-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-dark-500' : 'bg-dark-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      {(activeTab === 'all' || activeTab === 'online') && (
        <div className="px-6 py-3 border-b border-dark-700">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search friends..."
              className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="m-4 p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-400">
            <p>{error}</p>
            <button
              onClick={clearError}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </div>
        )}

        {!isLoading && activeTab === 'pending' && (
          <div className="p-4">
            {/* Incoming Requests */}
            {pendingRequests.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Incoming Requests — {pendingRequests.length}
                </h3>
                <div className="space-y-2">
                  {pendingRequests.map((request) => (
                    <FriendRequestCard
                      key={request.id}
                      request={request}
                      type="incoming"
                      onAccept={() => acceptRequest(request.id)}
                      onDecline={() => declineRequest(request.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Outgoing Requests */}
            {sentRequests.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Sent Requests — {sentRequests.length}
                </h3>
                <div className="space-y-2">
                  {sentRequests.map((request) => (
                    <FriendRequestCard
                      key={request.id}
                      request={request}
                      type="outgoing"
                      onDecline={() => declineRequest(request.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {pendingRequests.length === 0 && sentRequests.length === 0 && (
              <EmptyState
                icon={<ClockIcon className="h-12 w-12" />}
                title="No pending requests"
                description="When you receive or send friend requests, they'll appear here."
              />
            )}
          </div>
        )}

        {!isLoading && (activeTab === 'all' || activeTab === 'online') && (
          <div className="p-4">
            {filteredFriends.length > 0 ? (
              <div className="space-y-2">
                {filteredFriends.map((friend) => (
                  <FriendCard
                    key={friend.id}
                    friend={friend}
                    statusColor={getStatusColor(friend.status)}
                    onMessage={() => handleStartChat(friend.id)}
                    onRemove={() => removeFriend(friend.id)}
                    onBlock={() => blockUser(friend.id)}
                    dropdownOpen={dropdownOpen === friend.id}
                    setDropdownOpen={(open) => setDropdownOpen(open ? friend.id : null)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<UserPlusIcon className="h-12 w-12" />}
                title={searchQuery ? 'No friends found' : 'No friends yet'}
                description={
                  searchQuery
                    ? 'Try a different search term.'
                    : "Add friends by clicking the 'Add Friend' button above."
                }
              />
            )}
          </div>
        )}

        {!isLoading && activeTab === 'blocked' && (
          <div className="p-4">
            <EmptyState
              icon={<NoSymbolIcon className="h-12 w-12" />}
              title="No blocked users"
              description="Users you block will appear here. You can unblock them at any time."
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Friend Card Component
interface FriendCardProps {
  friend: Friend;
  statusColor: string;
  onMessage: () => void;
  onRemove: () => void;
  onBlock: () => void;
  dropdownOpen: boolean;
  setDropdownOpen: (open: boolean) => void;
}

function FriendCard({
  friend,
  statusColor,
  onMessage,
  onRemove,
  onBlock,
  dropdownOpen,
  setDropdownOpen,
}: FriendCardProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-dark-800 hover:bg-dark-700 rounded-lg transition-all duration-200 group hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5">
      <div className="flex items-center gap-3">
        <div className="relative">
          {friend.avatarUrl ? (
            <img
              src={friend.avatarUrl}
              alt={friend.username}
              className="h-10 w-10 rounded-full object-cover transition-transform duration-200 group-hover:scale-110"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium transition-transform duration-200 group-hover:scale-110">
              {friend.username.charAt(0).toUpperCase()}
            </div>
          )}
          <span
            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ${statusColor} ring-2 ring-dark-800 ${friend.status === 'online' ? 'animate-pulse-subtle' : ''}`}
          />
        </div>
        <div>
          <p className="font-medium text-white">
            {friend.displayName || friend.username}
          </p>
          <p className="text-sm text-gray-400">@{friend.username}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onMessage}
          className="p-2 hover:bg-dark-600 rounded-lg transition-colors"
          title="Send Message"
        >
          <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400 hover:text-white" />
        </button>
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="p-2 hover:bg-dark-600 rounded-lg transition-colors"
          >
            <EllipsisVerticalIcon className="h-5 w-5 text-gray-400 hover:text-white" />
          </button>
          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-dark-700 border border-dark-600 rounded-lg shadow-lg z-20 py-1">
                <button
                  onClick={() => {
                    onRemove();
                    setDropdownOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-dark-600 hover:text-white transition-colors"
                >
                  <UserMinusIcon className="h-4 w-4" />
                  Remove Friend
                </button>
                <button
                  onClick={() => {
                    onBlock();
                    setDropdownOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-dark-600 hover:text-red-300 transition-colors"
                >
                  <NoSymbolIcon className="h-4 w-4" />
                  Block User
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Friend Request Card Component
interface FriendRequestCardProps {
  request: FriendRequest;
  type: 'incoming' | 'outgoing';
  onAccept?: () => void;
  onDecline: () => void;
}

function FriendRequestCard({ request, type, onAccept, onDecline }: FriendRequestCardProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
      <div className="flex items-center gap-3">
        {request.user.avatarUrl ? (
          <img
            src={request.user.avatarUrl}
            alt={request.user.username}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
            {request.user.username.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-medium text-white">
            {request.user.displayName || request.user.username}
          </p>
          <p className="text-sm text-gray-400">@{request.user.username}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {type === 'incoming' && onAccept && (
          <button
            onClick={onAccept}
            className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            title="Accept"
          >
            <CheckIcon className="h-5 w-5 text-white" />
          </button>
        )}
        <button
          onClick={onDecline}
          className="p-2 bg-dark-600 hover:bg-dark-500 rounded-lg transition-colors"
          title={type === 'incoming' ? 'Decline' : 'Cancel'}
        >
          <XMarkIcon className="h-5 w-5 text-gray-400" />
        </button>
      </div>
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-gray-500 mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      <p className="text-gray-400 max-w-sm">{description}</p>
    </div>
  );
}

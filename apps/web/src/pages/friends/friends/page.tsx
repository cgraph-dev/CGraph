/**
 * Friends page - main component
 * Orchestrates friend list, requests, and search functionality
 */

import { motion } from 'framer-motion';

import { FriendsHeader, AddFriendForm, FriendsTabBar, FriendsSearchBar } from './header-components';
import { PendingTab, FriendsListTab, BlockedTab } from './friends-tab-panels';
import { WelcomePanel } from './welcome-panel';
import { FriendSuggestions } from './friend-suggestions';
import { useFriendsPage } from './useFriendsPage';
import { tweens, loop } from '@/lib/animation-presets';

export default function Friends() {
  const {
    activeTab,
    setActiveTab,
    tabs,
    searchQuery,
    setSearchQuery,
    showAddFriend,
    setShowAddFriend,
    addFriendInput,
    setAddFriendInput,
    addFriendError,
    addFriendSuccess,
    isSubmitting,
    handleAddFriend,
    dropdownOpen,
    setDropdownOpen,
    friends,
    filteredFriends,
    pendingRequests,
    sentRequests,
    isLoading,
    error,
    clearError,
    acceptRequest,
    declineRequest,
    removeFriend,
    blockUser,
    handleStartChat,
    getStatusColor,
  } = useFriendsPage();

  return (
    <div className="flex h-full flex-1 overflow-hidden bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Friends List Panel */}
      <div className="relative flex w-96 flex-col overflow-hidden border-r border-primary-500/20 bg-dark-900/50 backdrop-blur-xl">
        {/* Ambient glow effect */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-purple-500/5" />

        {/* Header */}
        <div className="relative z-10 border-b border-primary-500/20 p-4">
          <FriendsHeader showAddFriend={showAddFriend} setShowAddFriend={setShowAddFriend} />

          <AddFriendForm
            isVisible={showAddFriend}
            addFriendInput={addFriendInput}
            setAddFriendInput={setAddFriendInput}
            onSubmit={handleAddFriend}
            isLoading={isLoading}
            isSubmitting={isSubmitting}
            addFriendError={addFriendError}
            addFriendSuccess={addFriendSuccess}
          />

          <FriendsTabBar tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

          <FriendsSearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isVisible={activeTab === 'all' || activeTab === 'online'}
          />
        </div>

        {/* Friends List */}
        <div className="relative z-10 min-h-0 flex-1 overflow-y-auto">
          {error && (
            <div className="m-4 rounded-xl border border-red-700/50 bg-red-900/20 p-3 text-sm text-red-400">
              <p>{error}</p>
              <button onClick={clearError} className="mt-1 text-xs underline hover:no-underline">
                Dismiss
              </button>
            </div>
          )}

          {isLoading && (
            <motion.div
              className="flex items-center justify-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="relative">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary-400/30"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={loop(tweens.ambient)}
                />
              </div>
            </motion.div>
          )}

          {!isLoading && activeTab === 'pending' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-3"
            >
              <PendingTab
                pendingRequests={pendingRequests}
                sentRequests={sentRequests}
                acceptRequest={acceptRequest}
                declineRequest={declineRequest}
              />
            </motion.div>
          )}

          {!isLoading && (activeTab === 'all' || activeTab === 'online') && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <FriendsListTab
                filteredFriends={filteredFriends}
                searchQuery={searchQuery}
                getStatusColor={getStatusColor}
                handleStartChat={handleStartChat}
                removeFriend={removeFriend}
                blockUser={blockUser}
                dropdownOpen={dropdownOpen}
                setDropdownOpen={setDropdownOpen}
              />
            </motion.div>
          )}

          {!isLoading && activeTab === 'blocked' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <BlockedTab />
            </motion.div>
          )}
        </div>
      </div>

      {/* Right Side — Suggestions + Welcome */}
      <div className="flex flex-col gap-4">
        <FriendSuggestions />
        <WelcomePanel friendsCount={friends.length} pendingRequestsCount={pendingRequests.length} />
      </div>
    </div>
  );
}

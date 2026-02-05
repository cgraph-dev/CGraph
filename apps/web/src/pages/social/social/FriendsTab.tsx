/**
 * FriendsTab Component
 * Friends list with pending requests and search
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UsersIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import UserProfileCard from '@/modules/social/components/UserProfileCard';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { getAvatarBorderId } from '@/lib/utils';
import type { FriendsTabProps } from './types';

export function FriendsTab({
  friends,
  pendingRequests,
  sentRequests,
  searchQuery,
  onSearchChange,
  onAcceptRequest,
  onDeclineRequest,
  isLoading,
  error,
  onRetry,
}: FriendsTabProps) {
  void sentRequests; // Reserved for sent requests section
  const navigate = useNavigate();

  // Show error state with retry button
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <GlassCard variant="frosted" className="max-w-md p-8 text-center">
          <div className="mb-4 text-5xl text-red-400">⚠️</div>
          <h3 className="mb-2 text-xl font-bold text-white">Something went wrong</h3>
          <p className="mb-6 text-gray-400">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700"
            >
              Try Again
            </button>
          )}
        </GlassCard>
      </div>
    );
  }

  // Show loading state
  if (isLoading && friends.length === 0 && pendingRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        <p className="text-gray-400">Loading friends...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search friends..."
          aria-label="Search friends"
          className="w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white placeholder:text-white/40 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-bold text-white">
            Pending Requests ({pendingRequests.length})
          </h3>
          <div className="space-y-2">
            {pendingRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard variant="neon" glow className="p-4">
                  <div className="flex items-center gap-3">
                    <UserProfileCard userId={request.user?.id || ''} trigger="both">
                      <div className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-primary-700 font-medium text-white">
                        {request.user?.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                    </UserProfileCard>

                    <div className="flex-1">
                      <p className="font-medium text-white">
                        {request.user?.displayName || request.user?.username || 'Unknown User'}
                      </p>
                      <p className="text-sm text-white/60">
                        @{request.user?.username || 'unknown'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          onAcceptRequest(request.id);
                          HapticFeedback.success();
                        }}
                        className="rounded-lg bg-green-600 p-2 text-white transition-colors hover:bg-green-700"
                        title="Accept"
                      >
                        <CheckIcon className="h-5 w-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          onDeclineRequest(request.id);
                          HapticFeedback.medium();
                        }}
                        className="rounded-lg bg-red-600 p-2 text-white transition-colors hover:bg-red-700"
                        title="Decline"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </motion.button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div>
        <h3 className="mb-3 text-lg font-bold text-white">All Friends ({friends.length})</h3>
        {friends.length === 0 ? (
          <GlassCard variant="frosted" className="p-8 text-center">
            <UsersIcon className="mx-auto mb-3 h-12 w-12 text-white/40" />
            <p className="text-white/60">No friends yet. Start adding friends to see them here!</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {friends.map((friend, index) => (
              <motion.div
                key={friend.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <GlassCard
                  variant="crystal"
                  className="group cursor-pointer p-4 transition-transform hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-3">
                    <UserProfileCard userId={friend.id} trigger="both">
                      <div className="relative flex-shrink-0">
                        {friend.avatarUrl ? (
                          <ThemedAvatar
                            src={friend.avatarUrl}
                            alt={friend.displayName || friend.username}
                            size="medium"
                            className="h-12 w-12 ring-2 ring-dark-700"
                            avatarBorderId={getAvatarBorderId(friend)}
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-primary-700 font-medium text-white ring-2 ring-dark-700">
                            {friend.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {friend.status === 'online' && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-dark-900" />
                        )}
                      </div>
                    </UserProfileCard>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-white">
                        {friend.displayName || friend.username}
                      </p>
                      <p className="truncate text-sm text-white/60">@{friend.username}</p>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/messages?user=${friend.id}`);
                        HapticFeedback.medium();
                      }}
                      className="rounded-lg bg-primary-600 p-2 text-white opacity-0 transition-opacity hover:bg-primary-700 group-hover:opacity-100"
                      title="Send Message"
                    >
                      <ChatBubbleLeftRightIcon className="h-5 w-5" />
                    </motion.button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

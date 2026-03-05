/**
 * FriendsTab Component
 * Friends list with pending requests and search
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  UsersIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import UserProfileCard from '@/modules/social/components/user-profile-card';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { getAvatarBorderId } from '@/lib/utils';
import type { FriendsTabProps } from './types';

/**
 * unknown for the social module.
 */
/**
 * Friends Tab component.
 */
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
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search friends..."
          aria-label="Search friends"
          className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] py-3.5 pl-12 pr-4 text-white shadow-inner shadow-black/20 backdrop-blur-xl transition-all duration-200 placeholder:text-white/30 focus:border-primary-500/40 focus:shadow-lg focus:shadow-primary-500/5 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary-400/80">
            <span className="h-px flex-1 bg-gradient-to-r from-primary-500/30 to-transparent" />
            Pending Requests ({pendingRequests.length})
            <span className="h-px flex-1 bg-gradient-to-l from-primary-500/30 to-transparent" />
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
                      <div className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-emerald-600 font-medium text-white shadow-lg shadow-primary-500/20 ring-2 ring-primary-500/20">
                        {request.user?.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                    </UserProfileCard>

                    <div className="flex-1">
                      <p className="font-semibold text-white">
                        {request.user?.displayName || request.user?.username || 'Unknown User'}
                      </p>
                      <p className="text-sm text-white/40">
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
                        className="rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 p-2.5 text-white shadow-lg shadow-green-600/20 transition-shadow hover:shadow-green-600/40"
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
                        className="rounded-xl bg-white/[0.06] p-2.5 text-white/60 transition-all hover:bg-red-500/20 hover:text-red-400"
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
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/40">
          <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          All Friends ({friends.length})
          <span className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent" />
        </h3>
        {friends.length === 0 ? (
          <GlassCard variant="frosted" className="relative overflow-hidden p-12 text-center">
            {/* Empty state decorative gradient */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-500/[0.06] blur-[60px]" />
            </div>
            <div className="relative">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500/10 to-purple-500/10 ring-1 ring-white/[0.06]">
                <UsersIcon className="h-10 w-10 text-primary-400/60" />
              </div>
              <h4 className="mb-2 text-lg font-semibold text-white/80">No friends yet</h4>
              <p className="mx-auto max-w-sm text-sm text-white/40">
                Use the Discover tab to find people and send friend requests. Your connections will
                appear here.
              </p>
            </div>
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
                  className="group cursor-pointer p-4 transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:shadow-primary-500/5"
                >
                  <div className="flex items-center gap-3">
                    <UserProfileCard userId={friend.id} trigger="both">
                      <div className="relative flex-shrink-0">
                        {friend.avatarUrl ? (
                          <ThemedAvatar
                            src={friend.avatarUrl}
                            alt={friend.displayName || friend.username}
                            size="medium"
                            className="h-12 w-12 ring-2 ring-white/[0.08]"
                            avatarBorderId={getAvatarBorderId(friend)}
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-500/80 to-purple-600/80 font-medium text-white ring-2 ring-white/[0.08]">
                            {friend.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {friend.status === 'online' && (
                          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/40 ring-2 ring-dark-900" />
                        )}
                      </div>
                    </UserProfileCard>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-white">
                        {friend.displayName || friend.username}
                      </p>
                      <p className="truncate text-sm text-white/40">@{friend.username}</p>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/messages?user=${friend.id}`);
                        HapticFeedback.medium();
                      }}
                      className="rounded-xl bg-primary-500/10 p-2.5 text-primary-400 opacity-0 ring-1 ring-primary-500/20 transition-all hover:bg-primary-500/20 group-hover:opacity-100"
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

/**
 * FriendRequestCard component
 * Displays a friend request with accept/decline actions
 */

import { motion } from 'framer-motion';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import UserProfileCard from '@/modules/social/components/UserProfileCard';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { FriendRequestCardProps } from './types';

export function FriendRequestCard({ request, type, onAccept, onDecline }: FriendRequestCardProps) {
  // Defensive null check for user data
  const user = request.user || { username: 'Unknown', displayName: null, avatarUrl: null };
  const username = user.username || 'Unknown';
  const displayName = user.displayName || username;
  const avatarUrl = user.avatarUrl;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <GlassCard
        variant="crystal"
        className="group relative overflow-hidden"
        style={{
          boxShadow:
            type === 'incoming'
              ? '0 4px 20px rgba(16, 185, 129, 0.2)'
              : '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Animated border for incoming requests */}
        {type === 'incoming' && (
          <motion.div
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary-500/20 via-purple-500/20 to-transparent"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
        )}

        <div className="relative z-10 flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <UserProfileCard
              userId={request.user?.id || ''}
              trigger="both"
              className="cursor-pointer"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {avatarUrl ? (
                  <div className="rounded-full bg-gradient-to-br from-primary-500 to-purple-600 p-0.5">
                    <img
                      src={avatarUrl}
                      alt={username}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-primary-700 font-medium text-white">
                    {username.charAt(0).toUpperCase()}
                  </div>
                )}
              </motion.div>
            </UserProfileCard>
            <div>
              <p className="bg-gradient-to-r from-white to-primary-100 bg-clip-text font-medium text-transparent">
                {displayName}
              </p>
              <p className="text-sm text-gray-400">@{username}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {type === 'incoming' && onAccept && (
              <motion.button
                onClick={() => {
                  onAccept();
                  HapticFeedback.success();
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="group/btn rounded-lg bg-gradient-to-r from-green-600 to-green-700 p-2 transition-all hover:from-green-700 hover:to-green-800"
                style={{ boxShadow: '0 0 15px rgba(34, 197, 94, 0.4)' }}
                title="Accept"
              >
                <CheckIcon
                  className="h-5 w-5 text-white"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.5))' }}
                />
              </motion.button>
            )}
            <motion.button
              onClick={() => {
                onDecline();
                HapticFeedback.medium();
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="group/btn rounded-lg bg-dark-700/50 p-2 transition-all hover:bg-red-600/20"
              title={type === 'incoming' ? 'Decline' : 'Cancel'}
            >
              <XMarkIcon className="h-5 w-5 text-gray-400 transition-colors group-hover/btn:text-red-400" />
            </motion.button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

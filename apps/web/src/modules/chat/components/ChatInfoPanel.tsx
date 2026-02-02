import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ChatInfoPanel');
import {
  XMarkIcon,
  UserCircleIcon,
  BellSlashIcon,
  NoSymbolIcon,
  FlagIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  BuildingLibraryIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import GlassCard from '@/components/ui/GlassCard';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';
import type { UserTheme } from '@/stores/themeStore';
import { springs } from '@/lib/animations/transitions';
import { getAvatarBorderId } from '@/lib/utils';
import { useFriendStore } from '@/stores/friendStore';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { api } from '@/lib/api';

interface ChatInfoPanelProps {
  userId: string;
  conversationId?: string;
  user: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    level?: number;
    xp?: number;
    karma?: number;
    streak?: number;
    onlineStatus?: 'online' | 'offline' | 'away';
    lastSeenAt?: string;
    bio?: string;
    badges?: Array<{
      id: string;
      name: string;
      emoji: string;
      rarity: string;
    }>;
    theme?: Partial<UserTheme>;
  };
  mutualFriends?: Array<{
    id: string;
    username: string;
    avatarUrl?: string;
    avatarBorderId?: string | null;
    avatar_border_id?: string | null;
  }>;
  sharedForums?: Array<{
    id: string;
    name: string;
    icon?: string;
  }>;
  onClose: () => void;
  onMuteToggle?: (isMuted: boolean) => void;
  onBlock?: () => void;
  onReport?: () => void;
}

export default function ChatInfoPanel({
  userId,
  conversationId,
  user,
  mutualFriends = [],
  sharedForums = [],
  onClose,
  onMuteToggle,
  onBlock,
  onReport,
}: ChatInfoPanelProps) {
  const navigate = useNavigate();
  const { blockUser, isLoading: isBlockLoading } = useFriendStore();
  const [isMuted, setIsMuted] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  // Handle mute toggle with API call
  const handleMuteToggle = useCallback(async () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    HapticFeedback.light();

    // Call parent callback if provided
    onMuteToggle?.(newMutedState);

    // If we have a conversation ID, persist to backend
    if (conversationId) {
      try {
        await api.patch(`/api/v1/conversations/${conversationId}/mute`, {
          muted: newMutedState,
        });
      } catch (error) {
        // Revert on error
        setIsMuted(!newMutedState);
        logger.error('Failed to toggle mute:', error);
      }
    }
  }, [isMuted, conversationId, onMuteToggle]);

  // Handle block user
  const handleBlock = useCallback(async () => {
    if (isBlocking) return;
    setIsBlocking(true);
    HapticFeedback.warning();

    try {
      await blockUser(userId);
      onBlock?.();
      onClose(); // Close panel after blocking
    } catch (error) {
      logger.error('Failed to block user:', error);
    } finally {
      setIsBlocking(false);
      setShowBlockConfirm(false);
    }
  }, [userId, blockUser, onBlock, onClose, isBlocking]);

  // Handle report user
  const handleReport = useCallback(async () => {
    if (isReporting || !reportReason.trim()) return;
    setIsReporting(true);
    HapticFeedback.medium();

    try {
      await api.post('/api/v1/reports', {
        reported_user_id: userId,
        reason: reportReason.trim(),
        context: conversationId ? { conversation_id: conversationId } : undefined,
      });
      onReport?.();
      setShowReportModal(false);
      setReportReason('');
    } catch (error) {
      logger.error('Failed to report user:', error);
    } finally {
      setIsReporting(false);
    }
  }, [userId, conversationId, reportReason, onReport, isReporting]);

  // Calculate XP progress
  const levelXpRequired = 1000 * (user.level || 1);
  const currentLevelXp = (user.xp || 0) % levelXpRequired;
  const xpProgress = (currentLevelXp / levelXpRequired) * 100;

  // Format last seen
  const formatLastSeen = () => {
    if (user.onlineStatus === 'online') return 'Online';
    if (user.onlineStatus === 'away') return 'Away';
    if (!user.lastSeenAt) return 'Offline';

    const lastSeen = new Date(user.lastSeenAt);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Last seen just now';
    if (diffMins < 60) return `Last seen ${diffMins}m ago`;
    if (diffHours < 24) return `Last seen ${diffHours}h ago`;
    if (diffDays === 1) return 'Last seen yesterday';
    if (diffDays < 7) return `Last seen ${diffDays}d ago`;
    return 'Last seen over a week ago';
  };

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 320, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={springs.smooth}
      className="flex h-full flex-col overflow-hidden border-l border-white/10 bg-gradient-to-b from-dark-900 to-dark-950"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <h3 className="flex items-center gap-2 text-lg font-bold text-white">
          <UserCircleIcon className="h-5 w-5 text-primary-400" />
          User Info
        </h3>
        <motion.button
          onClick={onClose}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
        >
          <XMarkIcon className="h-5 w-5" />
        </motion.button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Profile Section */}
        <GlassCard variant="frosted" glow className="p-4 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ ...springs.bouncy, delay: 0.1 }}
            className="mb-3 flex justify-center"
          >
            <div className="relative">
              <ThemedAvatar
                src={user.avatarUrl}
                alt={user.displayName || user.username}
                size="large"
                userTheme={user.theme}
                avatarBorderId={getAvatarBorderId(user)}
                className="!h-24 !w-24"
              />
              {user.onlineStatus === 'online' && (
                <motion.div
                  className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-dark-900 bg-green-500"
                  animate={{
                    boxShadow: ['0 0 0 0 rgba(34, 197, 94, 0.7)', '0 0 0 8px rgba(34, 197, 94, 0)'],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>
          </motion.div>

          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-1 text-xl font-bold text-white"
          >
            {user.displayName || user.username}
          </motion.h3>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mb-3 text-sm text-gray-400"
          >
            @{user.username}
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-3 text-xs text-gray-500"
          >
            {formatLastSeen()}
          </motion.p>

          {/* Level & XP */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Level {user.level || 1}</span>
              <span className="font-bold text-primary-400">
                {currentLevelXp.toLocaleString()} / {levelXpRequired.toLocaleString()} XP
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-dark-700">
              <motion.div
                className="h-full bg-gradient-to-r from-primary-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 1, delay: 0.4 }}
              />
            </div>
          </motion.div>
        </GlassCard>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              label: 'Karma',
              value: user.karma || 0,
              icon: '🏆',
              color: 'from-yellow-500 to-orange-500',
            },
            {
              label: 'Streak',
              value: user.streak || 0,
              icon: '🔥',
              color: 'from-red-500 to-pink-500',
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 + index * 0.05 }}
            >
              <GlassCard variant="crystal" className="p-3 text-center">
                <div className="mb-1 text-2xl">{stat.icon}</div>
                <div
                  className={`bg-gradient-to-r text-2xl font-bold ${stat.color} bg-clip-text text-transparent`}
                >
                  {stat.value.toLocaleString()}
                </div>
                <div className="text-xs font-medium text-gray-400">{stat.label}</div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Bio */}
        {user.bio && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <GlassCard variant="frosted" className="p-3">
              <p className="text-sm leading-relaxed text-gray-300">{user.bio}</p>
            </GlassCard>
          </motion.div>
        )}

        {/* Top Badges */}
        {user.badges && user.badges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-400">
              <SparklesIcon className="h-4 w-4 text-primary-400" />
              Top Badges
            </h4>
            <div className="flex flex-wrap gap-2">
              {user.badges.slice(0, 3).map((badge, index) => (
                <motion.div
                  key={badge.id}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ ...springs.bouncy, delay: 0.65 + index * 0.05 }}
                >
                  <GlassCard variant="neon" glow className="flex items-center gap-2 px-3 py-2">
                    <span className="text-xl">{badge.emoji}</span>
                    <span className="text-xs font-medium text-white">{badge.name}</span>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Mutual Friends */}
        {mutualFriends.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-400">
              <UserGroupIcon className="h-4 w-4 text-primary-400" />
              Mutual Friends ({mutualFriends.length})
            </h4>
            <div className="flex -space-x-2">
              {mutualFriends.slice(0, 5).map((friend, index) => (
                <motion.div
                  key={friend.id}
                  initial={{ scale: 0, x: -20 }}
                  animate={{ scale: 1, x: 0 }}
                  transition={{ delay: 0.75 + index * 0.05 }}
                  className="relative"
                  title={friend.username}
                >
                  {friend.avatarUrl ? (
                    <div
                      className="cursor-pointer rounded-full border-2 border-dark-900 transition-transform hover:scale-110"
                      onClick={() => navigate(`/user/${friend.id}`)}
                    >
                      <ThemedAvatar
                        src={friend.avatarUrl}
                        alt={friend.username}
                        size="medium"
                        avatarBorderId={friend.avatarBorderId ?? friend.avatar_border_id ?? null}
                      />
                    </div>
                  ) : (
                    <div
                      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-dark-900 bg-gradient-to-br from-primary-600 to-purple-600 font-bold text-white transition-transform hover:scale-110"
                      onClick={() => navigate(`/user/${friend.id}`)}
                    >
                      {friend.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </motion.div>
              ))}
              {mutualFriends.length > 5 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1 }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dark-900 bg-dark-700 text-xs font-bold text-gray-400"
                >
                  +{mutualFriends.length - 5}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Shared Forums */}
        {sharedForums.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85 }}
          >
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-400">
              <BuildingLibraryIcon className="h-4 w-4 text-primary-400" />
              Shared Forums ({sharedForums.length})
            </h4>
            <div className="space-y-2">
              {sharedForums.slice(0, 3).map((forum, index) => (
                <motion.div
                  key={forum.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.05 }}
                >
                  <GlassCard
                    variant="crystal"
                    className="flex cursor-pointer items-center gap-2 p-2 transition-transform hover:scale-[1.02]"
                    onClick={() => navigate(`/forums/${forum.id}`)}
                  >
                    {forum.icon && <span className="text-lg">{forum.icon}</span>}
                    <span className="truncate text-sm font-medium text-white">{forum.name}</span>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="space-y-2 border-t border-white/10 pt-4"
        >
          <motion.button
            onClick={() => {
              if (!userId || userId === 'undefined' || userId === 'null') {
                logger.warn('ChatInfoPanel: Cannot view profile - invalid userId');
                return;
              }
              navigate(`/user/${userId}`);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-3 font-medium text-white transition-colors hover:bg-primary-500"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <UserCircleIcon className="h-5 w-5" />
            View Full Profile
          </motion.button>

          <motion.button
            onClick={() => {
              try {
                navigate('/customize/chat');
              } catch (error) {
                logger.error('Navigation to customize/chat failed:', error);
              }
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-purple-500/30 bg-purple-600/20 px-4 py-2 font-medium text-purple-400 transition-colors hover:bg-purple-600/30"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
            Customize Chat
          </motion.button>

          <div className="grid grid-cols-2 gap-2">
            <motion.button
              onClick={handleMuteToggle}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isMuted
                  ? 'border border-yellow-500/30 bg-yellow-600/20 text-yellow-400'
                  : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <BellSlashIcon className="h-4 w-4" />
              {isMuted ? 'Unmute' : 'Mute'}
            </motion.button>

            <motion.button
              onClick={() => setShowBlockConfirm(true)}
              disabled={isBlocking || isBlockLoading}
              className="flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-600/20 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-600/30 disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <NoSymbolIcon className="h-4 w-4" />
              {isBlocking ? 'Blocking...' : 'Block'}
            </motion.button>
          </div>

          <motion.button
            onClick={() => setShowReportModal(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-dark-700 px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-dark-600"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FlagIcon className="h-4 w-4" />
            Report User
          </motion.button>
        </motion.div>
      </div>

      {/* Block Confirmation Modal */}
      <AnimatePresence>
        {showBlockConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setShowBlockConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-xl border border-white/10 bg-dark-800 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-2 text-lg font-bold text-white">
                Block {user.displayName || user.username}?
              </h3>
              <p className="mb-4 text-sm text-gray-400">
                They won't be able to message you or see your content. You can unblock them later
                from settings.
              </p>
              <div className="flex gap-3">
                <motion.button
                  onClick={() => setShowBlockConfirm(false)}
                  className="flex-1 rounded-lg bg-dark-700 px-4 py-2 text-gray-300 hover:bg-dark-600"
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleBlock}
                  disabled={isBlocking}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-500 disabled:opacity-50"
                  whileTap={{ scale: 0.98 }}
                >
                  {isBlocking ? 'Blocking...' : 'Block'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setShowReportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-xl border border-white/10 bg-dark-800 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-2 text-lg font-bold text-white">
                Report {user.displayName || user.username}
              </h3>
              <p className="mb-4 text-sm text-gray-400">
                Please describe why you're reporting this user.
              </p>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Describe the issue..."
                className="mb-4 h-24 w-full resize-none rounded-lg border border-white/10 bg-dark-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
              />
              <div className="flex gap-3">
                <motion.button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportReason('');
                  }}
                  className="flex-1 rounded-lg bg-dark-700 px-4 py-2 text-gray-300 hover:bg-dark-600"
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleReport}
                  disabled={isReporting || !reportReason.trim()}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-500 disabled:opacity-50"
                  whileTap={{ scale: 0.98 }}
                >
                  {isReporting ? 'Sending...' : 'Report'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}

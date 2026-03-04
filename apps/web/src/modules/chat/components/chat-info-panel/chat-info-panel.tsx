/**
 * ChatInfoPanel Component
 *
 * Side panel showing user info, stats, mutual connections, and actions.
 */

import { motion } from 'motion/react';
import { XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { springs } from '@/lib/animations/transitions';
import { useChatInfoPanel } from './useChatInfoPanel';
import { ProfileSection } from './profile-section';
import { StatsGrid } from './stats-grid';
import { BadgesList } from './badges-list';
import { MutualFriendsList } from './mutual-friends-list';
import { SharedForumsList } from './shared-forums-list';
import { QuickActions } from './quick-actions';
import { BlockConfirmModal, ReportModal } from './confirmation-modals';
import { DisappearingMessagesToggle } from '../disappearing-messages-toggle';
import type { ChatInfoPanelProps } from './types';

/**
 * Chat Info Panel component.
 */
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
  const {
    isMuted,
    isBlocking,
    isBlockLoading,
    isReporting,
    showBlockConfirm,
    setShowBlockConfirm,
    showReportModal,
    setShowReportModal,
    reportReason,
    setReportReason,
    messageTTL,
    handleMuteToggle,
    handleBlock,
    handleReport,
    handleViewProfile,
    handleCustomizeChat,
    handleNavigateToUser,
    handleNavigateToForum,
    handleUpdateTTL,
  } = useChatInfoPanel({
    userId,
    conversationId,
    onMuteToggle,
    onBlock,
    onReport,
    onClose,
  });

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
        <ProfileSection user={user} />

        {/* Stats Grid */}
        <StatsGrid karma={user.karma || 0} streak={user.streak || 0} />

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
        <BadgesList badges={user.badges || []} />

        {/* Mutual Friends */}
        <MutualFriendsList friends={mutualFriends} onFriendClick={handleNavigateToUser} />

        {/* Shared Forums */}
        <SharedForumsList forums={sharedForums} onForumClick={handleNavigateToForum} />

        {/* Disappearing Messages */}
        {conversationId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <GlassCard variant="frosted" className="p-3">
              <p className="mb-2 text-xs font-semibold uppercase text-white/30">
                Disappearing Messages
              </p>
              <DisappearingMessagesToggle
                conversationId={conversationId}
                currentTTL={messageTTL}
                onUpdate={handleUpdateTTL}
              />
            </GlassCard>
          </motion.div>
        )}

        {/* Quick Actions */}
        <QuickActions
          isMuted={isMuted}
          isBlocking={isBlocking}
          isBlockLoading={isBlockLoading}
          onViewProfile={handleViewProfile}
          onCustomizeChat={handleCustomizeChat}
          onMuteToggle={handleMuteToggle}
          onBlockClick={() => setShowBlockConfirm(true)}
          onReportClick={() => setShowReportModal(true)}
        />
      </div>

      {/* Block Confirmation Modal */}
      <BlockConfirmModal
        isOpen={showBlockConfirm}
        userName={user.displayName || user.username}
        isBlocking={isBlocking}
        onConfirm={handleBlock}
        onCancel={() => setShowBlockConfirm(false)}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        userName={user.displayName || user.username}
        isReporting={isReporting}
        reportReason={reportReason}
        onReasonChange={setReportReason}
        onConfirm={handleReport}
        onCancel={() => {
          setShowReportModal(false);
          setReportReason('');
        }}
      />
    </motion.aside>
  );
}

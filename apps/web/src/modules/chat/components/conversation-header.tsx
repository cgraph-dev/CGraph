/**
 * ConversationHeader Component
 *
 * Displays the conversation header with participant info, status,
 * and action buttons (call, info, settings).
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  PhoneIcon,
  VideoCameraIcon,
  InformationCircleIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import UserProfileCard from '@/modules/social/components/user-profile-card';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { getAvatarBorderId } from '@/lib/utils';
import type { Conversation } from '@/modules/chat/store';

interface ConversationHeaderProps {
  conversationName: string;
  otherParticipant: Conversation['participants'][0] | undefined;
  isOtherUserOnline: boolean;
  typing: string[];
  uiPreferences: {
    glassEffect: 'default' | 'frosted' | 'crystal' | 'neon' | 'holographic';
    enableGlow: boolean;
    enableHaptic: boolean;
  };
  onStartVoiceCall: () => void;
  onStartVideoCall: () => void;
  onToggleSearch: () => void;
  onToggleScheduledList: () => void;
  onToggleInfoPanel: () => void;
  onToggleSettings: () => void;
  onToggleE2EETester: () => void;
  showScheduledList: boolean;
  showInfoPanel: boolean;
  showSettings: boolean;
  formatLastSeen: (lastSeenAt: string | null | undefined) => string;
}

function ConversationHeaderComponent({
  conversationName,
  otherParticipant,
  isOtherUserOnline,
  typing,
  uiPreferences,
  onStartVoiceCall,
  onStartVideoCall,
  onToggleSearch,
  onToggleScheduledList,
  onToggleInfoPanel,
  onToggleSettings,
  onToggleE2EETester,
  showScheduledList,
  showInfoPanel,
  showSettings,
  formatLastSeen,
}: ConversationHeaderProps) {
  return (
    <GlassCard
      variant={uiPreferences.glassEffect}
      hover3D={false}
      glow={uiPreferences.enableGlow}
      borderGradient
      className="z-10 flex h-16 flex-shrink-0 items-center justify-between rounded-none"
    >
      <div className="flex h-full w-full items-center pl-4 pr-2">
        <motion.div
          className="flex min-w-0 flex-1 items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <UserProfileCard
            userId={otherParticipant?.user?.id || ''}
            trigger="both"
            className="cursor-pointer"
          >
            <motion.div className="relative" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <ThemedAvatar
                src={otherParticipant?.user?.avatarUrl}
                alt={conversationName}
                size="large"
                avatarBorderId={getAvatarBorderId(otherParticipant?.user)}
              />
              {isOtherUserOnline && (
                <motion.div
                  className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-dark-900 bg-green-500 shadow-lg"
                  animate={{
                    boxShadow: ['0 0 0 0 rgba(34, 197, 94, 0.7)', '0 0 0 6px rgba(34, 197, 94, 0)'],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.div>
          </UserProfileCard>
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              {conversationName}
              {uiPreferences.enableGlow && (
                <SparklesIcon className="h-4 w-4 animate-pulse text-primary-400" />
              )}
            </h2>
            <div className="flex items-center gap-1.5">
              <ShieldCheckIcon className="h-3 w-3 text-green-400" title="End-to-end encrypted" />
              <p className="text-xs text-gray-400">
                {typing.length > 0 ? (
                  <motion.span
                    className="font-medium text-primary-400"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    typing...
                  </motion.span>
                ) : isOtherUserOnline ? (
                  <span className="font-medium text-green-400">Online</span>
                ) : (
                  formatLastSeen(otherParticipant?.user?.lastSeenAt)
                )}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="ml-auto flex flex-shrink-0 items-center gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* E2EE Indicator */}
          <motion.button
            onClick={() => {
              onToggleE2EETester();
              if (uiPreferences.enableHaptic) HapticFeedback.medium();
            }}
            className="mr-2 flex cursor-pointer items-center gap-1.5 rounded-lg border border-green-500/30 bg-green-500/10 px-2.5 py-1 backdrop-blur-sm transition-all hover:bg-green-500/20"
            title="Click to test E2EE connection"
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)' }}
            whileTap={{ scale: 0.95 }}
            animate={
              uiPreferences.enableGlow
                ? {
                    boxShadow: [
                      '0 0 10px rgba(34, 197, 94, 0.2)',
                      '0 0 20px rgba(34, 197, 94, 0.4)',
                      '0 0 10px rgba(34, 197, 94, 0.2)',
                    ],
                  }
                : {}
            }
            transition={{ duration: 2, repeat: Infinity }}
          >
            <LockClosedIcon className="h-3.5 w-3.5 text-green-400" />
            <span className="text-xs font-bold tracking-wider text-green-400">E2EE</span>
          </motion.button>

          <motion.button
            onClick={onStartVoiceCall}
            className="rounded-lg p-2 text-gray-400 transition-all duration-200 hover:bg-white/10 hover:text-white"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Voice Call"
          >
            <PhoneIcon className="h-5 w-5" />
          </motion.button>

          <motion.button
            onClick={onStartVideoCall}
            className="rounded-lg p-2 text-gray-400 transition-all duration-200 hover:bg-white/10 hover:text-white"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Video Call"
          >
            <VideoCameraIcon className="h-5 w-5" />
          </motion.button>

          <motion.button
            onClick={onToggleSearch}
            className="rounded-lg p-2 text-gray-400 transition-all duration-200 hover:bg-white/10 hover:text-white"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Search Messages"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </motion.button>

          <motion.button
            onClick={onToggleScheduledList}
            className={`rounded-lg p-2 transition-all duration-200 hover:bg-white/10 ${
              showScheduledList
                ? 'bg-purple-500/20 text-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Scheduled Messages"
          >
            <ClockIcon className="h-5 w-5" />
          </motion.button>

          <motion.button
            onClick={onToggleInfoPanel}
            className={`rounded-lg p-2 transition-all duration-200 hover:bg-white/10 ${
              showInfoPanel
                ? 'bg-primary-500/20 text-primary-400'
                : 'text-gray-400 hover:text-white'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Chat Info"
          >
            <InformationCircleIcon className="h-5 w-5" />
          </motion.button>

          <motion.button
            onClick={onToggleSettings}
            className={`rounded-lg p-2 transition-all duration-200 hover:bg-white/10 ${
              showSettings ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:text-white'
            }`}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            title="UI Settings"
          >
            <Cog6ToothIcon className="h-5 w-5" />
          </motion.button>
        </motion.div>
      </div>
    </GlassCard>
  );
}

export const ConversationHeader = memo(ConversationHeaderComponent);

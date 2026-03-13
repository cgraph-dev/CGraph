/**
 * Call Controls — Bottom bar for call overlay
 *
 * Buttons: Mic, Camera, Screen Share, Reactions, Participants, Chat, Settings, End Call
 * Toggle state with highlighted active indicators
 *
 * @module shared/components/call-controls
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MicrophoneIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  ComputerDesktopIcon,
  FaceSmileIcon,
  UserGroupIcon,
  ChatBubbleLeftIcon,
  Cog6ToothIcon,
  PhoneXMarkIcon,
} from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────

interface CallControlsProps {
  isMuted?: boolean;
  isCameraOff?: boolean;
  isScreenSharing?: boolean;
  onToggleMic?: () => void;
  onToggleCamera?: () => void;
  onToggleScreen?: () => void;
  onEndCall?: () => void;
  onOpenChat?: () => void;
  onOpenParticipants?: () => void;
  onOpenSettings?: () => void;
}

// ── Reaction Emojis ────────────────────────────────────────────────────

const quickReactions = ['👍', '❤️', '😂', '😮', '🎉', '🔥'];

// ── Component ──────────────────────────────────────────────────────────

/** Description. */
/** Call Controls component. */
export function CallControls({
  isMuted = false,
  isCameraOff = false,
  isScreenSharing = false,
  onToggleMic,
  onToggleCamera,
  onToggleScreen,
  onEndCall,
  onOpenChat,
  onOpenParticipants,
  onOpenSettings,
}: CallControlsProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [floatingEmoji, setFloatingEmoji] = useState<{ id: number; emoji: string } | null>(null);

  const sendReaction = (emoji: string) => {
    setFloatingEmoji({ id: Date.now(), emoji });
    setTimeout(() => setFloatingEmoji(null), 1500);
    setShowReactions(false);
  };

  return (
    <div className="relative flex items-center justify-center gap-2 px-4 py-4">
      {/* Floating reaction */}
      <AnimatePresence>
        {floatingEmoji && (
          <motion.div
            key={floatingEmoji.id}
            className="pointer-events-none absolute bottom-full left-1/2 text-4xl"
            initial={{ y: 0, opacity: 1, scale: 0.5 }}
            animate={{ y: -80, opacity: 0, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          >
            {floatingEmoji.emoji}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reaction popup */}
      <AnimatePresence>
        {showReactions && (
          <motion.div
            className="absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 gap-1 rounded-xl border border-white/[0.06] bg-[#1e1f22] px-2 py-1.5 shadow-xl"
            initial={{ y: 8, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 8, opacity: 0, scale: 0.9 }}
          >
            {quickReactions.map((emoji) => (
              <button
                key={emoji}
                onClick={() => sendReaction(emoji)}
                className="p-1 text-xl transition-transform hover:scale-125"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control buttons */}
      <ControlButton
        icon={<MicrophoneIcon className="h-5 w-5" />}
        label="Mic"
        active={!isMuted}
        danger={isMuted}
        onClick={onToggleMic}
      />
      <ControlButton
        icon={
          isCameraOff ? (
            <VideoCameraSlashIcon className="h-5 w-5" />
          ) : (
            <VideoCameraIcon className="h-5 w-5" />
          )
        }
        label="Camera"
        active={!isCameraOff}
        danger={isCameraOff}
        onClick={onToggleCamera}
      />
      <ControlButton
        icon={<ComputerDesktopIcon className="h-5 w-5" />}
        label="Share"
        active={isScreenSharing}
        highlight={isScreenSharing}
        onClick={onToggleScreen}
      />
      <ControlButton
        icon={<FaceSmileIcon className="h-5 w-5" />}
        label="React"
        onClick={() => setShowReactions((s) => !s)}
      />
      <ControlButton
        icon={<UserGroupIcon className="h-5 w-5" />}
        label="People"
        onClick={onOpenParticipants}
      />
      <ControlButton
        icon={<ChatBubbleLeftIcon className="h-5 w-5" />}
        label="Chat"
        onClick={onOpenChat}
      />
      <ControlButton
        icon={<Cog6ToothIcon className="h-5 w-5" />}
        label="Settings"
        onClick={onOpenSettings}
      />

      {/* End call — larger, red */}
      <button
        onClick={onEndCall}
        className="ml-2 flex flex-col items-center gap-0.5 rounded-xl bg-red-600 px-6 py-2 text-white transition-colors hover:bg-red-500"
      >
        <PhoneXMarkIcon className="h-5 w-5" />
        <span className="text-[10px] font-medium">Leave</span>
      </button>
    </div>
  );
}

// ── Control Button ─────────────────────────────────────────────────────

function ControlButton({
  icon,
  label,
  active: _active,
  danger,
  highlight,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  danger?: boolean;
  highlight?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-0.5 rounded-xl p-3 transition-colors',
        danger
          ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
          : highlight
            ? 'bg-primary-600/20 text-primary-400 hover:bg-primary-600/30'
            : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.10] hover:text-white/80'
      )}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

export default CallControls;

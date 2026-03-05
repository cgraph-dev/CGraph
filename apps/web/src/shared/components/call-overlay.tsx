/**
 * Call Overlay — Full-screen call view with adaptive participant grid
 *
 * Features:
 * - Adaptive layout: 1=full, 2=side-by-side, 3-4=2x2, 5+=spotlight+sidebar
 * - Speaking indicator (green border glow)
 * - Screen share spotlight
 * - PIP mode (320x180 draggable corner)
 * - Name labels, mute/camera status per participant
 *
 * @module shared/components/call-overlay
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  XMarkIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';
import { CallControls } from './call-controls';

// ── Types ──────────────────────────────────────────────────────────────

export interface CallParticipant {
  id: string;
  name: string;
  avatar?: string;
  isMuted?: boolean;
  isCameraOff?: boolean;
  isSpeaking?: boolean;
  isScreenSharing?: boolean;
  isSelf?: boolean;
}

interface CallOverlayProps {
  visible: boolean;
  participants?: CallParticipant[];
  onEndCall?: () => void;
  onToggleMic?: () => void;
  onToggleCamera?: () => void;
  onToggleScreen?: () => void;
  isMuted?: boolean;
  isCameraOff?: boolean;
  isScreenSharing?: boolean;
}

// ── Grid Layout ────────────────────────────────────────────────────────

function getGridClass(count: number, hasScreenShare: boolean): string {
  if (hasScreenShare) return 'grid-cols-1'; // spotlight mode
  if (count === 1) return 'grid-cols-1';
  if (count === 2) return 'grid-cols-2';
  if (count <= 4) return 'grid-cols-2 grid-rows-2';
  if (count <= 9) return 'grid-cols-3';
  return 'grid-cols-4';
}

// ── Component ──────────────────────────────────────────────────────────

export function CallOverlay({
  visible,
  participants = [],
  onEndCall,
  onToggleMic,
  onToggleCamera,
  onToggleScreen,
  isMuted = false,
  isCameraOff = false,
  isScreenSharing = false,
}: CallOverlayProps) {
  const [pip, setPip] = useState(false);

  const screensharer = participants.find((p) => p.isScreenSharing);
  const hasScreenShare = !!screensharer;
  const gridParticipants = hasScreenShare
    ? participants.filter((p) => !p.isScreenSharing)
    : participants;

  const togglePip = useCallback(() => setPip((p) => !p), []);

  if (!visible) return null;

  // PIP mode
  if (pip) {
    return (
      <motion.div
        drag
        dragMomentum={false}
        className="fixed bottom-24 right-6 z-[9999] w-[320px] h-[180px] rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-[#111214] cursor-move"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
      >
        {/* Mini participant grid */}
        <div className="w-full h-full grid grid-cols-2 gap-px bg-black/50">
          {participants.slice(0, 4).map((p) => (
            <ParticipantTile key={p.id} participant={p} compact />
          ))}
        </div>
        {/* PIP controls */}
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={togglePip}
            className="p-1 rounded bg-black/60 text-white/60 hover:text-white transition-colors"
          >
            <ArrowsPointingOutIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onEndCall}
            className="p-1 rounded bg-red-600 text-white hover:bg-red-500 transition-colors"
          >
            <XMarkIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>
    );
  }

  // Full overlay
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] bg-[#111214] flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-white/60">
              {participants.length} participant{participants.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={togglePip}
            className="p-2 rounded-lg text-white/40 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
          >
            <ArrowsPointingInIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Participant area */}
        <div className="flex-1 px-4 pb-2 flex gap-3 overflow-hidden">
          {/* Screen share spotlight */}
          {hasScreenShare && screensharer && (
            <div className="flex-1 rounded-xl overflow-hidden bg-black/40 border border-white/[0.06] flex items-center justify-center relative">
              <ComputerDesktopIcon className="h-16 w-16 text-white/10" />
              <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 rounded-lg px-3 py-1.5">
                <ComputerDesktopIcon className="h-4 w-4 text-red-400" />
                <span className="text-sm text-white/80">{screensharer.name}&apos;s screen</span>
              </div>
            </div>
          )}

          {/* Participant grid */}
          <div
            className={cn(
              'grid gap-2 auto-rows-fr',
              hasScreenShare ? 'w-[240px] grid-cols-1' : 'flex-1',
              !hasScreenShare && getGridClass(gridParticipants.length, false),
            )}
          >
            <AnimatePresence>
              {gridParticipants.map((p) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                >
                  <ParticipantTile participant={p} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Controls */}
        <CallControls
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          isScreenSharing={isScreenSharing}
          onToggleMic={onToggleMic}
          onToggleCamera={onToggleCamera}
          onToggleScreen={onToggleScreen}
          onEndCall={onEndCall}
        />
      </motion.div>
    </AnimatePresence>
  );
}

// ── Participant Tile ───────────────────────────────────────────────────

function ParticipantTile({
  participant,
  compact = false,
}: {
  participant: CallParticipant;
  compact?: boolean;
}) {
  const p = participant;

  return (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden bg-[#1e1f22] flex items-center justify-center h-full',
        p.isSpeaking && 'ring-2 ring-green-500/60',
        compact && 'rounded-none',
      )}
    >
      {/* Avatar (shown when camera off) */}
      {p.avatar ? (
        <img
          src={p.avatar}
          alt=""
          className={cn('rounded-full object-cover', compact ? 'h-10 w-10' : 'h-20 w-20')}
        />
      ) : (
        <div
          className={cn(
            'rounded-full bg-primary-600 flex items-center justify-center font-bold text-white',
            compact ? 'h-10 w-10 text-sm' : 'h-20 w-20 text-2xl',
          )}
        >
          {p.name.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Name label */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 flex items-center gap-1.5 bg-gradient-to-t from-black/60 to-transparent',
          compact ? 'px-1.5 py-1' : 'px-3 py-2',
        )}
      >
        <span className={cn('text-white/80 truncate', compact ? 'text-[10px]' : 'text-sm font-medium')}>
          {p.name}
          {p.isSelf && ' (You)'}
        </span>
        {p.isMuted && (
          <MicrophoneIcon className={cn('text-red-400 shrink-0', compact ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5')} />
        )}
        {p.isCameraOff && (
          <VideoCameraSlashIcon className={cn('text-white/30 shrink-0', compact ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5')} />
        )}
      </div>
    </div>
  );
}

export default CallOverlay;

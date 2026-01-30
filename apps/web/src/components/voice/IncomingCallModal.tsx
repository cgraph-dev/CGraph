/**
 * IncomingCallModal Component
 *
 * Displays an incoming voice/video call notification with accept/decline buttons.
 * Features call type indication, caller information, and animated UI.
 *
 * @version 0.9.5
 * @since 2026-01-26
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneIcon, VideoCameraIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { logger } from '@/lib/logger';
import type { IncomingCall } from '@/stores/incomingCallStore';

export interface IncomingCallModalProps {
  call: IncomingCall;
  onAccept: (roomId: string, isVideo: boolean) => void;
  onDecline: () => void;
}

/**
 * IncomingCallModal Component
 *
 * Displays a fullscreen incoming call notification with:
 * - Caller avatar and name
 * - Call type indicator (voice/video)
 * - Accept and decline buttons
 * - Ringing animation
 * - Auto-dismiss after 30 seconds
 */
export function IncomingCallModal({ call, onAccept, onDecline }: IncomingCallModalProps) {
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Auto-dismiss after 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed((prev) => {
        if (prev >= 30) {
          onDecline();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onDecline]);

  const handleAccept = () => {
    HapticFeedback.success();
    onAccept(call.roomId, call.type === 'video');
  };

  const handleDecline = () => {
    HapticFeedback.medium();
    onDecline();
  };

  const isVideo = call.type === 'video';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md"
    >
      <GlassCard variant="neon" glow className="relative w-full max-w-md rounded-3xl p-8">
        {/* Call Type Badge */}
        <div className="absolute right-6 top-6 flex items-center gap-2 rounded-full bg-primary-500/20 px-3 py-1.5">
          {isVideo ? (
            <VideoCameraIcon className="h-4 w-4 text-primary-400" />
          ) : (
            <PhoneIcon className="h-4 w-4 text-primary-400" />
          )}
          <span className="text-xs font-semibold uppercase text-primary-400">
            {isVideo ? 'Video' : 'Voice'}
          </span>
        </div>

        {/* Caller Avatar with Pulse Animation */}
        <div className="mb-6 flex justify-center">
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              boxShadow: [
                '0 0 0 0 rgba(16, 185, 129, 0.7)',
                '0 0 0 20px rgba(16, 185, 129, 0)',
                '0 0 0 0 rgba(16, 185, 129, 0)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative"
          >
            {call.callerAvatar ? (
              <img
                src={call.callerAvatar}
                alt={call.callerName}
                className="h-32 w-32 rounded-full border-4 border-primary-500 object-cover"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-primary-500 bg-gradient-to-br from-primary-600 to-purple-600">
                <span className="text-5xl font-bold text-white">
                  {call.callerName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Caller Info */}
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-2xl font-bold text-white">{call.callerName}</h2>
          <p className="text-gray-400">Incoming {isVideo ? 'video' : 'voice'} call...</p>
        </div>

        {/* Timer */}
        <div className="mb-6 text-center">
          <p className="text-sm text-gray-500">
            Ringing for {timeElapsed}s {timeElapsed >= 25 && '(auto-declining soon)'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          {/* Decline Button */}
          <motion.button
            onClick={handleDecline}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group flex flex-1 items-center justify-center gap-3 rounded-2xl bg-red-500 py-4 font-semibold text-white shadow-lg transition-all hover:bg-red-600 hover:shadow-xl"
          >
            <XMarkIcon className="h-6 w-6" />
            <span>Decline</span>
          </motion.button>

          {/* Accept Button */}
          <motion.button
            onClick={handleAccept}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              boxShadow: [
                '0 0 20px rgba(34, 197, 94, 0.5)',
                '0 0 30px rgba(34, 197, 94, 0.8)',
                '0 0 20px rgba(34, 197, 94, 0.5)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="group flex flex-1 items-center justify-center gap-3 rounded-2xl bg-green-500 py-4 font-semibold text-white shadow-lg transition-all hover:bg-green-600 hover:shadow-xl"
          >
            <CheckIcon className="h-6 w-6" />
            <span>Accept</span>
          </motion.button>
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="mt-4 text-center text-xs text-gray-500">
          Press <kbd className="rounded bg-dark-700 px-1.5 py-0.5">A</kbd> to accept or{' '}
          <kbd className="rounded bg-dark-700 px-1.5 py-0.5">D</kbd> to decline
        </div>
      </GlassCard>
    </motion.div>
  );
}

/**
 * Wrapper component that shows the incoming call modal when there's an active incoming call
 */
export function IncomingCallNotification() {
  const [call, setCall] = useState<IncomingCall | null>(null);

  // This will be populated by the socket listener
  useEffect(() => {
    // Subscribe to incoming call events
    // This is handled in the socket manager
  }, []);

  const handleAccept = (roomId: string, isVideo: boolean) => {
    // Handle accepting the call
    // This will be implemented when wiring up to WebRTC
    logger.log('Accepting call:', { roomId, isVideo });
    setCall(null);
  };

  const handleDecline = () => {
    setCall(null);
  };

  return (
    <AnimatePresence>
      {call && <IncomingCallModal call={call} onAccept={handleAccept} onDecline={handleDecline} />}
    </AnimatePresence>
  );
}

export default IncomingCallModal;

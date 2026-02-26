/**
 * ConnectingState component - shown while call is connecting
 */

import { motion } from 'framer-motion';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { CALL_STATES, pulseAnimation } from './constants';
import type { CallUser, CallStatus } from './types';

interface ConnectingStateProps {
  recipient: CallUser | null;
  callStatus: CallStatus;
}

/**
 * unknown for the calls module.
 */
/**
 * Connecting State component.
 */
export function ConnectingState({ recipient, callStatus }: ConnectingStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <motion.div
        animate={pulseAnimation}
        className="mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-primary-500/20"
      >
        {recipient?.avatarUrl ? (
          <ThemedAvatar
            src={recipient.avatarUrl}
            alt={recipient.displayName}
            size="xlarge"
            className="h-24 w-24"
            avatarBorderId={recipient.avatarBorderId ?? recipient.avatar_border_id ?? null}
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-purple-600 text-4xl font-bold text-white">
            {recipient?.displayName?.charAt(0).toUpperCase() || '?'}
          </div>
        )}
      </motion.div>
      <h2 className="mb-2 text-2xl font-semibold text-white">{recipient?.displayName}</h2>
      <p className="text-gray-400">{CALL_STATES[callStatus]}</p>

      {/* Animated Rings */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.5, opacity: 0.8 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.6,
            }}
            className="absolute h-32 w-32 rounded-full border-2 border-primary-500/30"
          />
        ))}
      </div>
    </div>
  );
}

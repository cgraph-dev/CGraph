/**
 * CallHeader component - displays recipient info and connection quality
 */

import { motion } from 'framer-motion';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { CALL_STATES } from './constants';
import type { CallUser, CallStatus } from './types';

interface CallHeaderProps {
  recipient: CallUser | null;
  callStatus: CallStatus;
  formattedDuration: string;
  showControls: boolean;
}

export function CallHeader({
  recipient,
  callStatus,
  formattedDuration,
  showControls,
}: CallHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : -20 }}
      className="relative z-10 flex items-center justify-between p-4"
    >
      <div className="flex items-center gap-4">
        {recipient && (
          <>
            {recipient.avatarUrl ? (
              <ThemedAvatar
                src={recipient.avatarUrl}
                alt={recipient.displayName}
                size="medium"
                className="h-12 w-12 ring-2 ring-primary-500/50"
                avatarBorderId={recipient.avatarBorderId ?? recipient.avatar_border_id ?? null}
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-purple-600 text-xl font-bold text-white">
                {recipient.displayName?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-white">{recipient.displayName}</h2>
              <p className="text-sm text-gray-400">
                {callStatus === 'connected' ? formattedDuration : CALL_STATES[callStatus]}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Connection Quality Indicator */}
      <div className="flex items-center gap-2 rounded-full bg-dark-800/80 px-3 py-1.5">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4].map((bar) => (
            <div
              key={bar}
              className={`w-1 rounded-full transition-all duration-300 ${
                bar <= 3 ? 'bg-green-500' : 'bg-dark-600'
              }`}
              style={{ height: `${bar * 4}px` }}
            />
          ))}
        </div>
        <span className="text-xs text-gray-400">Good</span>
      </div>
    </motion.div>
  );
}

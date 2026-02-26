/**
 * Constants for CallScreen module
 */

import { durations } from '@cgraph/animation-constants';
import type { CallStatus } from './types';

export const CALL_STATES: Record<CallStatus, string> = {
  idle: 'Initializing...',
  ringing: 'Calling...',
  connecting: 'Connecting...',
  connected: 'Connected',
  ended: 'Call Ended',
  error: 'Connection Error',
};

export const controlVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: durations.slow.ms / 1000 } },
  exit: { opacity: 0, y: 50 },
};

export const pulseAnimation = {
  scale: [1, 1.1, 1],
  opacity: [0.5, 0.8, 0.5],
  transition: { duration: durations.loop.ms / 1000, repeat: Infinity },
};

/**
 * Constants for CallScreen module
 */

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
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: 50 },
};

export const pulseAnimation = {
  scale: [1, 1.1, 1],
  opacity: [0.5, 0.8, 0.5],
  transition: { duration: 2, repeat: Infinity },
};

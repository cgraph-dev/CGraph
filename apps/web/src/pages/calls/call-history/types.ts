/**
 * Call history type definitions.
 * @module
 */
export type CallType = 'voice' | 'video';
export type CallDirection = 'incoming' | 'outgoing' | 'missed';

export interface CallRecord {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  type: CallType;
  direction: CallDirection;
  /** Duration in seconds, 0 for missed calls */
  duration: number;
  timestamp: string;
}

export interface CallSection {
  title: string;
  calls: CallRecord[];
}

export type CallFilter = 'all' | 'missed';

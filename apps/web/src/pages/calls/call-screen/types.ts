/**
 * Type definitions for CallScreen module
 */

export interface CallUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  avatarBorderId?: string | null;
  avatar_border_id?: string | null;
}

export type CallType = 'audio' | 'video';

export type CallStatus = 'idle' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'error';

export interface CallParticipant {
  userId: string;
  stream: MediaStream | null;
  user: CallUser | null;
  isLocal: boolean;
}

export interface VideoTileProps {
  stream: MediaStream | null;
  user: CallUser | null;
  isMuted?: boolean;
  isLocal?: boolean;
  isPinned?: boolean;
  onPin?: () => void;
}

export interface CallControlProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
}

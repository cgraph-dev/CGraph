/**
 * FriendRequestsScreen Types
 */

import { FriendRequest } from '../../../types';

export type TabType = 'incoming' | 'outgoing';

export interface RequestCardProps {
  item: FriendRequest;
  index: number;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  processingId: string | null;
  isIncoming: boolean;
}

export interface EmptyRequestsStateProps {
  type: TabType;
}

export interface TabsHeaderProps {
  activeTab: TabType;
  onTabPress: (tab: TabType) => void;
  incomingCount: number;
  outgoingCount: number;
}

export interface StatsHeaderProps {
  incomingCount: number;
  outgoingCount: number;
}

/**
 * Format time ago from date string
 */
export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export type { FriendRequest };

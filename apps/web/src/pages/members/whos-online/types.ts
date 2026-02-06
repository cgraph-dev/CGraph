/**
 * Who's Online Types
 */

export interface OnlineUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  avatarBorderId?: string | null;
  userGroup: string;
  userGroupColor: string | null;
  currentLocation: string;
  currentLocationUrl: string | null;
  device: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  ipHash?: string;
  lastActivity: string;
  invisible: boolean;
}

export interface OnlineStats {
  totalOnline: number;
  members: number;
  guests: number;
  bots: number;
  invisible: number;
  recordOnline: number;
  recordDate: string;
}

export interface ActivityBreakdown {
  location: string;
  count: number;
  percentage: number;
}

export interface StatsCardsProps {
  stats: OnlineStats | null;
  formatDate: (dateString: string) => string;
}

export interface OnlineUserListProps {
  users: OnlineUser[];
  isLoading: boolean;
  showGuests: boolean;
  guestCount: number;
  botsCount: number;
  formatRelativeTime: (dateString: string) => string;
}

export interface ActivityBreakdownViewProps {
  activityBreakdown: ActivityBreakdown[];
  isLoading: boolean;
}

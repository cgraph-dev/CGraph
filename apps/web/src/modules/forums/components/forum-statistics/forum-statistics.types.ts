export interface ForumStats {
  // Totals
  totalThreads: number;
  totalPosts: number;
  totalMembers: number;

  // Newest
  newestMember: {
    id: string;
    username: string;
    displayName: string | null;
  } | null;

  // Activity
  postsToday: number;
  threadsToday: number;
  newMembersToday: number;

  // Online
  usersOnline: number;
  guestsOnline: number;
  membersOnline: {
    id: string;
    username: string;
    displayName: string | null;
  }[];
  mostUsersOnline: number;
  mostUsersOnlineDate: string | null;

  // Active
  activeUsers24h: number;
}

export interface ForumStatisticsProps {
  forumId?: string; // If provided, show stats for specific forum
  showOnlineList?: boolean;
  showRecordStats?: boolean;
  compact?: boolean;
  className?: string;
}

export interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  subValue?: string;
  iconColor?: string;
}

export interface StatBadgeProps {
  icon: React.ReactNode;
  label: string;
  value: number;
}

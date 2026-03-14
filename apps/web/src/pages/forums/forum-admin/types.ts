/**
 * Forum Admin Types
 *
 * Type definitions for the Forum Admin dashboard.
 *
 * @module pages/forums/ForumAdmin/types
 */

export type AdminTab =
  | 'general'
  | 'appearance'
  | 'moderators'
  | 'categories'
  | 'members'
  | 'posts'
  | 'rules'
  | 'analytics'
  | 'modqueue';

export interface TabConfig {
  id: AdminTab;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
}

export interface MemberRole {
  id: string;
  name: string;
  color: string;
  permissions: string[];
}

export interface ForumAppearance {
  iconUrl: string;
  bannerUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  themePreset: string;
  customCss: string;
  headerStyle: 'default' | 'banner' | 'minimal' | 'gradient';
  cardStyle: 'default' | 'compact' | 'cozy' | 'magazine';
}

export interface ForumRule {
  id: string;
  title: string;
  description: string;
  order: number;
}

export interface PostFlair {
  id: string;
  name: string;
  color: string;
  emoji?: string;
  modOnly?: boolean;
}

export interface MemberData {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  role: string;
  joinedAt: string;
  postCount: number;
  pulse: number;
}

export interface ModQueueItem {
  id: string;
  type: 'post' | 'comment' | 'report';
  content: string;
  author: string;
  authorId: string;
  reason?: string;
  reportedBy?: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ForumAnalytics {
  totalMembers: number;
  activeMembers: number;
  totalPosts: number;
  totalComments: number;
  postsToday: number;
  postsThisWeek: number;
  topPosters: { username: string; count: number }[];
  growthRate: number;
}

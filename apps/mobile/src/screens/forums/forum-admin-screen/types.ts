import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ForumsStackParamList, UserBasic } from '../../../types';

export type Props = {
  navigation: NativeStackNavigationProp<ForumsStackParamList, 'ForumAdmin'>;
  route: RouteProp<ForumsStackParamList, 'ForumAdmin'>;
};

export interface ModerationItem {
  id: string;
  type: 'post' | 'comment';
  content: string;
  author: UserBasic;
  reported_by: UserBasic;
  reason: string;
  created_at: string;
}

export interface BannedUser {
  id: string;
  user: UserBasic;
  reason: string;
  banned_at: string;
  banned_by: UserBasic;
  expires_at?: string;
}

export interface Moderator {
  id: string;
  user: UserBasic;
  permissions: string[];
  added_at: string;
}

export interface ForumStats {
  total_posts: number;
  total_comments: number;
  total_members: number;
  pending_reports: number;
  posts_today: number;
  active_users_24h: number;
}

export type AdminTab = 'overview' | 'modqueue' | 'banned' | 'moderators' | 'modlog' | 'identity';

export interface ModerationLogEntry {
  id: string;
  action: string;
  target_type: string;
  target_id: string;
  moderator: UserBasic;
  reason?: string;
  details?: Record<string, unknown>;
  created_at: string;
}

export interface IdentityCardEntry {
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  frame?: { id: string; name: string; color: string };
  badges?: { id: string; name: string; color: string }[];
  title?: string;
  reputation?: number;
}

export type { UserBasic };

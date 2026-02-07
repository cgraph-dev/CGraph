/**
 * Type definitions for Search page
 * @module pages/search/search/types
 */

import type { SearchCategory } from '@/modules/search/store';

/**
 * Category definition for search tabs
 */
export interface CategoryDefinition {
  id: SearchCategory;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

/**
 * Props for ResultSection component
 */
export interface ResultSectionProps {
  title: string;
  count: number;
  children: React.ReactNode;
  onViewAll?: () => void;
  showViewAll?: boolean;
}

/**
 * Props for UserResult component
 */
export interface UserResultProps {
  user: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    status: string;
    avatarBorderId?: string | null;
    avatar_border_id?: string | null;
  };
  onClick: () => void;
}

/**
 * Props for GroupResult component
 */
export interface GroupResultProps {
  group: {
    id: string;
    name: string;
    description: string | null;
    iconUrl: string | null;
    memberCount: number;
  };
  onClick: () => void;
}

/**
 * Props for ForumResult component
 */
export interface ForumResultProps {
  forum: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    iconUrl: string | null;
    postCount: number;
  };
  onClick: () => void;
}

/**
 * Props for PostResult component
 */
export interface PostResultProps {
  post: {
    id: string;
    title: string;
    content: string;
    author: { username: string | null };
    forumSlug: string;
  };
  onClick: () => void;
}

/**
 * Props for MessageResult component
 */
export interface MessageResultProps {
  message: {
    id: string;
    content: string;
    sender: { username: string | null };
    conversationId: string;
  };
  onClick: () => void;
}

/**
 * ID search type options
 */
export type IdSearchType = 'user' | 'group' | 'forum';

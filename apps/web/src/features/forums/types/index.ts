/**
 * Forum Types
 * 
 * TypeScript types and interfaces for forum feature.
 */

// Re-export from shared types package
export type {
  ForumCategory,
  ForumBoard,
  ForumThread,
  ForumPost,
  ForumPoll,
  ForumPollOption,
  ThreadPrefix,
} from '@cgraph/shared-types';

// Feature-specific types
export interface ThreadWithMetadata {
  id: string;
  boardId: string;
  title: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  prefix?: ThreadPrefixLocal;
  isPinned: boolean;
  isLocked: boolean;
  isAnnouncement: boolean;
  viewCount: number;
  replyCount: number;
  lastPostAt: Date;
  lastPostBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ThreadPrefixLocal {
  id: string;
  name: string;
  color: string;
  textColor: string;
}

export interface PostWithMetadata {
  id: string;
  threadId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorSignature?: string;
  authorPostCount: number;
  authorJoinDate: Date;
  content: string;
  contentHtml: string;
  rating: number;
  ratingCount: number;
  editHistory: EditHistoryEntry[];
  isFirstPost: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface EditHistoryEntry {
  editedAt: Date;
  editedBy: string;
  reason?: string;
  previousContent: string;
}

export interface PollState {
  id: string;
  question: string;
  options: PollOptionLocal[];
  isMultipleChoice: boolean;
  isPublicVotes: boolean;
  endsAt?: Date;
  hasVoted: boolean;
  userVotes: string[];
}

export interface PollOptionLocal {
  id: string;
  text: string;
  voteCount: number;
  percentage: number;
  voters?: string[];
}

export interface ForumSubscription {
  id: string;
  userId: string;
  threadId?: string;
  boardId?: string;
  notifyEmail: boolean;
  notifyPush: boolean;
  createdAt: Date;
}

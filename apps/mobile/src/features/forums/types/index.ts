/**
 * Forum Types (Mobile)
 */

export type {
  ForumCategory,
  ForumBoard,
  ForumThread,
  ForumPost,
  ForumPoll,
  ThreadPrefix,
} from '@cgraph/shared-types';

export interface ThreadWithMetadata {
  id: string;
  boardId: string;
  title: string;
  authorId: string;
  authorName: string;
  prefix?: { id: string; name: string; color: string };
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  replyCount: number;
  lastPostAt: Date;
  createdAt: Date;
}

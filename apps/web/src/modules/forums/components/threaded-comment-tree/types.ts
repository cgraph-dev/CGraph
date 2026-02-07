/**
 * ThreadedCommentTree Types
 *
 * Type definitions for the threaded comment tree components.
 */

import type { Comment } from '@/modules/forums/store';

export interface ThreadedCommentTreeProps {
  /** All comments (flat array - will be converted to tree) */
  comments: Comment[];
  /** Currently authenticated user ID */
  currentUserId?: string;
  /** Callback when voting on a comment */
  onVote: (commentId: string, value: 1 | -1 | null, currentVote: 1 | -1 | null) => Promise<void>;
  /** Callback when replying to a comment */
  onReply: (parentId: string) => void;
  /** Callback to mark as best answer (if allowed) */
  onMarkBestAnswer?: (commentId: string) => void;
  /** Whether current user can mark best answers */
  canMarkBestAnswer?: boolean;
  /** Maximum nesting depth before flattening */
  maxDepth?: number;
  /** Default collapsed state for deeply nested comments */
  collapseAfterDepth?: number;
  /** Primary theme color */
  primaryColor?: string;
}

export interface CommentTreeNode extends Comment {
  children: CommentTreeNode[];
}

export interface ThreadedCommentProps {
  comment: CommentTreeNode;
  depth: number;
  maxDepth: number;
  collapseAfterDepth: number;
  currentUserId?: string;
  onVote: (commentId: string, value: 1 | -1 | null, currentVote: 1 | -1 | null) => Promise<void>;
  onReply: (parentId: string) => void;
  onMarkBestAnswer?: (commentId: string) => void;
  canMarkBestAnswer?: boolean;
  primaryColor: string;
  isLast: boolean;
}

// Re-export Comment type for convenience
export type { Comment } from '@/modules/forums/store';

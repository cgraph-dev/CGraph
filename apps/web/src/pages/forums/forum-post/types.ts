/**
 * Types for the ForumPost module
 */

import type { Comment } from '@/modules/forums/store';

/**
 * Props for the CommentItem component
 */
export interface CommentItemProps {
  comment: Comment;
  onVote: (id: string, value: 1 | -1, currentVote: 1 | -1 | null) => void;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  replyContent: string;
  setReplyContent: (content: string) => void;
  onSubmitReply: (parentId: string) => void;
  isSubmitting: boolean;
  depth?: number;
}

/**
 * Report reason options
 */
export type ReportReason =
  | ''
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'violence'
  | 'inappropriate'
  | 'misinformation'
  | 'copyright'
  | 'other';

/**
 * Report modal props
 */
export interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportReason: string;
  setReportReason: (reason: string) => void;
  onSubmit: () => Promise<void>;
  isReporting: boolean;
}

/**
 * Vote handler type
 */
export type VoteHandler = (
  type: 'post' | 'comment',
  id: string,
  value: 1 | -1,
  currentVote: 1 | -1 | null
) => Promise<void>;

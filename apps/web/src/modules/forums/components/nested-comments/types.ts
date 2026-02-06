/**
 * Types for Nested Comments Module
 */

/**
 * Comment author information
 */
export interface CommentAuthor {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  avatarBorderId?: string | null;
  avatar_border_id?: string | null;
  karma: number;
  isVerified: boolean;
  badges?: string[];
}

/**
 * Comment award information
 */
export interface CommentAward {
  type: string;
  count: number;
}

/**
 * Comment data structure
 */
export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: CommentAuthor;
  content: string;
  score: number;
  userVote: 1 | -1 | null;
  isBestAnswer: boolean;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  parentId: string | null;
  replies: Comment[];
  depth: number;
  awards?: CommentAward[];
}

/**
 * Sort options for comments
 */
export type CommentSortOption = 'best' | 'new' | 'old' | 'controversial';

/**
 * Props for NestedComments component
 */
export interface NestedCommentsProps {
  postId: string;
  comments: Comment[];
  isAuthorOfPost: boolean;
  canMarkBestAnswer: boolean;
  sortBy?: CommentSortOption;
  onVote: (commentId: string, value: 1 | -1 | null) => Promise<void>;
  onReply: (parentId: string | null, content: string) => Promise<void>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onMarkBestAnswer: (commentId: string) => Promise<void>;
  maxDepth?: number;
}

/**
 * Props for CommentCard component
 */
export interface CommentCardProps {
  comment: Comment;
  depth: number;
  maxDepth: number;
  isAuthorOfPost: boolean;
  canMarkBestAnswer: boolean;
  isCollapsed: boolean;
  isReplying: boolean;
  isEditing: boolean;
  replyContent: string;
  editContent: string;
  onToggleCollapse: (commentId: string) => void;
  onSetReplyingTo: (commentId: string | null) => void;
  onSetEditingComment: (commentId: string | null) => void;
  onSetReplyContent: (content: string) => void;
  onSetEditContent: (content: string) => void;
  onReply: (parentId: string | null) => Promise<void>;
  onEdit: (commentId: string) => Promise<void>;
  onVote: (commentId: string, value: 1 | -1 | null) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onMarkBestAnswer: (commentId: string) => Promise<void>;
  sortedComments: (comments: Comment[]) => Comment[];
  renderComment: (comment: Comment, depth: number) => React.ReactElement;
}

/**
 * Props for CommentVoteButtons component
 */
export interface CommentVoteButtonsProps {
  comment: Comment;
  onVote: (commentId: string, value: 1 | -1 | null) => void;
}

/**
 * Props for CommentActions component
 */
export interface CommentActionsProps {
  comment: Comment;
  canEdit: boolean;
  canDelete: boolean;
  canMarkBestAnswer: boolean;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  onMarkBestAnswer: (commentId: string) => void;
}

/**
 * Props for ReplyForm component
 */
export interface ReplyFormProps {
  authorUsername: string;
  content: string;
  onContentChange: (content: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

/**
 * Props for EditForm component
 */
export interface EditFormProps {
  content: string;
  onContentChange: (content: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

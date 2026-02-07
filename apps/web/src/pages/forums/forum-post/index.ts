/**
 * ForumPost Module
 *
 * Complete forum post view with voting, content display, comments,
 * moderation tools, and reporting.
 *
 * @module pages/forums/forum-post
 *
 * @example
 * ```tsx
 * import ForumPost from '@/pages/forums/forum-post';
 * ```
 */

// ── Main Component ─────────────────────────────────────────────────────
export { default } from './page';
export { default as ForumPost } from './page';

// ── Sub-components ─────────────────────────────────────────────────────
export { PostVoteSidebar } from './PostVoteSidebar';
export { PostContent } from './PostContent';
export { PostActionBar } from './PostActionBar';
export { CommentInput } from './CommentInput';
export { CommentList } from './CommentList';
export { CommentItem } from './comment-item';
export { ReportModal } from './report-modal';
export { PostSkeleton, BackButton } from './loading';

// ── Hooks ──────────────────────────────────────────────────────────────
export { useForumPostActions } from './useForumPostActions';

// ── Types ──────────────────────────────────────────────────────────────
export type { PostVoteSidebarProps } from './PostVoteSidebar';
export type { PostContentProps } from './PostContent';
export type { PostActionBarProps } from './PostActionBar';
export type { CommentInputProps } from './CommentInput';
export type { CommentListProps } from './CommentList';
export type { ForumPostActions } from './useForumPostActions';
export * from './types';
export * from './constants';

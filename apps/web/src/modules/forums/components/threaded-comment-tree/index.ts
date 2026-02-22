/**
 * ThreadedCommentTree Module
 *
 * Barrel exports for the modular threaded comment tree.
 */

// Main component
export { default, ThreadedCommentTree } from './threaded-comment-tree';

// Sub-components
export { ThreadedComment } from './threaded-comment';
export { CommentHeader } from './comment-header';
export { CommentActions } from './comment-actions';
export { ThreadLine } from './thread-line';

// Utils
export { buildCommentTree, countDescendants } from './utils';

// Types
export type {
  ThreadedCommentTreeProps,
  CommentTreeNode,
  ThreadedCommentProps,
  Comment,
} from './types';

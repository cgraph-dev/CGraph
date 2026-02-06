/**
 * ThreadedCommentTree Module
 *
 * Barrel exports for the modular threaded comment tree.
 */

// Main component
export { default, ThreadedCommentTree } from './ThreadedCommentTree';

// Sub-components
export { ThreadedComment } from './ThreadedComment';
export { CommentHeader } from './CommentHeader';
export { CommentActions } from './CommentActions';
export { ThreadLine } from './ThreadLine';

// Utils
export { buildCommentTree, countDescendants } from './utils';

// Types
export type {
  ThreadedCommentTreeProps,
  CommentTreeNode,
  ThreadedCommentProps,
  Comment,
} from './types';

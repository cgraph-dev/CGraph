/**
 * Comment Tree Utils
 *
 * Helper functions for building and traversing comment trees.
 */

import type { Comment } from '@/stores/forumStore';
import type { CommentTreeNode } from './types';

/**
 * Converts a flat array of comments to a nested tree structure
 */
export function buildCommentTree(comments: Comment[]): CommentTreeNode[] {
  const commentMap = new Map<string, CommentTreeNode>();
  const roots: CommentTreeNode[] = [];

  // First pass: Create all nodes with empty children arrays
  comments.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, children: [] });
  });

  // Second pass: Build parent-child relationships
  comments.forEach((comment) => {
    const node = commentMap.get(comment.id)!;
    if (comment.parentId && commentMap.has(comment.parentId)) {
      const parent = commentMap.get(comment.parentId)!;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Sort children by score (best first) then by date
  const sortChildren = (nodes: CommentTreeNode[]): void => {
    nodes.sort((a, b) => {
      // Best answers first
      if (a.isBestAnswer && !b.isBestAnswer) return -1;
      if (!a.isBestAnswer && b.isBestAnswer) return 1;
      // Then by score
      if (b.score !== a.score) return b.score - a.score;
      // Then by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    nodes.forEach((node) => sortChildren(node.children));
  };

  sortChildren(roots);
  return roots;
}

/**
 * Count total descendants of a comment
 */
export function countDescendants(node: CommentTreeNode): number {
  return node.children.reduce((sum, child) => sum + 1 + countDescendants(child), 0);
}

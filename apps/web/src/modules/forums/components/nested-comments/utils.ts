/**
 * Utility functions for Nested Comments
 */

import type { Comment, CommentSortOption } from './types';

/**
 * Sort comments based on the selected criteria
 */
export function sortComments(comments: Comment[], sortBy: CommentSortOption): Comment[] {
  const sorted = [...comments];

  switch (sortBy) {
    case 'best':
      // Best answers first, then by score and recency
      return sorted.sort((a, b) => {
        if (a.isBestAnswer && !b.isBestAnswer) return -1;
        if (!a.isBestAnswer && b.isBestAnswer) return 1;
        if (a.score !== b.score) return b.score - a.score;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    case 'new':
      return sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case 'old':
      return sorted.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    case 'controversial':
      // Comments with many votes but low scores are controversial
      return sorted.sort((a, b) => {
        const aControversy = Math.abs(a.score) / (Math.abs(a.score) + 1);
        const bControversy = Math.abs(b.score) / (Math.abs(b.score) + 1);
        return bControversy - aControversy;
      });
    default:
      return sorted;
  }
}

/**
 * Get top-level comments (comments without a parent)
 */
export function getTopLevelComments(comments: Comment[]): Comment[] {
  return comments.filter((c) => !c.parentId);
}

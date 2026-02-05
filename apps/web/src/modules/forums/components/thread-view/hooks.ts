/**
 * ThreadView Hooks
 * @module modules/forums/components/thread-view/hooks
 */

import { useState, useRef, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import type { Comment } from '@/stores/forumStore';
import type { CommentViewMode } from './types';

/**
 * Hook for managing view mode state with localStorage persistence
 */
export function useViewMode(defaultViewMode: CommentViewMode) {
  const [viewMode, setViewMode] = useState<CommentViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cgraph_thread_view_mode');
      if (saved === 'linear' || saved === 'threaded') {
        return saved;
      }
    }
    return defaultViewMode;
  });

  const handleViewModeChange = useCallback((mode: CommentViewMode) => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cgraph_thread_view_mode', mode);
    }
  }, []);

  return { viewMode, handleViewModeChange };
}

/**
 * Hook for sorting comments with best answers first
 */
export function useSortedComments(comments: Comment[]) {
  return useMemo(() => {
    return [...comments].sort((a, b) => {
      if (a.isBestAnswer && !b.isBestAnswer) return -1;
      if (!a.isBestAnswer && b.isBestAnswer) return 1;
      return b.score - a.score;
    });
  }, [comments]);
}

/**
 * Hook for virtual list scrolling
 */
export function useCommentVirtualizer(comments: Comment[]) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: comments.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
  });

  return { parentRef, rowVirtualizer };
}

/**
 * Hook for handling reply functionality
 */
export function useReplyHandler() {
  const [replyToId, setReplyToId] = useState<string | undefined>(undefined);
  const [showCommentForm, setShowCommentForm] = useState(false);

  const handleReplyTo = useCallback((parentId: string) => {
    setReplyToId(parentId);
    setShowCommentForm(true);
    // Scroll to comment form
    setTimeout(() => {
      document.getElementById('comment-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  const clearReply = useCallback(() => {
    setReplyToId(undefined);
  }, []);

  return {
    replyToId,
    showCommentForm,
    setShowCommentForm,
    handleReplyTo,
    clearReply,
    setReplyToId,
  };
}

/**
 * Hook for handling voting with haptic feedback
 */
export function useVoteHandlers(
  onVote: (type: 'post' | 'comment', id: string, value: 1 | -1 | null) => Promise<void>,
  postId: string,
  postMyVote: 1 | -1 | null | undefined
) {
  const handlePostVote = useCallback(
    async (value: 1 | -1) => {
      HapticFeedback.light();
      const newValue = postMyVote === value ? null : value;
      await onVote('post', postId, newValue);
    },
    [onVote, postId, postMyVote]
  );

  const handleCommentVote = useCallback(
    async (commentId: string, value: 1 | -1, currentVote: 1 | -1 | null) => {
      HapticFeedback.light();
      const newValue = currentVote === value ? null : value;
      await onVote('comment', commentId, newValue);
    },
    [onVote]
  );

  const handleThreadedVote = useCallback(
    async (commentId: string, value: 1 | -1 | null, _currentVote: 1 | -1 | null) => {
      await onVote('comment', commentId, value);
    },
    [onVote]
  );

  return { handlePostVote, handleCommentVote, handleThreadedVote };
}

/**
 * Hook for handling comment submission
 */
export function useCommentSubmit(
  onComment: (content: string, parentId?: string) => Promise<void>,
  replyToId: string | undefined,
  clearReply: () => void
) {
  const [commentContent, setCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);

  const handleSubmitComment = useCallback(async () => {
    if (!commentContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    HapticFeedback.success();
    try {
      await onComment(commentContent.trim(), replyToId);
      setCommentContent('');
      setShowCommentForm(false);
      clearReply();
    } finally {
      setIsSubmitting(false);
    }
  }, [commentContent, isSubmitting, onComment, replyToId, clearReply]);

  return {
    commentContent,
    setCommentContent,
    isSubmitting,
    showCommentForm,
    setShowCommentForm,
    handleSubmitComment,
  };
}

/**
 * Hook for rating functionality
 */
export function useRating(onRate?: (rating: number) => Promise<void>) {
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleRate = useCallback(
    async (rating: number) => {
      if (!onRate) return;
      HapticFeedback.medium();
      await onRate(rating);
    },
    [onRate]
  );

  return { hoveredRating, setHoveredRating, handleRate };
}

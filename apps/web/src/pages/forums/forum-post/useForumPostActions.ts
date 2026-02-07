/**
 * Forum Post Actions Hook
 *
 * Encapsulates all event handlers for the ForumPost page:
 * voting, commenting, replying, reporting, moderation, and subscriptions.
 *
 * @module pages/forums/forum-post/useForumPostActions
 */

import { useState } from 'react';
import { createLogger } from '@/lib/logger';
import { useForumStore } from '@/modules/forums/store';
import { toast } from '@/shared/components/ui';

const logger = createLogger('ForumPost');

/** Return type of the forum post actions hook */
export interface ForumPostActions {
  /** Current comment text */
  commentContent: string;
  /** Set comment text */
  setCommentContent: (v: string) => void;
  /** Whether a submission is in progress */
  isSubmitting: boolean;
  /** ID of the comment being replied to */
  replyingTo: string | null;
  /** Set reply target */
  setReplyingTo: (id: string | null) => void;
  /** Current reply text */
  replyContent: string;
  /** Set reply text */
  setReplyContent: (v: string) => void;
  /** Whether the report modal is open */
  showReportModal: boolean;
  /** Toggle report modal */
  setShowReportModal: (v: boolean) => void;
  /** Current report reason */
  reportReason: string;
  /** Set report reason */
  setReportReason: (v: string) => void;
  /** Whether a report is being submitted */
  isReporting: boolean;
  /** Whether the user is subscribed to the thread */
  isSubscribed: boolean;
  /** Whether the edit history modal is open */
  showEditHistory: boolean;
  /** Toggle edit history modal */
  setShowEditHistory: (v: boolean) => void;
  /** Handle voting on a post or comment */
  handleVote: (
    type: 'post' | 'comment',
    id: string,
    value: 1 | -1,
    currentVote: 1 | -1 | null
  ) => Promise<void>;
  /** Submit a new top-level comment */
  handleSubmitComment: () => Promise<void>;
  /** Submit a reply to a comment */
  handleSubmitReply: (parentId: string) => Promise<void>;
  /** Submit a report */
  handleReport: () => Promise<void>;
  /** Toggle thread subscription */
  handleToggleSubscription: () => void;
}

/**
 * Hook providing all ForumPost page actions and local state.
 *
 * @param postId - The current post ID from route params
 */
export function useForumPostActions(postId: string | undefined): ForumPostActions {
  const { currentPost, vote, createComment, reportItem } = useForumStore();

  const [commentContent, setCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showEditHistory, setShowEditHistory] = useState(false);

  const handleVote = async (
    type: 'post' | 'comment',
    id: string,
    value: 1 | -1,
    currentVote: 1 | -1 | null
  ) => {
    const newValue = currentVote === value ? null : value;
    await vote(type, id, newValue);
  };

  const handleSubmitComment = async () => {
    if (!postId || !commentContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await createComment(postId, commentContent.trim());
      setCommentContent('');
    } catch (error) {
      logger.error('Failed to submit comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!postId || !replyContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await createComment(postId, replyContent.trim(), parentId);
      setReplyContent('');
      setReplyingTo(null);
    } catch (error) {
      logger.error('Failed to submit reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason || !currentPost) return;
    setIsReporting(true);
    try {
      await reportItem({
        reportType: 'post',
        itemId: currentPost.id,
        reason: reportReason,
      });
      toast.success('Report submitted', 'Our moderation team will review this post.');
      setShowReportModal(false);
      setReportReason('');
    } catch (err) {
      logger.error('Failed to submit report:', err);
      toast.error('Failed to submit report', 'Please try again later.');
    } finally {
      setIsReporting(false);
    }
  };

  const handleToggleSubscription = () => {
    setIsSubscribed((prev) => {
      toast.success(!prev ? 'Subscribed to thread' : 'Unsubscribed from thread');
      return !prev;
    });
  };

  return {
    commentContent,
    setCommentContent,
    isSubmitting,
    replyingTo,
    setReplyingTo,
    replyContent,
    setReplyContent,
    showReportModal,
    setShowReportModal,
    reportReason,
    setReportReason,
    isReporting,
    isSubscribed,
    showEditHistory,
    setShowEditHistory,
    handleVote,
    handleSubmitComment,
    handleSubmitReply,
    handleReport,
    handleToggleSubscription,
  };
}

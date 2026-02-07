/**
 * Create Post hooks - Form state management and submission logic
 * @module pages/forums/create-post
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createLogger } from '@/lib/logger';
import { useForumStore, type PostAttachment } from '@/modules/forums/store';
import { useAuthStore } from '@/modules/auth/store';
import { toast } from '@/shared/components/ui';
import type { PostType } from './types';

const logger = createLogger('CreatePost');

export function useCreatePost() {
  const { forumSlug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { forums, fetchForum, createPost, subscribe, threadPrefixes, fetchThreadPrefixes } =
    useForumStore();

  const [postType, setPostType] = useState<PostType>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MyBB Features
  const [selectedPrefix, setSelectedPrefix] = useState<string>('');
  const [attachments, setAttachments] = useState<PostAttachment[]>([]);
  // Poll feature - currently disabled pending backend support
  const [_showPollOptions, _setShowPollOptions] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollAllowMultiple, setPollAllowMultiple] = useState(false);
  const [pollPublic, setPollPublic] = useState(false);

  const forum = forums.find((f) => f.slug === forumSlug);

  useEffect(() => {
    if (forumSlug) {
      fetchForum(forumSlug);
    }
  }, [forumSlug, fetchForum]);

  // Fetch thread prefixes for the forum
  useEffect(() => {
    if (forum) {
      fetchThreadPrefixes(forum.id);
    }
  }, [forum, fetchThreadPrefixes]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/forums/${forumSlug}/create-post` } });
    }
  }, [isAuthenticated, navigate, forumSlug]);

  // Check if user can post (must be a member for private forums)
  const canPost = forum?.isPublic || forum?.isMember || forum?.ownerId === user?.id;

  const handleJoinForum = async () => {
    if (!forum) return;
    setIsJoining(true);
    try {
      await subscribe(forum.id);
      toast.success(`Joined c/${forum.name} successfully!`);
    } catch (err) {
      toast.error('Failed to join forum');
      logger.error('Failed to join forum:', err);
    } finally {
      setIsJoining(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forum || !title.trim()) return;

    if (!canPost) {
      setError('You must join this forum to create posts');
      return;
    }

    // Validate poll if it's a poll post
    if (postType === 'poll') {
      if (!pollQuestion.trim()) {
        setError('Poll question is required');
        return;
      }
      const validOptions = pollOptions.filter((opt) => opt.trim() !== '');
      if (validOptions.length < 2) {
        setError('Poll requires at least 2 options');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const postData: Parameters<typeof createPost>[0] = {
        forumId: forum.id,
        title: title.trim(),
        content: postType === 'text' ? content.trim() : undefined,
        linkUrl: postType === 'link' ? url.trim() : undefined,
        postType,
      };

      // Add prefix if selected
      if (selectedPrefix) {
        postData.prefixId = selectedPrefix;
      }

      // Add attachment IDs if any
      if (attachments.length > 0) {
        postData.attachmentIds = attachments.map((a) => a.id);
      }

      // Add poll data if this is a poll post
      if (postType === 'poll' && pollQuestion.trim()) {
        postData.poll = {
          question: pollQuestion.trim(),
          options: pollOptions.filter((opt) => opt.trim() !== ''),
          allowMultiple: pollAllowMultiple,
          isPublic: pollPublic,
        };
      }

      await createPost(postData);

      navigate(`/forums/${forumSlug}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create post';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    forumSlug,
    forum,
    canPost,
    postType,
    setPostType,
    title,
    setTitle,
    content,
    setContent,
    url,
    setUrl,
    isSubmitting,
    isJoining,
    error,
    setError,
    selectedPrefix,
    setSelectedPrefix,
    attachments,
    setAttachments,
    _showPollOptions,
    _setShowPollOptions,
    pollQuestion,
    setPollQuestion,
    pollOptions,
    setPollOptions,
    pollAllowMultiple,
    setPollAllowMultiple,
    pollPublic,
    setPollPublic,
    threadPrefixes,
    handleJoinForum,
    handleSubmit,
  };
}

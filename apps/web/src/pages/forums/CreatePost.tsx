import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { createLogger } from '@/lib/logger';

const logger = createLogger('CreatePost');
import { useForumStore, type PostAttachment } from '@/stores/forumStore';
import { useAuthStore } from '@/stores/authStore';
import { MarkdownEditor } from '@/components';
import { toast } from '@/shared/components/ui';
import AttachmentUploader from '@/components/forums/AttachmentUploader';
import {
  ArrowLeftIcon,
  PhotoIcon,
  LinkIcon,
  XMarkIcon,
  TagIcon,
  ChartBarIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline';

type PostType = 'text' | 'image' | 'link' | 'video' | 'poll';

export default function CreatePost() {
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

  if (!forum) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-dark-900">
      <div className="animate-fadeIn mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Link
            to={`/forums/${forumSlug}`}
            className="rounded-lg p-2 transition-colors hover:bg-dark-700"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Create a Post</h1>
            <p className="text-sm text-gray-400">
              in{' '}
              <Link to={`/forums/${forumSlug}`} className="text-primary-400 hover:text-primary-300">
                c/{forum.name}
              </Link>
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 flex items-center justify-between rounded-lg border border-red-500 bg-red-500/20 p-4">
            <span className="text-red-400">{error}</span>
            <button onClick={() => setError(null)}>
              <XMarkIcon className="h-5 w-5 text-red-400" />
            </button>
          </div>
        )}

        {/* Not a member warning */}
        {!canPost && (
          <div className="mb-6 rounded-lg border border-yellow-500 bg-yellow-500/20 p-4">
            <p className="text-yellow-400">
              You must join this forum to create posts.{' '}
              <button
                onClick={handleJoinForum}
                disabled={isJoining}
                className="underline hover:text-yellow-300 disabled:opacity-50"
              >
                {isJoining ? 'Joining...' : 'Join now'}
              </button>
            </p>
          </div>
        )}

        {/* Post Type Tabs */}
        <div className="mb-6 flex gap-2 border-b border-dark-700 pb-4">
          <button
            onClick={() => setPostType('text')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
              postType === 'text'
                ? 'bg-primary-600 text-white'
                : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
            }`}
          >
            Text
          </button>
          <button
            onClick={() => setPostType('image')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
              postType === 'image'
                ? 'bg-primary-600 text-white'
                : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
            }`}
          >
            <PhotoIcon className="h-5 w-5" />
            Image
          </button>
          <button
            onClick={() => setPostType('link')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
              postType === 'link'
                ? 'bg-primary-600 text-white'
                : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
            }`}
          >
            <LinkIcon className="h-5 w-5" />
            Link
          </button>
          <button
            onClick={() => setPostType('poll')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
              postType === 'poll'
                ? 'bg-primary-600 text-white'
                : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
            }`}
          >
            <ChartBarIcon className="h-5 w-5" />
            Poll
          </button>
        </div>

        {/* Post Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={300}
              className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
            <div className="mt-1 text-right text-xs text-gray-500">{title.length}/300</div>
          </div>

          {/* Thread Prefix Selector */}
          {threadPrefixes.length > 0 && (
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                <TagIcon className="h-4 w-4" />
                Thread Prefix (Optional)
              </label>
              <select
                value={selectedPrefix}
                onChange={(e) => setSelectedPrefix(e.target.value)}
                className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">No Prefix</option>
                {threadPrefixes.map((prefix) => (
                  <option key={prefix.id} value={prefix.id}>
                    {prefix.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Content based on type */}
          {postType === 'text' && (
            <div>
              <MarkdownEditor
                value={content}
                onChange={setContent}
                placeholder="Write your post content... (Markdown supported)"
                minRows={8}
              />
            </div>
          )}

          {postType === 'image' && (
            <div className="rounded-lg border-2 border-dashed border-dark-600 p-8 text-center">
              <PhotoIcon className="mx-auto mb-4 h-12 w-12 text-gray-500" />
              <p className="mb-2 text-gray-400">Drag and drop images or</p>
              <button
                type="button"
                className="rounded-lg bg-dark-600 px-4 py-2 text-white transition-colors hover:bg-dark-500"
              >
                Upload
              </button>
              <p className="mt-2 text-xs text-gray-500">
                Max file size: 10MB. Supported formats: JPG, PNG, GIF
              </p>
            </div>
          )}

          {postType === 'link' && (
            <div>
              <input
                type="url"
                placeholder="URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                required={postType === 'link'}
              />
            </div>
          )}

          {postType === 'poll' && (
            <div className="space-y-4">
              {/* Poll Question */}
              <div>
                <input
                  type="text"
                  placeholder="Poll Question"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              {/* Poll Options */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Poll Options</label>
                {pollOptions.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...pollOptions];
                        newOptions[index] = e.target.value;
                        setPollOptions(newOptions);
                      }}
                      className="flex-1 rounded-lg border border-dark-600 bg-dark-700 px-4 py-2 text-white placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== index))}
                        className="rounded-lg border border-red-500 bg-red-500/20 px-3 py-2 text-red-400 transition-colors hover:bg-red-500/30"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setPollOptions([...pollOptions, ''])}
                  className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-2 text-gray-300 transition-colors hover:bg-dark-600"
                >
                  + Add Option
                </button>
              </div>

              {/* Poll Settings */}
              <div className="space-y-3 rounded-lg border border-dark-700 bg-dark-800/50 p-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={pollAllowMultiple}
                    onChange={(e) => setPollAllowMultiple(e.target.checked)}
                    className="h-4 w-4 rounded border-dark-600 bg-dark-700 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-300">Allow multiple selections</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={pollPublic}
                    onChange={(e) => setPollPublic(e.target.checked)}
                    className="h-4 w-4 rounded border-dark-600 bg-dark-700 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-300">Public poll (show who voted)</span>
                </label>
              </div>
            </div>
          )}

          {/* Attachments for text/link/poll posts */}
          {(postType === 'text' || postType === 'link' || postType === 'poll') && (
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                <PaperClipIcon className="h-4 w-4" />
                Attachments (Optional)
              </label>
              <AttachmentUploader
                attachments={attachments}
                onUpload={(attachment) => setAttachments([...attachments, attachment])}
                onDelete={(id) => setAttachments(attachments.filter((a) => a.id !== id))}
                maxFiles={5}
              />
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              to={`/forums/${forumSlug}`}
              className="rounded-lg bg-dark-700 px-6 py-2.5 font-medium text-white transition-colors hover:bg-dark-600"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !canPost}
              className="rounded-lg bg-primary-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-600/50"
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

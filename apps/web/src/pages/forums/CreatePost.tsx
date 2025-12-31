import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForumStore } from '@/stores/forumStore';
import { useAuthStore } from '@/stores/authStore';
import { MarkdownEditor } from '@/components';
import { toast } from '@/components/ui/Toast';
import {
  ArrowLeftIcon,
  PhotoIcon,
  LinkIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type PostType = 'text' | 'image' | 'link';

export default function CreatePost() {
  const { forumSlug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { forums, fetchForum, createPost, subscribe } = useForumStore();

  const [postType, setPostType] = useState<PostType>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const forum = forums.find((f) => f.slug === forumSlug);

  useEffect(() => {
    if (forumSlug) {
      fetchForum(forumSlug);
    }
  }, [forumSlug, fetchForum]);

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
      console.error('Failed to join forum:', err);
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

    setIsSubmitting(true);
    setError(null);

    try {
      await createPost({
        forumId: forum.id,
        title: title.trim(),
        content: postType === 'text' ? content.trim() : undefined,
        linkUrl: postType === 'link' ? url.trim() : undefined,
        postType,
      });

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
      <div className="flex-1 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-dark-900">
      <div className="max-w-3xl mx-auto py-8 px-4 animate-fadeIn\">\n        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to={`/forums/${forumSlug}`}
            className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Create a Post</h1>
            <p className="text-sm text-gray-400">
              in{' '}
              <Link
                to={`/forums/${forumSlug}`}
                className="text-primary-400 hover:text-primary-300"
              >
                c/{forum.name}
              </Link>
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-center justify-between">
            <span className="text-red-400">{error}</span>
            <button onClick={() => setError(null)}>
              <XMarkIcon className="h-5 w-5 text-red-400" />
            </button>
          </div>
        )}

        {/* Not a member warning */}
        {!canPost && (
          <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500 rounded-lg">
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
        <div className="flex gap-2 mb-6 border-b border-dark-700 pb-4">
          <button
            onClick={() => setPostType('text')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              postType === 'text'
                ? 'bg-primary-600 text-white'
                : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
            }`}
          >
            Text
          </button>
          <button
            onClick={() => setPostType('image')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
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
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              postType === 'link'
                ? 'bg-primary-600 text-white'
                : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
            }`}
          >
            <LinkIcon className="h-5 w-5" />
            Link
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
              className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {title.length}/300
            </div>
          </div>

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
            <div className="border-2 border-dashed border-dark-600 rounded-lg p-8 text-center">
              <PhotoIcon className="h-12 w-12 mx-auto text-gray-500 mb-4" />
              <p className="text-gray-400 mb-2">Drag and drop images or</p>
              <button
                type="button"
                className="px-4 py-2 bg-dark-600 hover:bg-dark-500 text-white rounded-lg transition-colors"
              >
                Upload
              </button>
              <p className="text-xs text-gray-500 mt-2">
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
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required={postType === 'link'}
              />
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              to={`/forums/${forumSlug}`}
              className="px-6 py-2.5 bg-dark-700 hover:bg-dark-600 text-white font-medium rounded-lg transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !canPost}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

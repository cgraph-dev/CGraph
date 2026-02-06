import { Link } from 'react-router-dom';
import { MarkdownEditor } from '@/components';
import type { PostAttachment } from '@/stores/forumStore';
import AttachmentUploader from '@/modules/forums/components/AttachmentUploader';
import {
  ArrowLeftIcon,
  PhotoIcon,
  XMarkIcon,
  TagIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline';
import { useCreatePost } from './hooks';
import PostTypeTabs from './PostTypeTabs';
import PollForm from './PollForm';

export default function CreatePost() {
  const {
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
  } = useCreatePost();

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

        <PostTypeTabs postType={postType} setPostType={setPostType} />

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
            <PollForm
              pollQuestion={pollQuestion}
              setPollQuestion={setPollQuestion}
              pollOptions={pollOptions}
              setPollOptions={setPollOptions}
              pollAllowMultiple={pollAllowMultiple}
              setPollAllowMultiple={setPollAllowMultiple}
              pollPublic={pollPublic}
              setPollPublic={setPollPublic}
            />
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
                onUpload={(attachment: PostAttachment) =>
                  setAttachments([...attachments, attachment])
                }
                onDelete={(id: string) => setAttachments(attachments.filter((a) => a.id !== id))}
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

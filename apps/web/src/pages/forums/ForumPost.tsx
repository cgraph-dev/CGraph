import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForumStore, Comment } from '@/stores/forumStore';
import { useAuthStore } from '@/stores/authStore';
import { formatTimeAgo } from '@/lib/utils';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import Dropdown, { DropdownItem, DropdownDivider } from '@/components/Dropdown';
import { toast } from '@/components/ui';
import ThreadPrefix from '@/components/forums/ThreadPrefix';
import ThreadRating from '@/components/forums/ThreadRating';
import PollWidget from '@/components/forums/PollWidget';
import EditHistoryModal from '@/components/forums/EditHistoryModal';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  BookmarkIcon,
  EllipsisHorizontalIcon,
  ArrowLeftIcon,
  MapPinIcon,
  LockClosedIcon,
  LockOpenIcon,
  TrashIcon,
  FlagIcon,
  PencilIcon,
  ClockIcon,
  BellIcon,
  BellSlashIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import {
  ArrowUpIcon as ArrowUpIconSolid,
  ArrowDownIcon as ArrowDownIconSolid,
} from '@heroicons/react/24/solid';

export default function ForumPost() {
  const { forumSlug, postId } = useParams<{ forumSlug: string; postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentPost,
    comments,
    isLoadingComments,
    fetchPost,
    fetchComments,
    fetchForum,
    vote,
    createComment,
    pinPost,
    unpinPost,
    lockPost,
    unlockPost,
    deletePost,
    currentForum,
    reportItem,
  } = useForumStore();

  const [commentContent, setCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showEditHistory, setShowEditHistory] = useState(false);

  const postComments = postId ? comments[postId] || [] : [];

  useEffect(() => {
    if (postId) {
      fetchPost(postId);
      fetchComments(postId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  // Fetch forum data for moderation permissions
  useEffect(() => {
    if (forumSlug && (!currentForum || currentForum.slug !== forumSlug)) {
      fetchForum(forumSlug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forumSlug, currentForum?.slug]);

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
      console.error('Failed to submit comment:', error);
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
      console.error('Failed to submit reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentPost) {
    return (
      <div className="flex-1 overflow-y-auto bg-dark-900 p-4">
        <div className="mx-auto max-w-4xl">
          {/* Skeleton back button */}
          <div className="mb-4 h-10 w-48 animate-pulse rounded bg-dark-800" />

          {/* Skeleton post card */}
          <div className="animate-pulse rounded-lg border border-dark-700 bg-dark-800 p-6">
            <div className="flex gap-4">
              {/* Vote sidebar skeleton */}
              <div className="flex flex-col items-center gap-2">
                <div className="h-6 w-6 rounded bg-dark-700" />
                <div className="h-5 w-10 rounded bg-dark-700" />
                <div className="h-6 w-6 rounded bg-dark-700" />
              </div>

              {/* Content skeleton */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-dark-700" />
                  <div className="h-4 w-32 rounded bg-dark-700" />
                  <div className="h-4 w-24 rounded bg-dark-700" />
                </div>
                <div className="h-8 w-3/4 rounded bg-dark-700" />
                <div className="space-y-2">
                  <div className="h-4 w-full rounded bg-dark-700" />
                  <div className="h-4 w-full rounded bg-dark-700" />
                  <div className="h-4 w-2/3 rounded bg-dark-700" />
                </div>
                <div className="flex gap-4 pt-4">
                  <div className="h-8 w-28 rounded bg-dark-700" />
                  <div className="h-8 w-20 rounded bg-dark-700" />
                  <div className="h-8 w-16 rounded bg-dark-700" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-dark-900">
      {/* Back button */}
      <div className="sticky top-0 z-10 border-b border-dark-700 bg-dark-800 px-4 py-3">
        <Link
          to={`/forums/${forumSlug}`}
          className="inline-flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span>Back to c/{forumSlug}</span>
        </Link>
      </div>

      <div className="animate-fadeIn mx-auto max-w-4xl px-4 py-4">
        {/* Post */}
        <article className="animate-slideUp rounded-lg border border-dark-700 bg-dark-800">
          <div className="flex">
            {/* Vote sidebar */}
            <div className="flex flex-col items-center gap-1 rounded-l-lg bg-dark-700/50 p-4">
              <button
                onClick={() => handleVote('post', currentPost.id, 1, currentPost.myVote)}
                className={`rounded p-1 transition-colors hover:bg-dark-600 ${
                  currentPost.myVote === 1
                    ? 'text-orange-500'
                    : 'text-gray-400 hover:text-orange-500'
                }`}
              >
                {currentPost.myVote === 1 ? (
                  <ArrowUpIconSolid className="h-6 w-6" />
                ) : (
                  <ArrowUpIcon className="h-6 w-6" />
                )}
              </button>
              <span
                className={`text-lg font-medium ${
                  currentPost.myVote === 1
                    ? 'text-orange-500'
                    : currentPost.myVote === -1
                      ? 'text-blue-500'
                      : 'text-white'
                }`}
              >
                {currentPost.score}
              </span>
              <button
                onClick={() => handleVote('post', currentPost.id, -1, currentPost.myVote)}
                className={`rounded p-1 transition-colors hover:bg-dark-600 ${
                  currentPost.myVote === -1 ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'
                }`}
              >
                {currentPost.myVote === -1 ? (
                  <ArrowDownIconSolid className="h-6 w-6" />
                ) : (
                  <ArrowDownIcon className="h-6 w-6" />
                )}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-4">
              {/* Meta */}
              <div className="mb-3 flex items-center gap-2 text-sm text-gray-400">
                <Link
                  to={`/forums/${currentPost.forum.slug}`}
                  className="flex items-center gap-2 hover:underline"
                >
                  <div className="h-6 w-6 overflow-hidden rounded-full bg-dark-600">
                    {currentPost.forum.iconUrl ? (
                      <img
                        src={currentPost.forum.iconUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs">{currentPost.forum.name.charAt(0)}</span>
                    )}
                  </div>
                  <span className="font-medium text-gray-300">c/{currentPost.forum.slug}</span>
                </Link>
                <span>•</span>
                <span>
                  Posted by{' '}
                  <Link
                    to={currentPost.author.username ? `/u/${currentPost.author.username}` : '#'}
                    className="hover:underline"
                  >
                    u/{currentPost.author.username || currentPost.author.displayName || 'unknown'}
                  </Link>
                </span>
                <span>•</span>
                <span>{formatTimeAgo(currentPost.createdAt)}</span>
              </div>

              {/* Title */}
              <div className="mb-4">
                {/* Badges Row */}
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {currentPost.isPinned && (
                    <span className="inline-flex items-center gap-1 rounded bg-green-600 px-2 py-1 text-sm">
                      <MapPinIcon className="h-3.5 w-3.5" />
                      Pinned
                    </span>
                  )}
                  {currentPost.isLocked && (
                    <span className="inline-flex items-center gap-1 rounded bg-yellow-600 px-2 py-1 text-sm">
                      <LockClosedIcon className="h-3.5 w-3.5" />
                      Locked
                    </span>
                  )}
                  {currentPost.isClosed && (
                    <span className="inline-flex items-center gap-1 rounded bg-red-600 px-2 py-1 text-sm">
                      <LockClosedIcon className="h-3.5 w-3.5" />
                      Closed
                    </span>
                  )}
                  {currentPost.isNsfw && (
                    <span className="inline-block rounded bg-red-600 px-2 py-1 text-sm">NSFW</span>
                  )}
                  {currentPost.category && (
                    <span
                      className="inline-block rounded px-2 py-1 text-sm"
                      style={{ backgroundColor: currentPost.category.color }}
                    >
                      {currentPost.category.name}
                    </span>
                  )}
                  {currentPost.prefix && <ThreadPrefix prefix={currentPost.prefix} size="md" />}
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-white">{currentPost.title}</h1>

                {/* Edit indicator */}
                {currentPost.editedAt && (
                  <button
                    onClick={() => setShowEditHistory(true)}
                    className="mt-2 flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-primary-400"
                  >
                    <ClockIcon className="h-4 w-4" />
                    <span>
                      Edited {formatTimeAgo(currentPost.editedAt)}
                      {currentPost.editedBy && ` by ${currentPost.editedBy}`}
                      {' • View history'}
                    </span>
                  </button>
                )}
              </div>

              {/* Content */}
              {currentPost.postType === 'text' && currentPost.content && (
                <div className="mb-4">
                  <MarkdownRenderer content={currentPost.content} />
                </div>
              )}

              {currentPost.postType === 'link' && currentPost.linkUrl && (
                <a
                  href={currentPost.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-4 block text-primary-400 hover:underline"
                >
                  {currentPost.linkUrl}
                </a>
              )}

              {currentPost.postType === 'image' && currentPost.mediaUrls?.[0] && (
                <div className="mb-4 overflow-hidden rounded-lg">
                  <img src={currentPost.mediaUrls[0]} alt="" className="h-auto max-w-full" />
                </div>
              )}

              {/* Poll Widget */}
              {currentPost.poll && (
                <div className="mb-4">
                  <PollWidget
                    poll={currentPost.poll}
                    threadId={currentPost.id}
                    isCreator={currentPost.authorId === user?.id}
                  />
                </div>
              )}

              {/* Attachments */}
              {currentPost.attachments && currentPost.attachments.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 text-sm font-semibold text-gray-400">
                    Attachments ({currentPost.attachments.length})
                  </h3>
                  <div className="space-y-2">
                    {currentPost.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-3 rounded-lg border border-dark-600 bg-dark-700 p-3 transition-colors hover:border-primary-500/50"
                      >
                        {/* Thumbnail or Icon */}
                        {attachment.fileType.startsWith('image/') && attachment.thumbnailUrl ? (
                          <img
                            src={attachment.thumbnailUrl}
                            alt={attachment.originalFilename}
                            className="h-12 w-12 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded bg-dark-600">
                            <span className="text-xs text-gray-400">
                              {attachment.fileType.split('/')[1]?.toUpperCase().slice(0, 4) ||
                                'FILE'}
                            </span>
                          </div>
                        )}

                        {/* File Info */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">
                            {attachment.originalFilename}
                          </p>
                          <p className="text-xs text-gray-400">
                            {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                            {attachment.downloads > 0 && (
                              <span className="ml-2">• {attachment.downloads} downloads</span>
                            )}
                          </p>
                        </div>

                        {/* Download Button */}
                        <a
                          href={attachment.downloadUrl}
                          download={attachment.originalFilename}
                          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-primary-500"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                          <span>Download</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Thread Rating */}
              {(currentPost.rating !== undefined || currentPost.ratingCount !== undefined) && (
                <div className="mb-4 border-b border-dark-700 pb-4">
                  <ThreadRating
                    threadId={currentPost.id}
                    rating={currentPost.rating}
                    ratingCount={currentPost.ratingCount}
                    myRating={currentPost.myRating}
                    size="md"
                    interactive={true}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 border-t border-dark-700 pt-4 text-gray-400">
                <span className="flex items-center gap-1.5 text-sm">
                  <ChatBubbleLeftIcon className="h-5 w-5" />
                  <span>{currentPost.commentCount} Comments</span>
                </span>
                <button className="flex items-center gap-1.5 rounded px-2 py-1 text-sm transition-colors hover:bg-dark-700">
                  <ShareIcon className="h-5 w-5" />
                  <span>Share</span>
                </button>
                <button className="flex items-center gap-1.5 rounded px-2 py-1 text-sm transition-colors hover:bg-dark-700">
                  <BookmarkIcon className="h-5 w-5" />
                  <span>Save</span>
                </button>
                <button
                  onClick={() => {
                    setIsSubscribed(!isSubscribed);
                    toast.success(
                      isSubscribed ? 'Unsubscribed from thread' : 'Subscribed to thread'
                    );
                  }}
                  className={`flex items-center gap-1.5 rounded px-2 py-1 text-sm transition-colors hover:bg-dark-700 ${
                    isSubscribed ? 'text-primary-400' : ''
                  }`}
                >
                  {isSubscribed ? (
                    <BellSlashIcon className="h-5 w-5" />
                  ) : (
                    <BellIcon className="h-5 w-5" />
                  )}
                  <span>{isSubscribed ? 'Unsubscribe' : 'Subscribe'}</span>
                </button>

                {/* More Actions Dropdown */}
                <Dropdown
                  trigger={
                    <button className="flex items-center gap-1.5 rounded px-2 py-1 text-sm transition-colors hover:bg-dark-700">
                      <EllipsisHorizontalIcon className="h-5 w-5" />
                    </button>
                  }
                >
                  {/* Moderation Actions - Only for moderators/owners */}
                  {(currentForum?.ownerId === user?.id ||
                    currentForum?.moderators?.some((m: { id: string }) => m.id === user?.id)) && (
                    <>
                      <DropdownItem
                        onClick={async () => {
                          if (!currentPost.forum?.id) return;
                          try {
                            if (currentPost.isPinned) {
                              await unpinPost(currentPost.forum.id, currentPost.id);
                              toast.success('Post unpinned');
                            } else {
                              await pinPost(currentPost.forum.id, currentPost.id);
                              toast.success('Post pinned');
                            }
                            fetchPost(currentPost.id);
                          } catch {
                            toast.error('Failed to update pin status');
                          }
                        }}
                        icon={<MapPinIcon className="h-4 w-4" />}
                      >
                        {currentPost.isPinned ? 'Unpin Post' : 'Pin Post'}
                      </DropdownItem>
                      <DropdownItem
                        onClick={async () => {
                          if (!currentPost.forum?.id) return;
                          try {
                            if (currentPost.isLocked) {
                              await unlockPost(currentPost.forum.id, currentPost.id);
                              toast.success('Post unlocked', 'Users can now comment on this post');
                            } else {
                              await lockPost(currentPost.forum.id, currentPost.id);
                              toast.success('Post locked', 'New comments are disabled');
                            }
                            fetchPost(currentPost.id);
                          } catch {
                            toast.error('Failed to update lock status');
                          }
                        }}
                        icon={
                          currentPost.isLocked ? (
                            <LockOpenIcon className="h-4 w-4" />
                          ) : (
                            <LockClosedIcon className="h-4 w-4" />
                          )
                        }
                      >
                        {currentPost.isLocked ? 'Unlock Post' : 'Lock Post'}
                      </DropdownItem>
                      <DropdownDivider />
                    </>
                  )}

                  {/* Author Actions */}
                  {currentPost.authorId === user?.id && (
                    <>
                      <DropdownItem
                        onClick={() => navigate(`/forums/${forumSlug}/posts/${postId}/edit`)}
                        icon={<PencilIcon className="h-4 w-4" />}
                      >
                        Edit Post
                      </DropdownItem>
                      <DropdownItem
                        onClick={async () => {
                          if (!currentPost.forum?.id) return;
                          if (
                            confirm(
                              'Are you sure you want to delete this post? This action cannot be undone.'
                            )
                          ) {
                            try {
                              await deletePost(currentPost.forum.id, currentPost.id);
                              toast.success('Post deleted');
                              navigate(`/forums/${forumSlug}`);
                            } catch {
                              toast.error('Failed to delete post');
                            }
                          }
                        }}
                        icon={<TrashIcon className="h-4 w-4" />}
                        danger
                      >
                        Delete Post
                      </DropdownItem>
                      <DropdownDivider />
                    </>
                  )}

                  {/* General Actions */}
                  <DropdownItem
                    onClick={() => setShowReportModal(true)}
                    icon={<FlagIcon className="h-4 w-4" />}
                  >
                    Report
                  </DropdownItem>
                </Dropdown>
              </div>
            </div>
          </div>
        </article>

        {/* Comment Input */}
        {currentPost.isLocked ? (
          <div className="mt-4 rounded-lg border border-yellow-600/50 bg-dark-800 p-4">
            <div className="flex items-center gap-3 text-yellow-400">
              <LockClosedIcon className="h-5 w-5" />
              <p className="text-sm">This post is locked. New comments are disabled.</p>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dark-700 bg-dark-800 p-4">
            <p className="mb-2 text-sm text-gray-400">
              Comment as <span className="text-primary-400">{user?.username}</span>
            </p>
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="What are your thoughts?"
              rows={4}
              className="w-full resize-none rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={handleSubmitComment}
                disabled={!commentContent.trim() || isSubmitting}
                className="rounded-full bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Comment'}
              </button>
            </div>
          </div>
        )}

        {/* Comments */}
        <div className="mt-4 space-y-4">
          {isLoadingComments ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            </div>
          ) : postComments.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            postComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onVote={(id, value, currentVote) => handleVote('comment', id, value, currentVote)}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                replyContent={replyContent}
                setReplyContent={setReplyContent}
                onSubmitReply={handleSubmitReply}
                isSubmitting={isSubmitting}
              />
            ))
          )}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-lg border border-dark-600 bg-dark-800 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Report Post</h3>
            <p className="mb-4 text-sm text-gray-400">
              Please select a reason for reporting this post. Our moderation team will review your
              report.
            </p>

            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="mb-4 w-full rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
            >
              <option value="">Select a reason...</option>
              <option value="spam">Spam or misleading</option>
              <option value="harassment">Harassment or bullying</option>
              <option value="hate_speech">Hate speech</option>
              <option value="violence">Violence or threats</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="misinformation">Misinformation</option>
              <option value="copyright">Copyright violation</option>
              <option value="other">Other</option>
            </select>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                }}
                className="px-4 py-2 text-gray-400 transition-colors hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
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
                    console.error('Failed to submit report:', err);
                    toast.error('Failed to submit report', 'Please try again later.');
                  } finally {
                    setIsReporting(false);
                  }
                }}
                disabled={!reportReason || isReporting}
                className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-600/50"
              >
                {isReporting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit History Modal */}
      <EditHistoryModal
        postId={currentPost.id}
        isOpen={showEditHistory}
        onClose={() => setShowEditHistory(false)}
      />
    </div>
  );
}

// Comment component
function CommentItem({
  comment,
  onVote,
  replyingTo,
  setReplyingTo,
  replyContent,
  setReplyContent,
  onSubmitReply,
  isSubmitting,
  depth = 0,
}: {
  comment: Comment;
  onVote: (id: string, value: 1 | -1, currentVote: 1 | -1 | null) => void;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  replyContent: string;
  setReplyContent: (content: string) => void;
  onSubmitReply: (parentId: string) => void;
  isSubmitting: boolean;
  depth?: number;
}) {
  const [isCollapsed, setIsCollapsed] = useState(comment.isCollapsed);

  const marginLeft = Math.min(depth * 24, 120);

  return (
    <div style={{ marginLeft }}>
      <div className="flex gap-2">
        {/* Thread line */}
        {depth > 0 && (
          <div className="flex flex-col items-center">
            <div
              className="w-px flex-1 cursor-pointer bg-dark-600 hover:bg-primary-500"
              onClick={() => setIsCollapsed(!isCollapsed)}
            />
          </div>
        )}

        <div className="flex-1">
          {/* Comment header */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Link
              to={comment.author.username ? `/u/${comment.author.username}` : '#'}
              className="flex items-center gap-2"
            >
              <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-dark-600">
                {comment.author.avatarUrl ? (
                  <ThemedAvatar
                    src={comment.author.avatarUrl}
                    alt={comment.author.username || comment.author.displayName || 'User'}
                    size="xs"
                    avatarBorderId={
                      comment.author.avatarBorderId ?? comment.author.avatar_border_id ?? null
                    }
                  />
                ) : (
                  <span className="text-[10px]">
                    {(comment.author.username || comment.author.displayName || '?')
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}
              </div>
              <span className="font-medium text-gray-300 hover:underline">
                {comment.author.username || comment.author.displayName || 'Unknown'}
              </span>
            </Link>
            <span>•</span>
            <span>{formatTimeAgo(comment.createdAt)}</span>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-gray-500 hover:text-white"
            >
              [{isCollapsed ? '+' : '-'}]
            </button>
          </div>

          {!isCollapsed && (
            <>
              {/* Content */}
              <div className="mt-1">
                <MarkdownRenderer content={comment.content} className="text-sm" />
              </div>

              {/* Actions */}
              <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                <button
                  onClick={() => onVote(comment.id, 1, comment.myVote)}
                  className={`rounded p-1 hover:bg-dark-700 ${
                    comment.myVote === 1 ? 'text-orange-500' : 'hover:text-orange-500'
                  }`}
                >
                  {comment.myVote === 1 ? (
                    <ArrowUpIconSolid className="h-4 w-4" />
                  ) : (
                    <ArrowUpIcon className="h-4 w-4" />
                  )}
                </button>
                <span
                  className={`font-medium ${
                    comment.myVote === 1
                      ? 'text-orange-500'
                      : comment.myVote === -1
                        ? 'text-blue-500'
                        : ''
                  }`}
                >
                  {comment.score}
                </span>
                <button
                  onClick={() => onVote(comment.id, -1, comment.myVote)}
                  className={`rounded p-1 hover:bg-dark-700 ${
                    comment.myVote === -1 ? 'text-blue-500' : 'hover:text-blue-500'
                  }`}
                >
                  {comment.myVote === -1 ? (
                    <ArrowDownIconSolid className="h-4 w-4" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="rounded px-2 py-1 transition-colors hover:bg-dark-700"
                >
                  Reply
                </button>
                <button className="rounded px-2 py-1 transition-colors hover:bg-dark-700">
                  Share
                </button>
              </div>

              {/* Reply form */}
              {replyingTo === comment.id && (
                <div className="mt-3">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    rows={3}
                    className="w-full resize-none rounded-lg border border-dark-600 bg-dark-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="px-3 py-1.5 text-sm text-gray-400 transition-colors hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => onSubmitReply(comment.id)}
                      disabled={!replyContent.trim() || isSubmitting}
                      className="rounded-full bg-primary-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              )}

              {/* Child comments */}
              {comment.children && comment.children.length > 0 && (
                <div className="mt-4 space-y-4">
                  {comment.children.map((child) => (
                    <CommentItem
                      key={child.id}
                      comment={child}
                      onVote={onVote}
                      replyingTo={replyingTo}
                      setReplyingTo={setReplyingTo}
                      replyContent={replyContent}
                      setReplyContent={setReplyContent}
                      onSubmitReply={onSubmitReply}
                      isSubmitting={isSubmitting}
                      depth={depth + 1}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForumStore, Comment } from '@/stores/forumStore';
import { useAuthStore } from '@/stores/authStore';
import { formatDistanceToNow } from 'date-fns';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import Dropdown, { DropdownItem, DropdownDivider } from '@/components/Dropdown';
import { toast } from '@/components/ui';
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
} from '@heroicons/react/24/outline';
import { ArrowUpIcon as ArrowUpIconSolid, ArrowDownIcon as ArrowDownIconSolid } from '@heroicons/react/24/solid';

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
  } = useForumStore();

  const [commentContent, setCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const postComments = postId ? comments[postId] || [] : [];

  useEffect(() => {
    if (postId) {
      fetchPost(postId);
      fetchComments(postId);
    }
  }, [postId, fetchPost, fetchComments]);

  // Fetch forum data for moderation permissions
  useEffect(() => {
    if (forumSlug && (!currentForum || currentForum.slug !== forumSlug)) {
      fetchForum(forumSlug);
    }
  }, [forumSlug, currentForum, fetchForum]);

  const handleVote = async (type: 'post' | 'comment', id: string, value: 1 | -1, currentVote: 1 | -1 | null) => {
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
        <div className="max-w-4xl mx-auto">
          {/* Skeleton back button */}
          <div className="h-10 w-48 bg-dark-800 rounded mb-4 animate-pulse" />
          
          {/* Skeleton post card */}
          <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 animate-pulse">
            <div className="flex gap-4">
              {/* Vote sidebar skeleton */}
              <div className="flex flex-col items-center gap-2">
                <div className="h-6 w-6 bg-dark-700 rounded" />
                <div className="h-5 w-10 bg-dark-700 rounded" />
                <div className="h-6 w-6 bg-dark-700 rounded" />
              </div>
              
              {/* Content skeleton */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 bg-dark-700 rounded-full" />
                  <div className="h-4 w-32 bg-dark-700 rounded" />
                  <div className="h-4 w-24 bg-dark-700 rounded" />
                </div>
                <div className="h-8 w-3/4 bg-dark-700 rounded" />
                <div className="space-y-2">
                  <div className="h-4 w-full bg-dark-700 rounded" />
                  <div className="h-4 w-full bg-dark-700 rounded" />
                  <div className="h-4 w-2/3 bg-dark-700 rounded" />
                </div>
                <div className="flex gap-4 pt-4">
                  <div className="h-8 w-28 bg-dark-700 rounded" />
                  <div className="h-8 w-20 bg-dark-700 rounded" />
                  <div className="h-8 w-16 bg-dark-700 rounded" />
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
      <div className="sticky top-0 z-10 bg-dark-800 border-b border-dark-700 px-4 py-3">
        <Link
          to={`/forums/${forumSlug}`}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span>Back to c/{forumSlug}</span>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto py-4 px-4 animate-fadeIn">
        {/* Post */}
        <article className="bg-dark-800 rounded-lg border border-dark-700 animate-slideUp">
          <div className="flex">
            {/* Vote sidebar */}
            <div className="flex flex-col items-center gap-1 p-4 bg-dark-700/50 rounded-l-lg">
              <button
                onClick={() => handleVote('post', currentPost.id, 1, currentPost.myVote)}
                className={`p-1 rounded hover:bg-dark-600 transition-colors ${
                  currentPost.myVote === 1 ? 'text-orange-500' : 'text-gray-400 hover:text-orange-500'
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
                className={`p-1 rounded hover:bg-dark-600 transition-colors ${
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
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                <Link
                  to={`/forums/${currentPost.forum.slug}`}
                  className="flex items-center gap-2 hover:underline"
                >
                  <div className="h-6 w-6 rounded-full bg-dark-600 overflow-hidden">
                    {currentPost.forum.iconUrl ? (
                      <img
                        src={currentPost.forum.iconUrl}
                        alt=""
                        className="w-full h-full object-cover"
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
                  <Link to={currentPost.author.username ? `/u/${currentPost.author.username}` : '#'} className="hover:underline">
                    u/{currentPost.author.username || currentPost.author.displayName || 'unknown'}
                  </Link>
                </span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(currentPost.createdAt), { addSuffix: true })}</span>
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-white mb-4">
                {currentPost.isPinned && (
                  <span className="inline-flex items-center gap-1 mr-2 px-2 py-1 bg-green-600 text-sm rounded">
                    <MapPinIcon className="h-3.5 w-3.5" />
                    Pinned
                  </span>
                )}
                {currentPost.isLocked && (
                  <span className="inline-flex items-center gap-1 mr-2 px-2 py-1 bg-yellow-600 text-sm rounded">
                    <LockClosedIcon className="h-3.5 w-3.5" />
                    Locked
                  </span>
                )}
                {currentPost.isNsfw && (
                  <span className="inline-block mr-2 px-2 py-1 bg-red-600 text-sm rounded">
                    NSFW
                  </span>
                )}
                {currentPost.category && (
                  <span
                    className="inline-block mr-2 px-2 py-1 text-sm rounded"
                    style={{ backgroundColor: currentPost.category.color }}
                  >
                    {currentPost.category.name}
                  </span>
                )}
                {currentPost.title}
              </h1>

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
                  className="text-primary-400 hover:underline mb-4 block"
                >
                  {currentPost.linkUrl}
                </a>
              )}

              {currentPost.postType === 'image' && currentPost.mediaUrls?.[0] && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  <img
                    src={currentPost.mediaUrls[0]}
                    alt=""
                    className="max-w-full h-auto"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 text-gray-400 pt-4 border-t border-dark-700">
                <span className="flex items-center gap-1.5 text-sm">
                  <ChatBubbleLeftIcon className="h-5 w-5" />
                  <span>{currentPost.commentCount} Comments</span>
                </span>
                <button className="flex items-center gap-1.5 text-sm hover:bg-dark-700 px-2 py-1 rounded transition-colors">
                  <ShareIcon className="h-5 w-5" />
                  <span>Share</span>
                </button>
                <button className="flex items-center gap-1.5 text-sm hover:bg-dark-700 px-2 py-1 rounded transition-colors">
                  <BookmarkIcon className="h-5 w-5" />
                  <span>Save</span>
                </button>
                
                {/* More Actions Dropdown */}
                <Dropdown
                  trigger={
                    <button className="flex items-center gap-1.5 text-sm hover:bg-dark-700 px-2 py-1 rounded transition-colors">
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
                        icon={currentPost.isLocked ? <LockOpenIcon className="h-4 w-4" /> : <LockClosedIcon className="h-4 w-4" />}
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
                          if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
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
                    onClick={() => {
                      toast.info('Report submitted', 'Our moderation team will review this post.');
                    }}
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
          <div className="mt-4 bg-dark-800 rounded-lg border border-yellow-600/50 p-4">
            <div className="flex items-center gap-3 text-yellow-400">
              <LockClosedIcon className="h-5 w-5" />
              <p className="text-sm">This post is locked. New comments are disabled.</p>
            </div>
          </div>
        ) : (
          <div className="mt-4 bg-dark-800 rounded-lg border border-dark-700 p-4">
            <p className="text-sm text-gray-400 mb-2">
              Comment as <span className="text-primary-400">{user?.username}</span>
            </p>
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="What are your thoughts?"
              rows={4}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleSubmitComment}
                disabled={!commentContent.trim() || isSubmitting}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-full transition-colors"
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
            <div className="text-center py-8 text-gray-400">
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
            <div className="w-px flex-1 bg-dark-600 hover:bg-primary-500 cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)} />
          </div>
        )}

        <div className="flex-1">
          {/* Comment header */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Link to={comment.author.username ? `/u/${comment.author.username}` : '#'} className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-dark-600 overflow-hidden flex items-center justify-center">
                {comment.author.avatarUrl ? (
                  <img src={comment.author.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px]">{(comment.author.username || comment.author.displayName || '?').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="font-medium text-gray-300 hover:underline">{comment.author.username || comment.author.displayName || 'Unknown'}</span>
            </Link>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
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
              <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                <button
                  onClick={() => onVote(comment.id, 1, comment.myVote)}
                  className={`p-1 rounded hover:bg-dark-700 ${
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
                  className={`p-1 rounded hover:bg-dark-700 ${
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
                  className="px-2 py-1 hover:bg-dark-700 rounded transition-colors"
                >
                  Reply
                </button>
                <button className="px-2 py-1 hover:bg-dark-700 rounded transition-colors">
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
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => onSubmitReply(comment.id)}
                      disabled={!replyContent.trim() || isSubmitting}
                      className="px-3 py-1.5 text-sm bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-full transition-colors"
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

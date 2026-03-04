/**
 * Post Content Display
 *
 * Renders the post body (text/link/image), poll widget, attachments,
 * and thread rating. Handles all post content types in one component.
 *
 * @module pages/forums/forum-post/PostContent
 */

import { Link } from 'react-router-dom';
import { formatTimeAgo } from '@/lib/utils';
import MarkdownRenderer from '@/components/content/markdown-renderer';
import ThreadPrefix from '@/modules/forums/components/thread-prefix';
import ThreadRating from '@/modules/forums/components/thread-rating';
import PollWidget from '@/modules/forums/components/poll-widget';
import type { Post } from '@/modules/forums/store';
import {
  MapPinIcon,
  LockClosedIcon,
  ClockIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

/** Props for PostContent */
export interface PostContentProps {
  /** The full post object from the store */
  post: Post;
  /** Current user ID for poll creator check */
  currentUserId?: string;
  /** Edit history toggle */
  onShowEditHistory: () => void;
}

/** Full post content area (meta, badges, body, attachments, rating) */
export function PostContent({ post, currentUserId, onShowEditHistory }: PostContentProps) {
  const { forum, author } = post;

  return (
    <>
      {/* Meta row */}
      <div className="mb-3 flex items-center gap-2 text-sm text-gray-400">
        <Link to={`/forums/${forum.slug}`} className="flex items-center gap-2 hover:underline">
          <div className="h-6 w-6 overflow-hidden rounded-full bg-white/[0.08]">
            {forum.iconUrl ? (
              <img src={forum.iconUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs">{forum.name.charAt(0)}</span>
            )}
          </div>
          <span className="font-medium text-gray-300">c/{forum.slug}</span>
        </Link>
        <span>•</span>
        <span>
          Posted by{' '}
          <Link to={author.username ? `/u/${author.username}` : '#'} className="hover:underline">
            u/{author.username || author.displayName || 'unknown'}
          </Link>
        </span>
        <span>•</span>
        <span>{formatTimeAgo(post.createdAt)}</span>
      </div>

      {/* Badges row */}
      <div className="mb-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {post.isPinned && (
            <span className="inline-flex items-center gap-1 rounded bg-green-600 px-2 py-1 text-sm">
              <MapPinIcon className="h-3.5 w-3.5" /> Pinned
            </span>
          )}
          {post.isLocked && (
            <span className="inline-flex items-center gap-1 rounded bg-yellow-600 px-2 py-1 text-sm">
              <LockClosedIcon className="h-3.5 w-3.5" /> Locked
            </span>
          )}
          {post.isClosed && (
            <span className="inline-flex items-center gap-1 rounded bg-red-600 px-2 py-1 text-sm">
              <LockClosedIcon className="h-3.5 w-3.5" /> Closed
            </span>
          )}
          {post.isNsfw && (
            <span className="inline-block rounded bg-red-600 px-2 py-1 text-sm">NSFW</span>
          )}
          {post.category && (
            <span
              className="inline-block rounded px-2 py-1 text-sm"
              style={{ backgroundColor: post.category.color }}
            >
              {post.category.name}
            </span>
          )}
          {post.prefix && <ThreadPrefix prefix={post.prefix} size="md" />}
        </div>

        <h1 className="text-2xl font-bold text-white">{post.title}</h1>

        {post.editedAt && (
          <button
            onClick={onShowEditHistory}
            className="mt-2 flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-primary-400"
          >
            <ClockIcon className="h-4 w-4" />
            <span>
              Edited {formatTimeAgo(post.editedAt)}
              {post.editedBy && ` by ${post.editedBy}`}
              {' • View history'}
            </span>
          </button>
        )}
      </div>

      {/* Body */}
      {post.postType === 'text' && post.content && (
        <div className="mb-4">
          <MarkdownRenderer content={post.content} />
        </div>
      )}

      {post.postType === 'link' && post.linkUrl && (
        <a
          href={post.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 block text-primary-400 hover:underline"
        >
          {post.linkUrl}
        </a>
      )}

      {post.postType === 'image' && post.mediaUrls?.[0] && (
        <div className="mb-4 overflow-hidden rounded-lg">
          <img src={post.mediaUrls[0]} alt="" className="h-auto max-w-full" />
        </div>
      )}

      {/* Poll */}
      {post.poll && (
        <div className="mb-4">
          <PollWidget
            poll={post.poll}
            threadId={post.id}
            isCreator={post.authorId === currentUserId}
          />
        </div>
      )}

      {/* Attachments */}
      {post.attachments && post.attachments.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-400">
            Attachments ({post.attachments.length})
          </h3>
          <div className="space-y-2">
            {post.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.06] p-3 transition-colors hover:border-primary-500/50"
              >
                {attachment.fileType.startsWith('image/') && attachment.thumbnailUrl ? (
                  <img
                    src={attachment.thumbnailUrl}
                    alt={attachment.originalFilename}
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-white/[0.08]">
                    <span className="text-xs text-gray-400">
                      {attachment.fileType.split('/')[1]?.toUpperCase().slice(0, 4) || 'FILE'}
                    </span>
                  </div>
                )}
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
      {(post.rating !== undefined || post.ratingCount !== undefined) && (
        <div className="mb-4 border-b border-white/[0.06] pb-4">
          <ThreadRating
            threadId={post.id}
            rating={post.rating}
            ratingCount={post.ratingCount}
            myRating={post.myRating}
            size="md"
            interactive={true}
          />
        </div>
      )}
    </>
  );
}

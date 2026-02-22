/**
 * Post Action Bar
 *
 * Bottom toolbar with comment count, share, save, subscribe,
 * and the moderation/author dropdown menu.
 *
 * @module pages/forums/forum-post/PostActionBar
 */

import { useNavigate } from 'react-router-dom';
import { useForumStore } from '@/modules/forums/store';
import { useAuthStore } from '@/modules/auth/store';
import Dropdown, { DropdownItem, DropdownDivider } from '@/components/navigation/dropdown';
import { toast } from '@/shared/components/ui';
import {
  ChatBubbleLeftIcon,
  ShareIcon,
  BookmarkIcon,
  EllipsisHorizontalIcon,
  MapPinIcon,
  LockClosedIcon,
  LockOpenIcon,
  TrashIcon,
  FlagIcon,
  PencilIcon,
  BellIcon,
  BellSlashIcon,
} from '@heroicons/react/24/outline';

/** Props for PostActionBar */
export interface PostActionBarProps {
  /** Post ID */
  postId: string;
  /** Forum slug for navigation */
  forumSlug: string;
  /** Forum ID for moderation actions */
  forumId?: string;
  /** Comment count */
  commentCount: number;
  /** Author ID */
  authorId: string;
  /** Pin status */
  isPinned: boolean;
  /** Lock status */
  isLocked: boolean;
  /** Whether the user is subscribed */
  isSubscribed: boolean;
  /** Toggle subscription */
  onToggleSubscription: () => void;
  /** Open report modal */
  onReport: () => void;
}

/** Post footer action toolbar */
export function PostActionBar({
  postId,
  forumSlug,
  forumId,
  commentCount,
  authorId,
  isPinned,
  isLocked,
  isSubscribed,
  onToggleSubscription,
  onReport,
}: PostActionBarProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentForum, pinPost, unpinPost, lockPost, unlockPost, deletePost, fetchPost } =
    useForumStore();

  const isModerator =
    currentForum?.ownerId === user?.id ||
    currentForum?.moderators?.some((m: { id: string }) => m.id === user?.id);

  return (
    <div className="flex items-center gap-4 border-t border-dark-700 pt-4 text-gray-400">
      <span className="flex items-center gap-1.5 text-sm">
        <ChatBubbleLeftIcon className="h-5 w-5" />
        <span>{commentCount} Comments</span>
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
        onClick={onToggleSubscription}
        className={`flex items-center gap-1.5 rounded px-2 py-1 text-sm transition-colors hover:bg-dark-700 ${
          isSubscribed ? 'text-primary-400' : ''
        }`}
      >
        {isSubscribed ? <BellSlashIcon className="h-5 w-5" /> : <BellIcon className="h-5 w-5" />}
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
        {/* Moderation Actions */}
        {isModerator && (
          <>
            <DropdownItem
              onClick={async () => {
                if (!forumId) return;
                try {
                  if (isPinned) {
                    await unpinPost(forumId, postId);
                    toast.success('Post unpinned');
                  } else {
                    await pinPost(forumId, postId);
                    toast.success('Post pinned');
                  }
                  fetchPost(postId);
                } catch {
                  toast.error('Failed to update pin status');
                }
              }}
              icon={<MapPinIcon className="h-4 w-4" />}
            >
              {isPinned ? 'Unpin Post' : 'Pin Post'}
            </DropdownItem>
            <DropdownItem
              onClick={async () => {
                if (!forumId) return;
                try {
                  if (isLocked) {
                    await unlockPost(forumId, postId);
                    toast.success('Post unlocked', 'Users can now comment on this post');
                  } else {
                    await lockPost(forumId, postId);
                    toast.success('Post locked', 'New comments are disabled');
                  }
                  fetchPost(postId);
                } catch {
                  toast.error('Failed to update lock status');
                }
              }}
              icon={
                isLocked ? (
                  <LockOpenIcon className="h-4 w-4" />
                ) : (
                  <LockClosedIcon className="h-4 w-4" />
                )
              }
            >
              {isLocked ? 'Unlock Post' : 'Lock Post'}
            </DropdownItem>
            <DropdownDivider />
          </>
        )}

        {/* Author Actions */}
        {authorId === user?.id && (
          <>
            <DropdownItem
              onClick={() => navigate(`/forums/${forumSlug}/posts/${postId}/edit`)}
              icon={<PencilIcon className="h-4 w-4" />}
            >
              Edit Post
            </DropdownItem>
            <DropdownItem
              onClick={async () => {
                if (!forumId) return;
                if (
                  confirm(
                    'Are you sure you want to delete this post? This action cannot be undone.'
                  )
                ) {
                  try {
                    await deletePost(forumId, postId);
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
        <DropdownItem onClick={onReport} icon={<FlagIcon className="h-4 w-4" />}>
          Report
        </DropdownItem>
      </Dropdown>
    </div>
  );
}

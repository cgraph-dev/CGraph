/**
 * WebSocket Payload Types
 *
 * Type definitions for all Phoenix channel event payloads
 * used across forum, thread, and presence channels.
 *
 * @module lib/socket/types
 */

// ── Forum/Thread Types ────────────────────────────────────────────────

/** Payload for a new thread broadcast */
export interface ForumThreadPayload {
  id: string;
  title: string;
  slug: string;
  author_id: string;
  author_username: string;
  author_avatar?: string;
  preview?: string;
  created_at: string;
  is_pinned: boolean;
  is_locked: boolean;
}

/** Payload for a forum user */
export interface ForumUserPayload {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
}

/** Payload for forum statistics */
export interface ForumStatsPayload {
  member_count: number;
  post_count: number;
  thread_count: number;
  online_count?: number;
}

/** Presence metadata for a forum member */
export interface ForumPresenceMeta {
  username: string;
  display_name?: string;
  avatar_url?: string;
  online_at: string;
  is_member: boolean;
}

/** Resolved forum presence member */
export interface ForumPresenceMember {
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  online_at: string;
  is_member: boolean;
}

/** Payload for a thread comment */
export interface ThreadCommentPayload {
  id: string;
  content: string;
  author_id: string;
  author_username?: string;
  author_display_name?: string;
  author_avatar?: string;
  parent_id?: string;
  upvotes: number;
  downvotes: number;
  score: number;
  created_at: string;
  updated_at?: string;
}

/** Payload for thread vote changes */
export interface ThreadVotePayload {
  thread_id: string;
  upvotes: number;
  downvotes: number;
  score: number;
  view_count?: number;
  comment_count?: number;
  online_count?: number;
}

/** Payload for comment vote changes */
export interface CommentVotePayload {
  comment_id: string;
  upvotes: number;
  downvotes: number;
  score: number;
}

/** Payload for typing indicators in threads */
export interface ThreadTypingPayload {
  user_id: string;
  username: string;
  display_name?: string;
  is_typing: boolean;
  started_at?: string;
}

/** A single poll option */
export interface ThreadPollOption {
  id: string;
  text: string;
  vote_count: number;
}

/** Poll data within a thread */
export interface ThreadPollData {
  id: string;
  question: string;
  options: ThreadPollOption[];
  total_votes: number;
  ends_at?: string;
}

/** Payload for poll updates */
export interface ThreadPollPayload {
  thread_id: string;
  poll: ThreadPollData;
}

/** Presence metadata for thread viewers */
export interface ThreadPresenceMeta {
  username: string;
  display_name?: string;
  avatar_url?: string;
  typing: boolean;
}

/** Resolved thread viewer */
export interface ThreadViewerPayload {
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  typing: boolean;
}

// ── Callback Interfaces ───────────────────────────────────────────────

/** Callbacks for forum channel events */
export interface ForumChannelCallbacks {
  onNewThread?: (thread: ForumThreadPayload) => void;
  onThreadPinned?: (data: { thread_id: string; is_pinned: boolean }) => void;
  onThreadLocked?: (data: { thread_id: string; is_locked: boolean }) => void;
  onThreadDeleted?: (data: { thread_id: string }) => void;
  onMemberJoined?: (user: ForumUserPayload) => void;
  onMemberLeft?: (data: { user_id: string }) => void;
  onStatsUpdate?: (stats: ForumStatsPayload) => void;
  onPresenceSync?: (members: ForumPresenceMember[]) => void;
}

/** Callbacks for thread channel events */
export interface ThreadChannelCallbacks {
  onNewComment?: (comment: ThreadCommentPayload) => void;
  onCommentEdited?: (comment: ThreadCommentPayload) => void;
  onCommentDeleted?: (data: { comment_id: string }) => void;
  onVoteChanged?: (data: ThreadVotePayload) => void;
  onCommentVoteChanged?: (data: CommentVotePayload) => void;
  onTyping?: (data: ThreadTypingPayload) => void;
  onPollUpdated?: (data: ThreadPollPayload) => void;
  onPostEdited?: (post: {
    id: string;
    content: string;
    content_html: string;
    is_edited: boolean;
    edit_count: number;
    edited_at: string;
  }) => void;
  onThreadStatusChanged?: (data: {
    thread_id: string;
    is_locked: boolean;
    is_pinned: boolean;
  }) => void;
  onPresenceSync?: (viewers: ThreadViewerPayload[]) => void;
}

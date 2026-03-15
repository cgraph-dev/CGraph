/**
 * Forum hosting API response mappers.
 * @module
 */
import type {
  Board,
  Thread,
  ThreadPost,
  ThreadAuthor,
  ForumMember,
} from './forumHostingStore.types';

// =============================================================================
// Safe extraction helpers for untyped API response data
// =============================================================================

function str(val: unknown): string {
  return typeof val === 'string' ? val : '';
}

function strOrNull(val: unknown): string | null {
  return typeof val === 'string' ? val : null;
}

function num(val: unknown): number {
  return typeof val === 'number' ? val : 0;
}

function bool(val: unknown): boolean {
  return val === true;
}

/** Narrow unknown to Record — necessary cast after runtime object check. */
function record(val: unknown): Record<string, unknown> {
   
  return typeof val === 'object' && val !== null ? (val as Record<string, unknown>) : {}; // safe downcast – runtime verified
}

// =============================================================================
// API Response Mappers
// =============================================================================

/**
 * unknown for the forums module.
 */
/**
 * Maps board from api.
 *
 * @param data - Input data.
 * @param unknown - The unknown.
 * @returns The result.
 */
export function mapBoardFromApi(data: Record<string, unknown>): Board {
  return {
    id: str(data.id),
    forumId: str(data.forum_id),
    parentBoardId: strOrNull(data.parent_board_id),
    parentId: strOrNull(data.parent_board_id),
    name: str(data.name),
    slug: str(data.slug),
    description: strOrNull(data.description),
    icon: strOrNull(data.icon),
    position: num(data.position),
    isLocked: bool(data.is_locked),
    isHidden: bool(data.is_hidden),
    threadCount: num(data.thread_count),
    postCount: num(data.post_count),
    lastPostAt: strOrNull(data.last_post_at),
    lastPostTitle: strOrNull(data.last_post_title),
    lastPostAuthor: strOrNull(data.last_post_author),
    insertedAt: str(data.inserted_at),
    updatedAt: str(data.updated_at),
  };
}

/**
 * unknown for the forums module.
 */
/**
 * Maps author from api.
 *
 * @param data - Input data.
 * @param unknown - The unknown.
 * @returns The result.
 */
export function mapAuthorFromApi(data: Record<string, unknown>): ThreadAuthor {
  return {
    id: str(data.id),
    username: str(data.username),
    displayName: str(data.display_name) || str(data.username),
    avatarUrl: strOrNull(data.avatar_url),
  };
}

/**
 * unknown for the forums module.
 */
/**
 * Maps thread from api.
 *
 * @param data - Input data.
 * @param unknown - The unknown.
 * @returns The result.
 */
export function mapThreadFromApi(data: Record<string, unknown>): Thread {
  const insertedAt = str(data.inserted_at);
  const lastPostAt = strOrNull(data.last_post_at);
  const lastPoster = data.last_poster ? mapAuthorFromApi(record(data.last_poster)) : null;

  return {
    id: str(data.id),
    boardId: str(data.board_id),
    authorId: str(data.author_id),
    title: str(data.title),
    slug: str(data.slug),
    content: strOrNull(data.content),
    contentHtml: strOrNull(data.content_html),

     
    threadType: (data.thread_type as Thread['threadType']) || 'normal', // safe downcast — API enum
    isLocked: bool(data.is_locked),
    isPinned: bool(data.is_pinned),
    isHidden: bool(data.is_hidden),
    prefix: strOrNull(data.prefix),
    prefixColor: strOrNull(data.prefix_color),
    viewCount: num(data.view_count),
    replyCount: num(data.reply_count),
    score: num(data.score),
    upvotes: num(data.upvotes),
    downvotes: num(data.downvotes),
    lastPostAt: lastPostAt,
    lastReplyAt: lastPostAt,
    lastReplyBy: lastPoster?.username || null,
    author: data.author ? mapAuthorFromApi(record(data.author)) : null,
    lastPoster: lastPoster,
    createdAt: insertedAt,
    insertedAt: insertedAt,
    updatedAt: str(data.updated_at),
  };
}

/**
 * unknown for the forums module.
 */
/**
 * Maps post from api.
 *
 * @param data - Input data.
 * @param unknown - The unknown.
 * @returns The result.
 */
export function mapPostFromApi(data: Record<string, unknown>): ThreadPost {
  return {
    id: str(data.id),
    threadId: str(data.thread_id),
    authorId: str(data.author_id),
    content: str(data.content),
    contentHtml: strOrNull(data.content_html),
    isEdited: bool(data.is_edited),
    editCount: num(data.edit_count),
    editReason: strOrNull(data.edit_reason),
    editedAt: strOrNull(data.edited_at),
    isHidden: bool(data.is_hidden),
    score: num(data.score),
    upvotes: num(data.upvotes),
    downvotes: num(data.downvotes),
    position: num(data.position),
    replyToId: strOrNull(data.reply_to_id),
    author: data.author ? mapAuthorFromApi(record(data.author)) : null,
    insertedAt: str(data.inserted_at),
    updatedAt: str(data.updated_at),
  };
}

/**
 * unknown for the forums module.
 */
/**
 * Maps member from api.
 *
 * @param data - Input data.
 * @param unknown - The unknown.
 * @returns The result.
 */
export function mapMemberFromApi(data: Record<string, unknown>): ForumMember {
  return {
    id: str(data.id),
    forumId: str(data.forum_id),
    userId: str(data.user_id),
    displayName: str(data.display_name) || str(data.username) || null,
    title: strOrNull(data.title),
    signature: strOrNull(data.signature),
    avatarUrl: strOrNull(data.avatar_url),
    postCount: num(data.post_count),
    threadCount: num(data.thread_count),
    reputation: num(data.reputation),

     
    role: (data.role as ForumMember['role']) || 'member', // safe downcast — API enum
    isBanned: bool(data.is_banned),
    joinedAt: str(data.joined_at) || str(data.inserted_at) || null,
    lastVisitAt: strOrNull(data.last_visit_at),
  };
}

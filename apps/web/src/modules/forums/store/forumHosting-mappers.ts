import type {
  Board,
  Thread,
  ThreadPost,
  ThreadAuthor,
  ForumMember,
} from './forumHostingStore.types';

// =============================================================================
// API Response Mappers
// =============================================================================

export function mapBoardFromApi(data: Record<string, unknown>): Board {
  return {
    id: data.id as string,
    forumId: data.forum_id as string,
    parentBoardId: (data.parent_board_id as string) || null,
    parentId: (data.parent_board_id as string) || null,
    name: data.name as string,
    slug: data.slug as string,
    description: (data.description as string) || null,
    icon: (data.icon as string) || null,
    position: (data.position as number) || 0,
    isLocked: (data.is_locked as boolean) || false,
    isHidden: (data.is_hidden as boolean) || false,
    threadCount: (data.thread_count as number) || 0,
    postCount: (data.post_count as number) || 0,
    lastPostAt: (data.last_post_at as string) || null,
    lastPostTitle: (data.last_post_title as string) || null,
    lastPostAuthor: (data.last_post_author as string) || null,
    insertedAt: data.inserted_at as string,
    updatedAt: data.updated_at as string,
  };
}

export function mapAuthorFromApi(data: Record<string, unknown>): ThreadAuthor {
  return {
    id: data.id as string,
    username: data.username as string,
    displayName: (data.display_name as string) || (data.username as string),
    avatarUrl: (data.avatar_url as string) || null,
  };
}

export function mapThreadFromApi(data: Record<string, unknown>): Thread {
  const insertedAt = data.inserted_at as string;
  const lastPostAt = (data.last_post_at as string) || null;
  const lastPoster = data.last_poster
    ? mapAuthorFromApi(data.last_poster as Record<string, unknown>)
    : null;

  return {
    id: data.id as string,
    boardId: data.board_id as string,
    authorId: data.author_id as string,
    title: data.title as string,
    slug: data.slug as string,
    content: (data.content as string) || null,
    contentHtml: (data.content_html as string) || null,
    threadType: (data.thread_type as Thread['threadType']) || 'normal',
    isLocked: (data.is_locked as boolean) || false,
    isPinned: (data.is_pinned as boolean) || false,
    isHidden: (data.is_hidden as boolean) || false,
    prefix: (data.prefix as string) || null,
    prefixColor: (data.prefix_color as string) || null,
    viewCount: (data.view_count as number) || 0,
    replyCount: (data.reply_count as number) || 0,
    score: (data.score as number) || 0,
    upvotes: (data.upvotes as number) || 0,
    downvotes: (data.downvotes as number) || 0,
    lastPostAt: lastPostAt,
    lastReplyAt: lastPostAt,
    lastReplyBy: lastPoster?.username || null,
    author: data.author ? mapAuthorFromApi(data.author as Record<string, unknown>) : null,
    lastPoster: lastPoster,
    createdAt: insertedAt,
    insertedAt: insertedAt,
    updatedAt: data.updated_at as string,
  };
}

export function mapPostFromApi(data: Record<string, unknown>): ThreadPost {
  return {
    id: data.id as string,
    threadId: data.thread_id as string,
    authorId: data.author_id as string,
    content: data.content as string,
    contentHtml: (data.content_html as string) || null,
    isEdited: (data.is_edited as boolean) || false,
    editCount: (data.edit_count as number) || 0,
    editReason: (data.edit_reason as string) || null,
    editedAt: (data.edited_at as string) || null,
    isHidden: (data.is_hidden as boolean) || false,
    score: (data.score as number) || 0,
    upvotes: (data.upvotes as number) || 0,
    downvotes: (data.downvotes as number) || 0,
    position: (data.position as number) || 0,
    replyToId: (data.reply_to_id as string) || null,
    author: data.author ? mapAuthorFromApi(data.author as Record<string, unknown>) : null,
    insertedAt: data.inserted_at as string,
    updatedAt: data.updated_at as string,
  };
}

export function mapMemberFromApi(data: Record<string, unknown>): ForumMember {
  return {
    id: data.id as string,
    forumId: data.forum_id as string,
    userId: data.user_id as string,
    displayName: (data.display_name as string) || (data.username as string) || null,
    title: (data.title as string) || null,
    signature: (data.signature as string) || null,
    avatarUrl: (data.avatar_url as string) || null,
    postCount: (data.post_count as number) || 0,
    threadCount: (data.thread_count as number) || 0,
    reputation: (data.reputation as number) || 0,
    role: (data.role as ForumMember['role']) || 'member',
    isBanned: (data.is_banned as boolean) || false,
    joinedAt: (data.joined_at as string) || (data.inserted_at as string) || null,
    lastVisitAt: (data.last_visit_at as string) || null,
  };
}

import type { Announcement, AnnouncementScope } from './announcementStore.types';

/**
 * Maps raw API response data to an Announcement object.
 */
export function mapAnnouncementFromApi(data: Record<string, unknown>): Announcement {
  const author = (data.author as Record<string, unknown>) || {};

  return {
    id: data.id as string,
    title: (data.title as string) || 'Untitled',
    content: (data.content as string) || '',

    scope: (data.scope as AnnouncementScope) || 'global',
    forumId: (data.forum_id as string) || null,
    forumName: data.forum_name as string | undefined,

    authorId: (data.author_id as string) || (author.id as string) || '',
    authorUsername: (data.author_username as string) || (author.username as string) || 'Unknown',
    authorDisplayName:
      (data.author_display_name as string) || (author.display_name as string) || null,
    authorAvatarUrl: (data.author_avatar_url as string) || (author.avatar_url as string) || null,

    isActive: data.is_active !== false,
    startDate: (data.start_date as string) || new Date().toISOString(),
    endDate: (data.end_date as string) || null,

    allowedGroups: (data.allowed_groups as string[]) || [],
    allowedGroupNames: data.allowed_group_names as string[] | undefined,

    priority: (data.priority as number) || 0,
    allowHtml: (data.allow_html as boolean) || false,
    allowBbcode: data.allow_bbcode !== false,
    showInIndex: data.show_in_index !== false,
    showInForumView: data.show_in_forum_view !== false,

    icon: data.icon as string | undefined,
    backgroundColor: data.background_color as string | undefined,
    textColor: data.text_color as string | undefined,

    viewCount: (data.view_count as number) || 0,

    isRead: data.is_read as boolean | undefined,
    readAt: (data.read_at as string) || null,

    createdAt: (data.created_at as string) || new Date().toISOString(),
    updatedAt:
      (data.updated_at as string) || (data.created_at as string) || new Date().toISOString(),
  };
}

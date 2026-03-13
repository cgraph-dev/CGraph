/**
 * Mappers for transforming API announcement response data.
 * @module modules/forums/store/announcement-mappers
 */
import type { Announcement, AnnouncementScope } from './announcementStore.types';

/**
 * Maps raw API response data to an Announcement object.
 */
export function mapAnnouncementFromApi(data: Record<string, unknown>): Announcement {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const author = (data.author as Record<string, unknown>) || {}; // safe downcast – API response field

  return {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    id: data.id as string, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    title: (data.title as string) || 'Untitled', // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    content: (data.content as string) || '', // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    scope: (data.scope as AnnouncementScope) || 'global', // safe downcast – API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    forumId: (data.forum_id as string) || null, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    forumName: data.forum_name as string | undefined, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    authorId: (data.author_id as string) || (author.id as string) || '', // type assertion: API response fields

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    authorUsername: (data.author_username as string) || (author.username as string) || 'Unknown', // type assertion: API response fields
    authorDisplayName:
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      (data.author_display_name as string) || (author.display_name as string) || null, // type assertion: API response fields

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    authorAvatarUrl: (data.author_avatar_url as string) || (author.avatar_url as string) || null, // type assertion: API response fields

    isActive: data.is_active !== false,

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    startDate: (data.start_date as string) || new Date().toISOString(), // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    endDate: (data.end_date as string) || null, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    allowedGroups: (data.allowed_groups as string[]) || [], // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    allowedGroupNames: data.allowed_group_names as string[] | undefined, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    priority: (data.priority as number) || 0, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    allowHtml: (data.allow_html as boolean) || false, // type assertion: API response field
    allowBbcode: data.allow_bbcode !== false,
    showInIndex: data.show_in_index !== false,
    showInForumView: data.show_in_forum_view !== false,

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    icon: data.icon as string | undefined, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    backgroundColor: data.background_color as string | undefined, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    textColor: data.text_color as string | undefined, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    viewCount: (data.view_count as number) || 0, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    isRead: data.is_read as boolean | undefined, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    readAt: (data.read_at as string) || null, // type assertion: API response field

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    createdAt: (data.created_at as string) || new Date().toISOString(), // type assertion: API response field
    updatedAt:
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      (data.updated_at as string) || (data.created_at as string) || new Date().toISOString(), // type assertion: API response fields
  };
}

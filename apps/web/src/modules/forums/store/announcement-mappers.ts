/**
 * Mappers for transforming API announcement response data.
 * @module modules/forums/store/announcement-mappers
 */
import type { Announcement, AnnouncementScope } from './announcementStore.types';

/**
 * Maps raw API response data to an Announcement object.
 */
export function mapAnnouncementFromApi(data: Record<string, unknown>): Announcement {
   
  const author = (data.author as Record<string, unknown>) || {}; // safe downcast – API response field

  return {
     
    id: data.id as string, // type assertion: API response field
     
    title: (data.title as string) || 'Untitled', // type assertion: API response field
     
    content: (data.content as string) || '', // type assertion: API response field

     
    scope: (data.scope as AnnouncementScope) || 'global', // safe downcast – API response field
     
    forumId: (data.forum_id as string) || null, // type assertion: API response field
     
    forumName: data.forum_name as string | undefined, // type assertion: API response field

     
    authorId: (data.author_id as string) || (author.id as string) || '', // type assertion: API response fields
     
    authorUsername: (data.author_username as string) || (author.username as string) || 'Unknown', // type assertion: API response fields
    authorDisplayName:
       
      (data.author_display_name as string) || (author.display_name as string) || null, // type assertion: API response fields
     
    authorAvatarUrl: (data.author_avatar_url as string) || (author.avatar_url as string) || null, // type assertion: API response fields

    isActive: data.is_active !== false,
     
    startDate: (data.start_date as string) || new Date().toISOString(), // type assertion: API response field
     
    endDate: (data.end_date as string) || null, // type assertion: API response field

     
    allowedGroups: (data.allowed_groups as string[]) || [], // type assertion: API response field
     
    allowedGroupNames: data.allowed_group_names as string[] | undefined, // type assertion: API response field

     
    priority: (data.priority as number) || 0, // type assertion: API response field
     
    allowHtml: (data.allow_html as boolean) || false, // type assertion: API response field
    allowBbcode: data.allow_bbcode !== false,
    showInIndex: data.show_in_index !== false,
    showInForumView: data.show_in_forum_view !== false,

     
    icon: data.icon as string | undefined, // type assertion: API response field
     
    backgroundColor: data.background_color as string | undefined, // type assertion: API response field
     
    textColor: data.text_color as string | undefined, // type assertion: API response field

     
    viewCount: (data.view_count as number) || 0, // type assertion: API response field

     
    isRead: data.is_read as boolean | undefined, // type assertion: API response field
     
    readAt: (data.read_at as string) || null, // type assertion: API response field

     
    createdAt: (data.created_at as string) || new Date().toISOString(), // type assertion: API response field
    updatedAt:
       
      (data.updated_at as string) || (data.created_at as string) || new Date().toISOString(), // type assertion: API response fields
  };
}

/**
 * Settings API Mappers
 *
 * Functions to map between frontend UserSettings and backend API format.
 *
 * @version 0.7.46
 */

import type { ApiSettings, UserSettings } from './settingsStore.types';

import {
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_PRIVACY_SETTINGS,
  DEFAULT_APPEARANCE_SETTINGS,
  DEFAULT_LOCALE_SETTINGS,
  DEFAULT_KEYBOARD_SETTINGS,
} from './settingsStore.types';

export function mapSettingsFromApi(data: ApiSettings): UserSettings {
  return {
    notifications: {
      emailNotifications:
        data.email_notifications ?? DEFAULT_NOTIFICATION_SETTINGS.emailNotifications,
      pushNotifications: data.push_notifications ?? DEFAULT_NOTIFICATION_SETTINGS.pushNotifications,
      notifyMessages: data.notify_messages ?? DEFAULT_NOTIFICATION_SETTINGS.notifyMessages,
      notifyMentions: data.notify_mentions ?? DEFAULT_NOTIFICATION_SETTINGS.notifyMentions,
      notifyFriendRequests:
        data.notify_friend_requests ?? DEFAULT_NOTIFICATION_SETTINGS.notifyFriendRequests,
      notifyGroupInvites:
        data.notify_group_invites ?? DEFAULT_NOTIFICATION_SETTINGS.notifyGroupInvites,
      notifyForumReplies:
        data.notify_forum_replies ?? DEFAULT_NOTIFICATION_SETTINGS.notifyForumReplies,
      notificationSound: data.notification_sound ?? DEFAULT_NOTIFICATION_SETTINGS.notificationSound,
      quietHoursEnabled:
        data.quiet_hours_enabled ?? DEFAULT_NOTIFICATION_SETTINGS.quietHoursEnabled,
      quietHoursStart: data.quiet_hours_start ?? null,
      quietHoursEnd: data.quiet_hours_end ?? null,
    },
    privacy: {
      showOnlineStatus: data.show_online_status ?? DEFAULT_PRIVACY_SETTINGS.showOnlineStatus,
      showReadReceipts: data.show_read_receipts ?? DEFAULT_PRIVACY_SETTINGS.showReadReceipts,
      showTypingIndicators:
        data.show_typing_indicators ?? DEFAULT_PRIVACY_SETTINGS.showTypingIndicators,
      profileVisibility: data.profile_visibility ?? DEFAULT_PRIVACY_SETTINGS.profileVisibility,
      allowFriendRequests:
        data.allow_friend_requests ?? DEFAULT_PRIVACY_SETTINGS.allowFriendRequests,
      allowMessageRequests:
        data.allow_message_requests ?? DEFAULT_PRIVACY_SETTINGS.allowMessageRequests,
      showInSearch: data.show_in_search ?? DEFAULT_PRIVACY_SETTINGS.showInSearch,
      allowGroupInvites: data.allow_group_invites ?? DEFAULT_PRIVACY_SETTINGS.allowGroupInvites,
      showBio: data.show_bio ?? DEFAULT_PRIVACY_SETTINGS.showBio,
      showPostCount: data.show_post_count ?? DEFAULT_PRIVACY_SETTINGS.showPostCount,
      showJoinDate: data.show_join_date ?? DEFAULT_PRIVACY_SETTINGS.showJoinDate,
      showLastActive: data.show_last_active ?? DEFAULT_PRIVACY_SETTINGS.showLastActive,
      showSocialLinks: data.show_social_links ?? DEFAULT_PRIVACY_SETTINGS.showSocialLinks,
      showActivity: data.show_activity ?? DEFAULT_PRIVACY_SETTINGS.showActivity,
      showInMemberList: data.show_in_member_list ?? DEFAULT_PRIVACY_SETTINGS.showInMemberList,
    },
    appearance: {
      theme: data.theme ?? DEFAULT_APPEARANCE_SETTINGS.theme,
      compactMode: data.compact_mode ?? DEFAULT_APPEARANCE_SETTINGS.compactMode,
      fontSize: data.font_size ?? DEFAULT_APPEARANCE_SETTINGS.fontSize,
      messageDensity: data.message_density ?? DEFAULT_APPEARANCE_SETTINGS.messageDensity,
      showAvatars: data.show_avatars ?? DEFAULT_APPEARANCE_SETTINGS.showAvatars,
      animateEmojis: data.animate_emojis ?? DEFAULT_APPEARANCE_SETTINGS.animateEmojis,
      reduceMotion: data.reduce_motion ?? DEFAULT_APPEARANCE_SETTINGS.reduceMotion,
      highContrast: data.high_contrast ?? DEFAULT_APPEARANCE_SETTINGS.highContrast,
      screenReaderOptimized:
        data.screen_reader_optimized ?? DEFAULT_APPEARANCE_SETTINGS.screenReaderOptimized,
    },
    locale: {
      language: data.language ?? DEFAULT_LOCALE_SETTINGS.language,
      timezone: data.timezone ?? DEFAULT_LOCALE_SETTINGS.timezone,
      dateFormat: data.date_format ?? DEFAULT_LOCALE_SETTINGS.dateFormat,
      timeFormat: data.time_format ?? DEFAULT_LOCALE_SETTINGS.timeFormat,
    },
    keyboard: {
      keyboardShortcutsEnabled:
        data.keyboard_shortcuts_enabled ?? DEFAULT_KEYBOARD_SETTINGS.keyboardShortcutsEnabled,
      customShortcuts: data.custom_shortcuts ?? DEFAULT_KEYBOARD_SETTINGS.customShortcuts,
    },
  };
}

export function mapSettingsToApi(settings: Partial<UserSettings>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (settings.notifications) {
    const n = settings.notifications;
    if (n.emailNotifications !== undefined) result.email_notifications = n.emailNotifications;
    if (n.pushNotifications !== undefined) result.push_notifications = n.pushNotifications;
    if (n.notifyMessages !== undefined) result.notify_messages = n.notifyMessages;
    if (n.notifyMentions !== undefined) result.notify_mentions = n.notifyMentions;
    if (n.notifyFriendRequests !== undefined)
      result.notify_friend_requests = n.notifyFriendRequests;
    if (n.notifyGroupInvites !== undefined) result.notify_group_invites = n.notifyGroupInvites;
    if (n.notifyForumReplies !== undefined) result.notify_forum_replies = n.notifyForumReplies;
    if (n.notificationSound !== undefined) result.notification_sound = n.notificationSound;
    if (n.quietHoursEnabled !== undefined) result.quiet_hours_enabled = n.quietHoursEnabled;
    if (n.quietHoursStart !== undefined) result.quiet_hours_start = n.quietHoursStart;
    if (n.quietHoursEnd !== undefined) result.quiet_hours_end = n.quietHoursEnd;
  }

  if (settings.privacy) {
    const p = settings.privacy;
    if (p.showOnlineStatus !== undefined) result.show_online_status = p.showOnlineStatus;
    if (p.showReadReceipts !== undefined) result.show_read_receipts = p.showReadReceipts;
    if (p.showTypingIndicators !== undefined)
      result.show_typing_indicators = p.showTypingIndicators;
    if (p.profileVisibility !== undefined) result.profile_visibility = p.profileVisibility;
    if (p.allowFriendRequests !== undefined) result.allow_friend_requests = p.allowFriendRequests;
    if (p.allowMessageRequests !== undefined)
      result.allow_message_requests = p.allowMessageRequests;
    if (p.showInSearch !== undefined) result.show_in_search = p.showInSearch;
    if (p.allowGroupInvites !== undefined) result.allow_group_invites = p.allowGroupInvites;
    if (p.showBio !== undefined) result.show_bio = p.showBio;
    if (p.showPostCount !== undefined) result.show_post_count = p.showPostCount;
    if (p.showJoinDate !== undefined) result.show_join_date = p.showJoinDate;
    if (p.showLastActive !== undefined) result.show_last_active = p.showLastActive;
    if (p.showSocialLinks !== undefined) result.show_social_links = p.showSocialLinks;
    if (p.showActivity !== undefined) result.show_activity = p.showActivity;
    if (p.showInMemberList !== undefined) result.show_in_member_list = p.showInMemberList;
  }

  if (settings.appearance) {
    const a = settings.appearance;
    if (a.theme !== undefined) result.theme = a.theme;
    if (a.compactMode !== undefined) result.compact_mode = a.compactMode;
    if (a.fontSize !== undefined) result.font_size = a.fontSize;
    if (a.messageDensity !== undefined) result.message_density = a.messageDensity;
    if (a.showAvatars !== undefined) result.show_avatars = a.showAvatars;
    if (a.animateEmojis !== undefined) result.animate_emojis = a.animateEmojis;
    if (a.reduceMotion !== undefined) result.reduce_motion = a.reduceMotion;
    if (a.highContrast !== undefined) result.high_contrast = a.highContrast;
    if (a.screenReaderOptimized !== undefined)
      result.screen_reader_optimized = a.screenReaderOptimized;
  }

  if (settings.locale) {
    const l = settings.locale;
    if (l.language !== undefined) result.language = l.language;
    if (l.timezone !== undefined) result.timezone = l.timezone;
    if (l.dateFormat !== undefined) result.date_format = l.dateFormat;
    if (l.timeFormat !== undefined) result.time_format = l.timeFormat;
  }

  if (settings.keyboard) {
    const k = settings.keyboard;
    if (k.keyboardShortcutsEnabled !== undefined)
      result.keyboard_shortcuts_enabled = k.keyboardShortcutsEnabled;
    if (k.customShortcuts !== undefined) result.custom_shortcuts = k.customShortcuts;
  }

  return result;
}
